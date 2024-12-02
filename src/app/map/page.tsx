"use client";

import { useState, useEffect } from "react";
import { ByteOrder, BitOrder } from "@/utils/binaryConversion";
import { Header } from "@/components/Header";
import { CANFrameVisualizer } from "@/components/CANFrameVisualizer";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { CopyFrameButton } from "@/components/ui/copy-frame-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DataValue {
  id: string;
  label: string;
  bitStart: number;
  bitLength: number;
  byteOrder: ByteOrder;
  bitOrder: BitOrder;
  value: string;
  signed: boolean;
  error?: string;
}

interface Signal {
  id: string;
  name: string;
  bitStart: number;
  bitLength: number;
  byteOrder: ByteOrder;
  bitOrder: BitOrder;
  value: string;
  signed: boolean;
  error?: string;
}

interface BitCalculatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCalculate: (bitStart: number) => void;
  initialBitStart?: number;
}

function BitCalculator({
  open,
  onOpenChange,
  onCalculate,
  initialBitStart = 0,
}: BitCalculatorProps) {
  const [byte, setByte] = useState(() =>
    initialBitStart ? Math.floor(initialBitStart / 8).toString() : ""
  );
  const [bit, setBit] = useState(() =>
    initialBitStart ? (initialBitStart % 8).toString() : ""
  );

  useEffect(() => {
    if (open) {
      if (initialBitStart) {
        setByte(Math.floor(initialBitStart / 8).toString());
        setBit((initialBitStart % 8).toString());
      } else {
        setByte("");
        setBit("");
      }
    }
  }, [open, initialBitStart]);

  const handleCalculate = () => {
    const byteNum = parseInt(byte);
    const bitNum = parseInt(bit);

    if (
      !isNaN(byteNum) &&
      !isNaN(bitNum) &&
      byteNum >= 0 &&
      byteNum <= 7 &&
      bitNum >= 0 &&
      bitNum <= 7
    ) {
      const bitStart = byteNum * 8 + bitNum;
      onCalculate(bitStart);
      onOpenChange(false);
      setByte("");
      setBit("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Calculate Bit Start Position</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="byte" className="text-right">
              Byte (0-7):
            </label>
            <Input
              id="byte"
              type="number"
              min="0"
              max="7"
              value={byte}
              onChange={(e) => setByte(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="bit" className="text-right">
              Bit (0-7):
            </label>
            <Input
              id="bit"
              type="number"
              min="0"
              max="7"
              value={bit}
              onChange={(e) => setBit(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCalculate}>OK</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const STORAGE_KEY = "byte-map-signals";
const BYTE_ORDER_KEY = "byte-map-byte-order";

// Load initial state from localStorage
const getInitialState = (): Signal[] => {
  if (typeof window === "undefined") return [];

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    console.error("Failed to load saved data values:", e);
    return [];
  }
};

const getInitialByteOrder = (): ByteOrder => {
  if (typeof window === "undefined") return "MSB";
  return (localStorage.getItem(BYTE_ORDER_KEY) as ByteOrder) || "MSB";
};

export default function MapPage() {
  const [signals, setSignals] = useState<Signal[]>(getInitialState);
  const [mode, setMode] = useState<"Encode" | "Decode">("Encode");
  const [globalByteOrder, setGlobalByteOrder] =
    useState<ByteOrder>(getInitialByteOrder);
  const [frameBytes, setFrameBytes] = useState<string[]>(
    new Array(8).fill("00")
  );
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [activeValueId, setActiveValueId] = useState<string | null>(null);
  const [importConfirmOpen, setImportConfirmOpen] = useState(false);
  const [pendingImport, setPendingImport] = useState<{
    format: "json" | "csv";
    file: File | null;
  } | null>(null);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);

  // Wrapper for setDataValues that also updates localStorage
  const updateSignals = (
    newSignals: Signal[] | ((prev: Signal[]) => Signal[])
  ) => {
    setSignals((currentSignals) => {
      const nextSignals =
        typeof newSignals === "function"
          ? newSignals(currentSignals)
          : newSignals;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSignals));
      return nextSignals;
    });
  };

  const addSignal = () => {
    const newSignal: Signal = {
      id: crypto.randomUUID(),
      name: "",
      bitStart: 0,
      bitLength: 8,
      byteOrder: globalByteOrder,
      bitOrder: "MSB",
      value: "",
      signed: false,
    };
    updateSignals([...signals, newSignal]);
  };

  const deleteSignal = (id: string) => {
    updateSignals(signals.filter((signal) => signal.id !== id));
  };

  const validateSignal = (signal: Signal): string => {
    if (signal.bitStart < 0 || signal.bitStart > 63) {
      return "Bit start must be between 0 and 63";
    }
    if (signal.bitLength < 1 || signal.bitLength > 64) {
      return "Bit length must be between 1 and 64";
    }
    if (signal.bitStart + signal.bitLength > 64) {
      return "Value extends beyond the 64-bit frame";
    }
    if (signal.value && isNaN(parseInt(signal.value))) {
      return "Value must be a valid number";
    }

    if (signal.value) {
      const numValue = parseInt(signal.value);
      const maxValue = signal.signed
        ? Math.pow(2, signal.bitLength - 1) - 1
        : Math.pow(2, signal.bitLength) - 1;
      const minValue = signal.signed ? -Math.pow(2, signal.bitLength - 1) : 0;

      if (numValue > maxValue || numValue < minValue) {
        return `Value must be between ${minValue} and ${maxValue}`;
      }
    }

    return "";
  };

  const updateSignal = (id: string, field: keyof Signal, value: any) => {
    updateSignals(
      signals.map((item) => {
        if (item.id !== id) return item;
        const updatedValue = { ...item, [field]: value };
        const error = validateSignal(updatedValue);
        return {
          ...updatedValue,
          error,
        };
      })
    );
  };

  const handleClearValues = () => {
    setClearConfirmOpen(true);
  };

  const handleByteChange = (index: number, hexValue: string) => {
    const newFrameBytes = [...frameBytes];
    newFrameBytes[index] = hexValue === "" ? "00" : hexValue;
    setFrameBytes(newFrameBytes);
  };

  const getDecodedValue = (value: Signal): string => {
    if (mode !== "Decode") return value.value;

    try {
      // Convert frame bytes to binary string
      const binaryString = frameBytes
        .map((hex) => parseInt(hex, 16).toString(2).padStart(8, "0"))
        .join("");

      // Extract bits for this value
      const bits = binaryString.slice(
        value.bitStart,
        value.bitStart + value.bitLength
      );

      // Handle byte and bit ordering
      let orderedBits = bits;
      if (value.byteOrder === "LSB") {
        // Reverse byte order
        const bytes = [];
        for (let i = 0; i < bits.length; i += 8) {
          bytes.push(bits.slice(i, i + 8).padStart(8, "0"));
        }
        orderedBits = bytes.reverse().join("");
      }

      if (value.bitOrder === "LSB") {
        // Reverse bits within each byte
        const bytes = [];
        for (let i = 0; i < orderedBits.length; i += 8) {
          const byte = orderedBits.slice(i, i + 8).padStart(8, "0");
          bytes.push(byte.split("").reverse().join(""));
        }
        orderedBits = bytes.join("");
      }

      // Convert to number
      let numValue = parseInt(orderedBits, 2);

      // Handle signed values
      if (value.signed && orderedBits[0] === "1") {
        numValue = numValue - Math.pow(2, value.bitLength);
      }

      return numValue.toString();
    } catch (e) {
      return "Error";
    }
  };

  const handleByteOrderChange = (newOrder: ByteOrder) => {
    setGlobalByteOrder(newOrder);
    localStorage.setItem(BYTE_ORDER_KEY, newOrder);

    // Update all data values with the new byte order
    updateSignals(
      signals.map((value) => ({
        ...value,
        byteOrder: newOrder,
      }))
    );
  };

  const handleBitCalculation = (bitStart: number) => {
    if (activeValueId) {
      updateSignal(activeValueId, "bitStart", bitStart);
    }
  };

  const formatTimestamp = () => {
    return new Date()
      .toISOString()
      .replace(/[-:]|\.\d+/g, "") // Remove dashes, colons and decimal seconds
      .replace(/(\d{8})(\d{4}).*/, "$1T$2Z"); // Format as YYYYMMDDTHHMM
  };

  const handleExport = (format: "json" | "csv") => {
    const timestamp = formatTimestamp();

    if (format === "json") {
      const exportData = signals.map(({ bitOrder, error, ...rest }) => rest);
      const jsonStr = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `byte-map-${timestamp}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const headers = [
        "name",
        "bitStart",
        "bitLength",
        "byteOrder",
        "signed",
        "value",
      ];
      const csvContent = [
        headers.join(","),
        ...signals.map((dv) =>
          [
            dv.name,
            dv.bitStart,
            dv.bitLength,
            dv.byteOrder,
            dv.signed,
            dv.value,
          ].join(",")
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `byte-map-${timestamp}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleImport = async (format: "json" | "csv") => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = format === "json" ? ".json" : ".csv";

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      if (signals.length > 0) {
        setPendingImport({ format, file });
        setImportConfirmOpen(true);
      } else {
        processImport(format, file);
      }
    };

    input.click();
  };

  const processImport = async (format: "json" | "csv", file: File) => {
    try {
      const text = await file.text();

      if (format === "json") {
        const imported = JSON.parse(text);
        if (Array.isArray(imported)) {
          const processedValues = imported.map((value) => ({
            ...value,
            id: crypto.randomUUID(),
            bitOrder: "MSB" as BitOrder,
          }));
          updateSignals(processedValues);
        }
      } else {
        const lines = text.split("\n");
        const headers = lines[0].split(",");
        const values = lines.slice(1).map((line) => {
          const parts = line.split(",");
          return {
            id: crypto.randomUUID(),
            name: parts[0],
            bitStart: parseInt(parts[1]),
            bitLength: parseInt(parts[2]),
            byteOrder: parts[3] as ByteOrder,
            bitOrder: "MSB" as BitOrder,
            signed: parts[4] === "true",
            value: parts[5],
          };
        });
        updateSignals(values);
      }
    } catch (error) {
      console.error("Import failed:", error);
      alert("Failed to import file. Please check the format and try again.");
    }
  };

  return (
    <main className="min-h-screen max-w-4xl mx-auto bg-white dark:bg-neutral-900 p-8">
      <Header />
      {/* Memory Map Display */}
      <div className="bg-gray-50 dark:bg-neutral-900 rounded border mb-8">
        <div className="flex px-4 py-2 justify-between items-center dark:bg-neutral-950 mb-2">
          <h2 className="font-medium">Data Frame</h2>
          <div className="inline-flex rounded-lg border border-gray-200 dark:border-neutral-800 p-1 bg-white dark:bg-neutral-950">
            <button
              onClick={() => setMode("Encode")}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                mode === "Encode"
                  ? "bg-blue-500 text-white"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Encode
            </button>
            <button
              onClick={() => setMode("Decode")}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                mode === "Decode"
                  ? "bg-blue-500 text-white"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Decode
            </button>
          </div>
          <CopyFrameButton frameBytes={frameBytes} />
        </div>
        <CANFrameVisualizer
          signals={signals}
          mode={mode}
          frameBytes={frameBytes}
          onByteChange={handleByteChange}
        />
      </div>

      {/* Data Values Table */}
      <div className="bg-white dark:bg-neutral-900 rounded border">
        <div className="px-4 py-2 border-b bg-gray-50 dark:bg-neutral-950 flex justify-between items-center">
          <h2 className="font-medium">Signals</h2>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Byte Order:</label>
              <select
                value={globalByteOrder}
                onChange={(e) =>
                  handleByteOrderChange(e.target.value as ByteOrder)
                }
                className="p-1 border rounded"
              >
                <option value="MSB">Big Endian</option>
                <option value="LSB">Little Endian</option>
              </select>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 hover:dark:bg-neutral-700">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleImport("json")}>
                  JSON
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleImport("csv")}>
                  CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 hover:dark:bg-neutral-700">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleExport("json")}>
                  JSON
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("csv")}>
                  CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {signals.length > 0 && (
              <button
                onClick={handleClearValues}
                className="px-3 py-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-white rounded hover:bg-red-200 hover:dark:bg-red-800"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Bit Start</th>
                <th className="p-3 text-left">Bit Length</th>
                <th className="p-3 text-left">Signed</th>
                <th className="p-3 text-left">Value</th>
                <th className="p-3 text-left"></th>
              </tr>
            </thead>
            <tbody>
              {signals.map((value) => (
                <tr key={value.id} className="border-b">
                  <td className="p-3">
                    <input
                      type="text"
                      value={value.name}
                      onChange={(e) =>
                        updateSignal(value.id, "name", e.target.value)
                      }
                      className="w-full p-1 border rounded"
                      placeholder="Enter name"
                    />
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="63"
                        value={value.bitStart}
                        onChange={(e) =>
                          updateSignal(
                            value.id,
                            "bitStart",
                            parseInt(e.target.value)
                          )
                        }
                        className="w-20 p-1 border rounded"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setActiveValueId(value.id);
                          setCalculatorOpen(true);
                        }}
                        className="h-8 w-8"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect
                            x="4"
                            y="4"
                            width="16"
                            height="16"
                            rx="2"
                            ry="2"
                          />
                          <line x1="8" y1="9" x2="16" y2="9" />
                          <line x1="8" y1="12" x2="16" y2="12" />
                          <line x1="8" y1="15" x2="16" y2="15" />
                        </svg>
                      </Button>
                    </div>
                  </td>
                  <td className="p-3">
                    <input
                      type="number"
                      min="1"
                      max="64"
                      value={value.bitLength}
                      onChange={(e) =>
                        updateSignal(
                          value.id,
                          "bitLength",
                          parseInt(e.target.value)
                        )
                      }
                      className="w-20 p-1 border rounded"
                    />
                  </td>
                  <td className="p-3">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={value.signed}
                        onChange={(e) =>
                          updateSignal(value.id, "signed", e.target.checked)
                        }
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">Signed</span>
                    </label>
                  </td>
                  <td className="p-3">
                    {mode === "Encode" ? (
                      <input
                        type="text"
                        value={value.value}
                        onChange={(e) =>
                          updateSignal(value.id, "value", e.target.value)
                        }
                        className={`w-24 p-1 border rounded ${
                          value.error ? "border-red-500" : ""
                        }`}
                        placeholder="Enter value"
                      />
                    ) : (
                      <div className="p-1 font-mono">
                        {getDecodedValue(value)}
                      </div>
                    )}
                    {mode === "Encode" && value.error && value.value && (
                      <div className="text-red-500 text-xs mt-1">
                        {value.error}
                      </div>
                    )}
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => deleteSignal(value.id)}
                      className="p-1 text-red-500 hover:text-red-700"
                      title="Delete"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M3 6h18" />
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
              {signals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-gray-500">
                    No signals added. Would you like to{" "}
                    <button
                      onClick={addSignal}
                      className="text-blue-500 hover:text-blue-700 hover:underline"
                    >
                      add one
                    </button>
                    ?
                  </td>
                </tr>
              ) : null}
              <tr className="border-t">
                <td colSpan={6} className="p-4">
                  <button
                    onClick={addSignal}
                    className="px-3 py-2 bg-gray-50 text-gray-700 border border-gray-200 rounded hover:bg-gray-100 flex items-center justify-center gap-2 transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Add Signal
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <Footer />
      <BitCalculator
        open={calculatorOpen}
        onOpenChange={setCalculatorOpen}
        onCalculate={handleBitCalculation}
        initialBitStart={
          activeValueId
            ? signals.find((v) => v.id === activeValueId)?.bitStart
            : 0
        }
      />
      <AlertDialog open={importConfirmOpen} onOpenChange={setImportConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Import</AlertDialogTitle>
            <AlertDialogDescription>
              This will overwrite your existing signals. Are you sure you want
              to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setPendingImport(null);
                setImportConfirmOpen(false);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingImport) {
                  processImport(pendingImport.format, pendingImport.file!);
                }
                setPendingImport(null);
                setImportConfirmOpen(false);
              }}
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={clearConfirmOpen} onOpenChange={setClearConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Signals</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all signals from your configuration. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setClearConfirmOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                updateSignals([]);
                setClearConfirmOpen(false);
              }}
              className="bg-red-500 hover:bg-red-600"
            >
              Clear All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
