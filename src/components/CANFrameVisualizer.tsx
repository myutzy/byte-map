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
}

interface Props {
  dataValues: DataValue[];
}

export function CANFrameVisualizer({ dataValues }: Props) {
  // Calculate the binary representation for each byte
  const frameBytes = useMemo(() => {
    // Initialize 8 bytes with zeros
    const bytes = new Array(8).fill("00000000");

    dataValues.forEach((value) => {
      if (!value.value || isNaN(parseInt(value.value))) return;

      const numValue = parseInt(value.value);
      const binaryStr = numberToBinary(
        numValue,
        Math.ceil(value.bitLength / 8),
        value.byteOrder,
        value.bitOrder
      ).replace(/\s/g, "");

      // Calculate which bytes this value affects
      const startByte = Math.floor(value.bitStart / 8);
      const endByte = Math.floor((value.bitStart + value.bitLength - 1) / 8);

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
          for (let bit = valueStartBit; bit < valueEndBit; bit++) {
            const valueBitIndex = bit - valueStartBit;
            currentByte[bit] = binaryStr[valueBitIndex] || "0";
          }
          bytes[i] = currentByte.join("");
        }
      }
    });

    return bytes;
  }, [dataValues]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-8 gap-1">
        {frameBytes.map((byte, i) => (
          <div key={i} className="space-y-1">
            <div className="aspect-square border rounded bg-white flex items-center justify-center font-mono text-sm">
              {parseInt(byte, 2).toString(16).padStart(2, "0").toUpperCase()}
            </div>
            <div className="text-xs font-mono text-center">
              {byte.split("").map((bit: string, j: number) => (
                <span
                  key={j}
                  className={`${
                    bit === "1" ? "text-blue-600 font-bold" : "text-gray-400"
                  }`}
                >
                  {bit}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-8 gap-1 text-xs text-center text-gray-500">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i}>Byte {i}</div>
        ))}
      </div>
    </div>
  );
}
