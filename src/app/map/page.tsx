"use client";

import { useState } from "react";
import { ByteOrder, BitOrder } from "@/utils/binaryConversion";
import Link from "next/link";
import { CANFrameVisualizer } from "@/components/CANFrameVisualizer";
import { Header } from "@/components/Header";

interface DataValue {
  id: string;
  label: string;
  bitStart: number;
  bitLength: number;
  byteOrder: ByteOrder;
  bitOrder: BitOrder;
  value: string;
  error?: string;
}

export default function MapPage() {
  const [dataValues, setDataValues] = useState<DataValue[]>([]);

  const addDataValue = () => {
    const newValue: DataValue = {
      id: crypto.randomUUID(),
      label: "",
      bitStart: 0,
      bitLength: 8,
      byteOrder: "MSB",
      bitOrder: "MSB",
      value: "",
    };
    setDataValues([...dataValues, newValue]);
  };

  const deleteDataValue = (id: string) => {
    setDataValues(dataValues.filter((value) => value.id !== id));
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
    return "";
  };

  const updateDataValue = (id: string, field: keyof DataValue, value: any) => {
    setDataValues(
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

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <Header />
      <h2 className="text-3xl font-bold mb-8">Map</h2>

      {/* Memory Map Display */}
      <div className="bg-gray-50 p-4 rounded mb-8">
        <h2 className="font-medium mb-4">CAN Data Frame (8 bytes)</h2>
        <CANFrameVisualizer dataValues={dataValues} />
      </div>

      {/* Data Values Table */}
      <div className="bg-white rounded border">
        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
          <h2 className="font-medium">Data Values</h2>
          <button
            onClick={addDataValue}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Add Value
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="p-3 text-left">Label</th>
                <th className="p-3 text-left">Bit Start</th>
                <th className="p-3 text-left">Bit Length</th>
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
                    <input
                      type="text"
                      value={value.value}
                      onChange={(e) =>
                        updateDataValue(value.id, "value", e.target.value)
                      }
                      className="w-full p-1 border rounded"
                      placeholder="Enter value"
                    />
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
