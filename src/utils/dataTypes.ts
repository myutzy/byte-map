export interface DataTypeInfo {
  name: string;
  bytes: number;
  bits?: number;
  min: number;
  max: number;
  unsigned?: boolean;
}

export const IEC_TYPES: { [key: string]: DataTypeInfo } = {
  SINT: { name: "SINT", bytes: 1, min: -128, max: 127 },
  USINT: { name: "USINT", bytes: 1, min: 0, max: 255, unsigned: true },
  INT: { name: "INT", bytes: 2, min: -32768, max: 32767 },
  UINT: { name: "UINT", bytes: 2, min: 0, max: 65535, unsigned: true },
  DINT: { name: "DINT", bytes: 4, min: -2147483648, max: 2147483647 },
  UDINT: { name: "UDINT", bytes: 4, min: 0, max: 4294967295, unsigned: true },
  LINT: {
    name: "LINT",
    bytes: 8,
    min: -9223372036854775808,
    max: 9223372036854775807,
  },
  ULINT: {
    name: "ULINT",
    bytes: 8,
    min: 0,
    max: 18446744073709551615,
    unsigned: true,
  },
  BOOL: {
    name: "BOOL",
    bytes: 1,
    bits: 1,
    min: 0,
    max: 1,
    unsigned: true,
  },
};
