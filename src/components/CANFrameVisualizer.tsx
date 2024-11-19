import { useMemo } from "react";
import { ByteOrder, BitOrder, numberToBinary } from "@/utils/binaryConversion";

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

interface Props {
  dataValues: DataValue[];
  mode: "Encode" | "Decode";
  frameBytes: string[];
  onByteChange?: (index: number, value: string) => void;
}

export function CANFrameVisualizer({
  dataValues,
  mode,
  frameBytes,
  onByteChange,
}: Props) {
  // Only calculate encoded bytes in Encode mode
  const encodedBytes = useMemo(() => {
    if (mode === "Decode") return frameBytes;

    // Initialize 8 bytes with zeros
    const bytes = new Array(8).fill("00000000");

    dataValues.forEach((value) => {
      if (!value.value || isNaN(parseInt(value.value))) return;

      const numValue = parseInt(value.value);

      // Handle signed values
      let binaryValue: string;
      if (value.signed && numValue < 0) {
        // For negative numbers, we need to calculate the two's complement
        const absoluteValue = Math.abs(numValue);
        const maxUnsignedValue = Math.pow(2, value.bitLength);
        const twosComplement = maxUnsignedValue - absoluteValue;
        binaryValue = twosComplement.toString(2).padStart(value.bitLength, "1");
      } else {
        // For positive numbers or unsigned values
        binaryValue = numValue.toString(2).padStart(value.bitLength, "0");
      }

      // Calculate which bytes this value affects
      const startByte = Math.floor(value.bitStart / 8);
      const endByte = Math.floor((value.bitStart + value.bitLength - 1) / 8);

      // Handle byte ordering
      let orderedBinaryValue = binaryValue;
      if (value.byteOrder === "LSB") {
        // Reverse byte order
        const byteCount = Math.ceil(value.bitLength / 8);
        const bytes = [];
        for (let i = 0; i < byteCount; i++) {
          const start = i * 8;
          const end = Math.min(start + 8, value.bitLength);
          bytes.push(binaryValue.slice(start, end).padStart(8, "0"));
        }
        orderedBinaryValue = bytes.reverse().join("");
      }

      // Handle bit ordering within each byte
      if (value.bitOrder === "LSB") {
        // Reverse bits within each byte
        const byteCount = Math.ceil(orderedBinaryValue.length / 8);
        orderedBinaryValue = Array.from({ length: byteCount })
          .map((_, i) => {
            const start = i * 8;
            const byte = orderedBinaryValue
              .slice(start, start + 8)
              .padStart(8, "0");
            return byte.split("").reverse().join("");
          })
          .join("");
      }

      // Update the affected bytes
      for (let i = startByte; i <= endByte && i < 8; i++) {
        const byteStartBit = i * 8;
        const valueStartBit = Math.max(0, value.bitStart - byteStartBit);
        const valueEndBit = Math.min(
          8,
          value.bitStart + value.bitLength - byteStartBit
        );

        if (valueStartBit < 8 && valueEndBit > 0) {
          const currentByte = bytes[i].split("");
          const binaryIndex = (i - startByte) * 8;

          for (let bit = valueStartBit; bit < valueEndBit; bit++) {
            const valueBitIndex = binaryIndex + (bit - valueStartBit);
            currentByte[bit] = orderedBinaryValue[valueBitIndex] || "0";
          }
          bytes[i] = currentByte.join("");
        }
      }
    });

    return bytes;
  }, [dataValues, mode, frameBytes]);

  const handleHexInput = (index: number, hexValue: string) => {
    const cleanHex = hexValue.replace(/[^0-9A-Fa-f]/g, "");
    if (cleanHex.length <= 2) {
      onByteChange?.(index, cleanHex.toUpperCase() || "00");
    }
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-8 gap-1 text-xs text-center text-gray-500">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i}>Byte {i}</div>
        ))}
      </div>
      <div className="grid grid-cols-8 gap-1">
        {encodedBytes.map((byte, i) => {
          const hexValue =
            mode === "Decode"
              ? frameBytes[i]
              : parseInt(byte, 2).toString(16).padStart(2, "0").toUpperCase();
          const binaryValue =
            mode === "Decode"
              ? parseInt(hexValue || "0", 16)
                  .toString(2)
                  .padStart(8, "0")
              : byte;

          return (
            <div key={i} className="space-y-1">
              <div className="aspect-square border rounded bg-white flex flex-col items-center justify-center font-mono text-sm">
                <div className="text-xs font-mono text-center">
                  {mode === "Encode" ? (
                    <div className="text-xs font-mono text-center">
                      <span className="text-gray-400">0x</span>
                      <span
                        className={
                          hexValue === "00" ? "text-gray-400" : "text-blue-600"
                        }
                      >
                        {hexValue}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <span className="text-gray-400 mr-0.5">0x</span>
                      <input
                        type="text"
                        value={hexValue === "00" ? "" : hexValue}
                        onChange={(e) => handleHexInput(i, e.target.value)}
                        placeholder="00"
                        className="w-6 text-center border rounded px-0.5 text-blue-600 placeholder-gray-400"
                      />
                    </div>
                  )}
                  <div className="mt-1">
                    {binaryValue.split("").map((bit: string, j: number) => (
                      <span
                        key={j}
                        className={`${
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
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
