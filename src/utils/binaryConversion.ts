export type ByteOrder = "MSB" | "LSB";
export type BitOrder = "MSB" | "LSB";

function convertToTwosComplement(num: number, numBytes: number): string {
  const totalBits = numBytes * 8;

  if (num >= 0) {
    // For positive numbers, just pad with zeros
    return num.toString(2).padStart(totalBits, "0");
  } else {
    // For negative numbers, use 2's complement
    // First get the absolute value in binary, padded to full width
    const absNum = Math.abs(num + 1); // Add 1 as part of 2's complement
    const binStr = absNum.toString(2).padStart(totalBits, "0");

    // Invert all bits
    const inverted = binStr
      .split("")
      .map((bit) => (bit === "0" ? "1" : "0"))
      .join("");

    return inverted;
  }
}

export function numberToBinary(
  num: number,
  numBytes: number,
  byteOrder: ByteOrder,
  bitOrder: BitOrder
): string {
  // Convert to binary using 2's complement for negative numbers
  const binaryStr = convertToTwosComplement(num, numBytes);

  // Split into bytes
  const bytes = binaryStr.match(/.{8}/g) || [];

  // Reverse bits within each byte if LSB bit order
  if (bitOrder === "LSB") {
    bytes.forEach((byte, index) => {
      bytes[index] = byte.split("").reverse().join("");
    });
  }

  // Reverse byte order if LSB byte order
  if (byteOrder === "LSB") {
    bytes.reverse();
  }

  return bytes.join(" ");
}

export function numberToHex(
  num: number,
  numBytes: number,
  byteOrder: ByteOrder,
  bitOrder: BitOrder
): string {
  // Get binary representation (including 2's complement for negative)
  const binaryStr = numberToBinary(num, numBytes, "MSB", bitOrder).replace(
    /\s/g,
    ""
  );

  // Process each byte separately to maintain proper byte representation
  const bytes: string[] = [];
  for (let i = 0; i < binaryStr.length; i += 8) {
    const byte = binaryStr.slice(i, i + 8);
    const hexByte = parseInt(byte, 2)
      .toString(16)
      .padStart(2, "0")
      .toUpperCase();
    bytes.push(hexByte);
  }

  // Reverse bytes if LSB byte order
  if (byteOrder === "LSB") {
    bytes.reverse();
  }

  return bytes.map((byte) => "0x" + byte).join(" ");
}
