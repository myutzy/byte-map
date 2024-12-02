import React from "react";
import { ByteOrder, BitOrder } from "@/utils/binaryConversion";

interface BinaryMemoryMapProps {
  binaryString: string;
  byteOrder: ByteOrder;
  bitOrder: BitOrder;
  bytes: number;
}

export function BinaryMemoryMap({
  binaryString,
  byteOrder,
  bitOrder,
  bytes,
}: BinaryMemoryMapProps) {
  // Remove spaces from binary string
  const cleanBinary = binaryString.replace(/\s/g, "");

  // Split into bytes
  const byteGroups: string[] = [];
  for (let i = 0; i < cleanBinary.length; i += 8) {
    byteGroups.push(cleanBinary.slice(i, i + 8));
  }

  // Pad with zeros if needed
  while (byteGroups.length < bytes) {
    byteGroups.push("00000000");
  }

  // Arrange bytes according to byte order
  const orderedBytes =
    byteOrder === "MSB" ? byteGroups : [...byteGroups].reverse();

  return (
    <div className="mt-2">
      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
        <span>{byteOrder === "MSB" ? "MSB → LSB" : "LSB → MSB"}</span>
        <span>Memory Address: Increasing →</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {orderedBytes.map((byte, index) => (
          <div
            key={index}
            className="border rounded p-2 bg-white dark:bg-neutral-950"
          >
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1 text-center">
              {byteOrder === "MSB"
                ? `Byte ${index}`
                : `Byte ${bytes - index - 1}`}
            </div>
            <div className="font-mono flex gap-0.5 justify-center">
              {bitOrder === "MSB"
                ? byte.split("").map((bit, bitIndex) => (
                    <span
                      key={bitIndex}
                      className={`w-4 text-center ${
                        bit === "1"
                          ? "text-blue-600 dark:text-blue-500 font-bold"
                          : "text-gray-400 dark:text-gray-300"
                      }`}
                    >
                      {bit}
                    </span>
                  ))
                : byte
                    .split("")
                    .reverse()
                    .map((bit, bitIndex) => (
                      <span
                        key={bitIndex}
                        className={`w-4 text-center ${
                          bit === "1"
                            ? "text-blue-600 font-bold"
                            : "text-gray-400"
                        }`}
                      >
                        {bit}
                      </span>
                    ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
