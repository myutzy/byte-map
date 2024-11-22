# Overview

byte-map is a tool for visualizing and converting between different data formats. It is built with Next.js and Tailwind CSS.

# Areas

## Convert

- This is the default view when the app loads.
- User can convert between:
  - Decimal
  - Binary
  - Hexadecimal
- Configurable options:
  - IEC 61131-3 data type
  - Byte order (Big Endian/Little Endian)
  - Input validation based on data type ranges
  - Negative numbers only allowed for signed types (SINT, INT, DINT, LINT)
- Visual representation:
  - Binary memory map showing bit positions
  - Human-readable output formatting
  - Clear error messages for invalid inputs

## Map

- By default, the map view displays 8 bytes representing a data frame
- Supports both Encode and Decode modes
- A table of data values is presented, and is empty by default. In the table header, an "Add" button allows the user to add a new row to the table.
- Each row in the table has a "Delete" button in the far right column.
- Each row allows the user to input:
  - Label: A text field for entering a label for the data value.
  - Bit start: A number field for entering the bit position (out of 64) to start the value.
  - Bit length: A number field for entering the number of bits to represent the value.
  - Byte order: A dropdown for selecting the byte order for the value.
  - Value: A text field for entering the decimal value.

## Navigation

- Clean, minimal navigation between Convert and Map views
- Active view is highlighted in the navigation bar
- GitHub repository link in footer
