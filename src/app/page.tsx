"use client";

import { useState } from "react";
import {
  ByteOrder,
  BitOrder,
  numberToBinary,
  numberToHex,
} from "@/utils/binaryConversion";
import { IEC_TYPES, DataTypeInfo } from "@/utils/dataTypes";

export default function Home() {
  const [number, setNumber] = useState<string>("");
  const [dataType, setDataType] = useState<DataTypeInfo>(IEC_TYPES["INT"]);
  const [byteOrder, setByteOrder] = useState<ByteOrder>("MSB");
  const [bitOrder, setBitOrder] = useState<BitOrder>("MSB");
  const [error, setError] = useState<string>("");

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Allow empty input, negative sign, or digits
    if (value === "" || value === "-" || /^-?\d+$/.test(value)) {
      // For just a negative sign, allow it but don't validate range
      if (value === "-") {
        if (!dataType.unsigned) {
          setNumber(value);
          setError("");
        } else {
          setError(`${dataType.name} cannot be negative`);
        }
        return;
      }

      const numValue = value === "" ? 0 : parseInt(value);

      // For unsigned types, don't allow negative values
      if (dataType.unsigned && numValue < 0) {
        setError(`${dataType.name} cannot be negative`);
        return;
      }

      if (numValue >= dataType.min && numValue <= dataType.max) {
        setNumber(value);
        setError("");
      } else {
        setError(`Value must be between ${dataType.min} and ${dataType.max}`);
      }
    }
  };

  const handleDataTypeChange = (typeName: string) => {
    const newDataType = IEC_TYPES[typeName];
    setDataType(newDataType);

    // Validate current number against new data type
    if (number !== "" && number !== "-") {
      const numValue = parseInt(number);
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

  // Only parse number if it's not empty and not just a negative sign
  const parsedNumber = number !== "" && number !== "-" ? parseInt(number) : 0;

  return (
    <main className="min-h-screen p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">byte-map</h1>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">
            Data Type (IEC 61131-3)
          </label>
          <select
            value={dataType.name}
            onChange={(e) => handleDataTypeChange(e.target.value)}
            className="w-full p-2 border rounded"
          >
            {Object.values(IEC_TYPES).map((type) => (
              <option key={type.name} value={type.name}>
                {type.name} ({type.bytes} byte{type.bytes > 1 ? "s" : ""},{" "}
                {type.min} to {type.max})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Decimal Number
          </label>
          <input
            type="text"
            value={number}
            onChange={handleNumberChange}
            className={`w-full p-2 border rounded ${
              error ? "border-red-500" : ""
            }`}
            placeholder={`Enter a ${dataType.name} value ${
              dataType.unsigned ? "(unsigned)" : "(signed)"
            }`}
          />
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
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
                MSB First
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={byteOrder === "LSB"}
                  onChange={() => setByteOrder("LSB")}
                  className="mr-2"
                />
                LSB First
              </label>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {byteOrder === "MSB"
                ? "Big Endian: Most significant byte at lowest address"
                : "Little Endian: Least significant byte at lowest address"}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Bit Order</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={bitOrder === "MSB"}
                  onChange={() => setBitOrder("MSB")}
                  className="mr-2"
                />
                MSB First
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={bitOrder === "LSB"}
                  onChange={() => setBitOrder("LSB")}
                  className="mr-2"
                />
                LSB First
              </label>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {bitOrder === "MSB"
                ? "Big Endian: Most significant bit at lowest bit position"
                : "Little Endian: Least significant bit at lowest bit position"}
            </p>
          </div>
        </div>

        <div className="space-y-4 bg-gray-50 p-4 rounded">
          <div>
            <h2 className="font-medium mb-2">Binary Representation:</h2>
            <div className="font-mono bg-white p-3 rounded border">
              {numberToBinary(
                parsedNumber,
                dataType.bytes,
                byteOrder,
                bitOrder
              )}
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {dataType.bytes} byte{dataType.bytes > 1 ? "s" : ""} •{" "}
              {dataType.bytes * 8} bits
            </p>
          </div>

          <div>
            <h2 className="font-medium mb-2">Hexadecimal Representation:</h2>
            <div className="font-mono bg-white p-3 rounded border">
              {numberToHex(parsedNumber, dataType.bytes, byteOrder, bitOrder)}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
