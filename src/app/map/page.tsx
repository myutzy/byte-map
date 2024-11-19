"use client";

import { useState } from "react";
import { ByteOrder, BitOrder } from "@/utils/binaryConversion";
import { Header } from "@/components/Header";
import { CANFrameVisualizer } from "@/components/CANFrameVisualizer";

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

const STORAGE_KEY = "byte-map-data-values";

// Load initial state from localStorage
const getInitialState = (): DataValue[] => {
  if (typeof window === "undefined") return [];

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    console.error("Failed to load saved data values:", e);
    return [];
  }
};

export default function MapPage() {
  const [dataValues, setDataValues] = useState<DataValue[]>(getInitialState);
  const [mode, setMode] = useState<"Encode" | "Decode">("Encode");
  const [frameBytes, setFrameBytes] = useState<string[]>(
    new Array(8).fill("00")
  );

  // Wrapper for setDataValues that also updates localStorage
  const updateDataValues = (
    newValues: DataValue[] | ((prev: DataValue[]) => DataValue[])
  ) => {
    setDataValues((currentValues) => {
      const nextValues =
        typeof newValues === "function" ? newValues(currentValues) : newValues;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextValues));
      return nextValues;
    });
  };

  const addDataValue = () => {
    const newValue: DataValue = {
      id: crypto.randomUUID(),
      label: "",
      bitStart: 0,
      bitLength: 8,
      byteOrder: "MSB",
      bitOrder: "MSB",
      value: "",
      signed: false,
    };
    updateDataValues([...dataValues, newValue]);
  };

  const deleteDataValue = (id: string) => {
    updateDataValues(dataValues.filter((value) => value.id !== id));
  };

  const validateDataValue = (value: DataValue): string => {
    if (value.bitStart < 0 || value.bitStart > 63) {
      return "Bit start must be between 0 and 63";
    }
    if (value.bitLength < 1 || value.bitLength > 64) {
      return "Bit length must be between 1 and 64";
    }
    if (value.bitStart + value.bitLength > 64) {
      return "Value extends beyond the 64-bit frame";
    }
    if (value.value && isNaN(parseInt(value.value))) {
      return "Value must be a valid number";
    }

    if (value.value) {
      const numValue = parseInt(value.value);
      const maxValue = value.signed
        ? Math.pow(2, value.bitLength - 1) - 1
        : Math.pow(2, value.bitLength) - 1;
      const minValue = value.signed ? -Math.pow(2, value.bitLength - 1) : 0;

      if (numValue > maxValue || numValue < minValue) {
        return `Value must be between ${minValue} and ${maxValue}`;
      }
    }

    return "";
  };

  const updateDataValue = (id: string, field: keyof DataValue, value: any) => {
    updateDataValues(
      dataValues.map((item) => {
        if (item.id !== id) return item;
        const updatedValue = { ...item, [field]: value };
        const error = validateDataValue(updatedValue);
        return {
          ...updatedValue,
          error,
        };
      })
    );
  };

  const handleClearValues = () => {
    if (window.confirm("Are you sure you want to clear all data values?")) {
      updateDataValues([]);
    }
  };

  const handleByteChange = (index: number, hexValue: string) => {
    const newFrameBytes = [...frameBytes];
    newFrameBytes[index] = hexValue === "" ? "00" : hexValue;
    setFrameBytes(newFrameBytes);
  };

  const getDecodedValue = (value: DataValue): string => {
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

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <Header />
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold">Map</h2>
        <div className="flex-1 flex justify-center">
          <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-white">
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
        </div>
        <div className="w-[100px]"></div>
      </div>

      {/* Memory Map Display */}
      <div className="bg-gray-50 p-4 rounded mb-8">
        <h2 className="font-medium mb-4">CAN Data Frame (8 bytes)</h2>
        <CANFrameVisualizer
          dataValues={dataValues}
          mode={mode}
          frameBytes={frameBytes}
          onByteChange={handleByteChange}
        />
      </div>

      {/* Data Values Table */}
      <div className="bg-white rounded border">
        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
          <h2 className="font-medium">Data Values</h2>
          <div className="flex gap-2">
            {dataValues.length > 0 && (
              <button
                onClick={handleClearValues}
                className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
              >
                Clear
              </button>
            )}
            <button
              onClick={addDataValue}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Add Value
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="p-3 text-left">Label</th>
                <th className="p-3 text-left">Bit Start</th>
                <th className="p-3 text-left">Bit Length</th>
                <th className="p-3 text-left">Signed</th>
                <th className="p-3 text-left">Byte Order</th>
                <th className="p-3 text-left">Bit Order</th>
                <th className="p-3 text-left">Value</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {dataValues.map((value) => (
                <tr key={value.id} className="border-b">
                  <td className="p-3">
                    <input
                      type="text"
                      value={value.label}
                      onChange={(e) =>
                        updateDataValue(value.id, "label", e.target.value)
                      }
                      className="w-full p-1 border rounded"
                      placeholder="Enter label"
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="number"
                      min="0"
                      max="63"
                      value={value.bitStart}
                      onChange={(e) =>
                        updateDataValue(
                          value.id,
                          "bitStart",
                          parseInt(e.target.value)
                        )
                      }
                      className="w-20 p-1 border rounded"
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="number"
                      min="1"
                      max="64"
                      value={value.bitLength}
                      onChange={(e) =>
                        updateDataValue(
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
                          updateDataValue(value.id, "signed", e.target.checked)
                        }
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">Signed</span>
                    </label>
                  </td>
                  <td className="p-3">
                    <select
                      value={value.byteOrder}
                      onChange={(e) =>
                        updateDataValue(
                          value.id,
                          "byteOrder",
                          e.target.value as ByteOrder
                        )
                      }
                      className="p-1 border rounded"
                    >
                      <option value="MSB">MSB First</option>
                      <option value="LSB">LSB First</option>
                    </select>
                  </td>
                  <td className="p-3">
                    <select
                      value={value.bitOrder}
                      onChange={(e) =>
                        updateDataValue(
                          value.id,
                          "bitOrder",
                          e.target.value as BitOrder
                        )
                      }
                      className="p-1 border rounded"
                    >
                      <option value="MSB">MSB First</option>
                      <option value="LSB">LSB First</option>
                    </select>
                  </td>
                  <td className="p-3">
                    {mode === "Encode" ? (
                      <input
                        type="text"
                        value={value.value}
                        onChange={(e) =>
                          updateDataValue(value.id, "value", e.target.value)
                        }
                        className={`w-full p-1 border rounded ${
                          value.error ? "border-red-500" : ""
                        }`}
                        placeholder="Enter value"
                      />
                    ) : (
                      <div className="p-1 font-mono">
                        {getDecodedValue(value)}
                      </div>
                    )}
                    {mode === "Encode" && value.error && (
                      <div className="text-red-500 text-xs mt-1">
                        {value.error}
                      </div>
                    )}
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => deleteDataValue(value.id)}
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
              {dataValues.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-gray-500">
                    No data values added. Click "Add Value" to begin.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
