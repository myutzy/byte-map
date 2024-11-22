"use client";

import { useState, useMemo } from "react";
import {
  ByteOrder,
  BitOrder,
  numberToBinary,
  numberToHex,
} from "@/utils/binaryConversion";
import { IEC_TYPES, DataTypeInfo } from "@/utils/dataTypes";
import { ConversionFormat, FORMATS } from "@/utils/conversionTypes";
import { BinaryMemoryMap } from "@/components/BinaryMemoryMap";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function Home() {
  const [number, setNumber] = useState<string>("");
  const [dataType, setDataType] = useState<DataTypeInfo>(IEC_TYPES["INT"]);
  const [byteOrder, setByteOrder] = useState<ByteOrder>("MSB");
  const [bitOrder, setBitOrder] = useState<BitOrder>("MSB");
  const [error, setError] = useState<string>("");
  const [fromFormat, setFromFormat] = useState<ConversionFormat>("Decimal");
  const [toFormat, setToFormat] = useState<ConversionFormat>("Binary");

  // Available formats for "Convert To" dropdown
  const availableToFormats = useMemo(
    () => FORMATS.filter((format) => format !== fromFormat),
    [fromFormat]
  );

  // Available formats for "Convert From" dropdown
  const availableFromFormats = useMemo(
    () => FORMATS.filter((format) => format !== toFormat),
    [toFormat]
  );

  const handleFromFormatChange = (format: ConversionFormat) => {
    setFromFormat(format);
    if (format === toFormat) {
      setToFormat(FORMATS.find((f) => f !== format) || "Binary");
    }
    setNumber("");
    setError("");
  };

  const handleToFormatChange = (format: ConversionFormat) => {
    setToFormat(format);
    if (format === fromFormat) {
      setFromFormat(FORMATS.find((f) => f !== format) || "Decimal");
    }
  };

  const handleDataTypeChange = (typeName: string) => {
    const newDataType = IEC_TYPES[typeName];
    setDataType(newDataType);

    if (number !== "" && number !== "-") {
      let numValue: number;

      switch (fromFormat) {
        case "Decimal":
          numValue = parseInt(number);
          break;
        case "Binary":
          numValue = parseInt(number.replace(/\s/g, ""), 2);
          break;
        case "Hexadecimal":
          numValue = parseInt(number.replace(/\s/g, ""), 16);
          break;
      }

      if (newDataType.unsigned && numValue < 0) {
        setNumber("");
        setError(`${newDataType.name} cannot be negative`);
      } else if (numValue < newDataType.min || numValue > newDataType.max) {
        setNumber("");
        setError(
          `Value must be between ${newDataType.min} and ${newDataType.max}`
        );
      }
    }
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    switch (fromFormat) {
      case "Decimal":
        if (value === "-") {
          if (dataType.name.match(/^(SINT|INT|DINT|LINT)$/)) {
            setNumber(value);
            setError("");
            return;
          }
          return;
        }

        if (value === "" || /^-?\d+$/.test(value)) {
          const numValue = value === "" ? 0 : parseInt(value);
          if (numValue < 0 && !dataType.name.match(/^(SINT|INT|DINT|LINT)$/)) {
            setError(`${dataType.name} cannot be negative`);
            return;
          }
          if (dataType.name === "BOOL" && numValue > 1) {
            setError("BOOL can only be 0 or 1");
            return;
          }
          if (numValue >= dataType.min && numValue <= dataType.max) {
            setNumber(value);
            setError("");
          } else {
            setError(
              `Value must be between ${dataType.min} and ${dataType.max}`
            );
          }
        }
        break;

      case "Binary":
        if (value === "" || /^[01\s]+$/.test(value)) {
          const cleanBinary = value.replace(/\s/g, "");
          if (cleanBinary.length <= dataType.bytes * 8) {
            setNumber(value);
            setError("");
          } else {
            setError(`Maximum ${dataType.bytes * 8} bits allowed`);
          }
        }
        break;

      case "Hexadecimal":
        if (value === "" || /^[0-9A-Fa-f\s]+$/.test(value)) {
          const cleanHex = value.replace(/\s/g, "");
          if (cleanHex.length <= dataType.bytes * 2) {
            setNumber(value);
            setError("");
          } else {
            setError(`Maximum ${dataType.bytes * 2} hex digits allowed`);
          }
        }
        break;
    }
  };

  // Convert input to decimal for processing
  const parsedNumber = useMemo(() => {
    if (number === "" || number === "-" || error) return 0;

    switch (fromFormat) {
      case "Decimal":
        return parseInt(number);
      case "Binary":
        return parseInt(number.replace(/\s/g, ""), 2);
      case "Hexadecimal":
        return parseInt(number.replace(/\s/g, ""), 16);
      default:
        return 0;
    }
  }, [number, fromFormat, error]);

  const getInputPlaceholder = () => {
    switch (fromFormat) {
      case "Decimal":
        return dataType.name === "BOOL"
          ? "Enter 0 or 1"
          : `Enter a ${dataType.name} value`;
      case "Binary":
        return `Enter binary value (e.g., ${
          dataType.name === "BOOL" ? "1" : "1010 1100"
        })`;
      case "Hexadecimal":
        return `Enter hex value (e.g., ${
          dataType.name === "BOOL" ? "0 or 1" : "AC"
        })`;
    }
  };

  const getOutputValue = () => {
    if (number === "" || number === "-" || error) return "";

    switch (toFormat) {
      case "Binary":
        return numberToBinary(
          parsedNumber,
          dataType.bytes,
          byteOrder,
          bitOrder
        );
      case "Hexadecimal":
        return numberToHex(parsedNumber, dataType.bytes, byteOrder, bitOrder);
      case "Decimal":
        return parsedNumber.toString();
    }
  };

  const handleSwapFormats = () => {
    setFromFormat(toFormat);
    setToFormat(fromFormat);
    setNumber(""); // Clear input when swapping
    setError("");
  };

  return (
    <main className="min-h-screen max-w-4xl mx-auto bg-white dark:bg-gray-900 p-8">
      <Header />

      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="grid grid-cols-[1fr,auto,1fr] gap-4 items-end">
          <div className="col-span-3 grid grid-cols-[1fr,auto,1fr] gap-4 items-end">
            <div>
              <label className="block text-sm font-medium mb-2">
                Convert From
              </label>
              <select
                value={fromFormat}
                onChange={(e) =>
                  handleFromFormatChange(e.target.value as ConversionFormat)
                }
                className="w-full p-2 border rounded"
              >
                {availableFromFormats.map((format) => (
                  <option key={format} value={format}>
                    {format}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleSwapFormats}
              className="p-2 hover:bg-gray-100 rounded-full mb-0.5"
              title="Swap formats"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-gray-600"
              >
                <path d="M7 16V4M7 4L3 8M7 4L11 8M17 8v12M17 20l4-4M17 20l-4-4" />
              </svg>
            </button>

            <div>
              <label className="block text-sm font-medium mb-2">
                Convert To
              </label>
              <select
                value={toFormat}
                onChange={(e) =>
                  handleToFormatChange(e.target.value as ConversionFormat)
                }
                className="w-full p-2 border rounded"
              >
                {availableToFormats.map((format) => (
                  <option key={format} value={format}>
                    {format}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-[1fr,1fr] gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              {fromFormat} Value
            </label>
            <input
              type="text"
              value={number}
              onChange={handleNumberChange}
              className={`w-full p-2 border rounded font-mono ${
                error ? "border-red-500" : ""
              }`}
              placeholder={getInputPlaceholder()}
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Data Type (IEC 61131-3)
            </label>
            <select
              value={dataType.name}
              onChange={(e) => handleDataTypeChange(e.target.value)}
              className="w-full p-2 border rounded"
            >
              {Object.values(IEC_TYPES)
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((type) => (
                  <option key={type.name} value={type.name}>
                    {type.name} ({type.bits || type.bytes * 8}-bit)
                  </option>
                ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">Byte Order</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={byteOrder === "MSB"}
                  onChange={() => setByteOrder("MSB")}
                  className="mr-2"
                />
                Big Endian
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={byteOrder === "LSB"}
                  onChange={() => setByteOrder("LSB")}
                  className="mr-2"
                />
                Little Endian
              </label>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {byteOrder === "MSB"
                ? "Big Endian: Most significant byte at lowest address. Also known as 'Motorola' format."
                : "Little Endian: Least significant byte at lowest address. Also known as 'Intel' format."}
            </p>
          </div>
        </div>

        {number !== "" && (
          <div className="space-y-4 bg-gray-50 p-4 rounded">
            <div>
              <h2 className="font-medium mb-2">{toFormat} Representation:</h2>
              <div className="font-mono bg-white p-3 rounded border">
                {getOutputValue()}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {dataType.bytes} byte{dataType.bytes > 1 ? "s" : ""} •{" "}
                {dataType.bytes * 8} bits
              </p>
              {toFormat === "Binary" &&
                !error &&
                number !== "" &&
                number !== "-" && (
                  <BinaryMemoryMap
                    binaryString={getOutputValue()}
                    byteOrder={byteOrder}
                    bitOrder={bitOrder}
                    bytes={dataType.bytes}
                  />
                )}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </main>
  );
}
