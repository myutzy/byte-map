# Overview

byte-map is a simple utility web app in Next.js to help visualize binary data conversion. It was born out of a frustration with understanding how to encode/decode integers to/from binary. The primary context for this conversion is for preparing the data portion of a CAN data frame for CAN TX, and interpreting the data portion of a CAN data frame for CAN RX. Manufacturers might use MSB or LSB for their CAN data frame, and this can be confusing when trying to understand the data.

# Areas

## Convert

- This is the default view when the app loads.
- User can input a decimal number and see the binary and hexadecimal representations of that number.
- User can select MSB or LSB for the binary representation.
- User can select the number of bytes to represent the number.
- User can select the byte order for the binary representation.
- Output should be human readable and easy to understand.

## Map

- This is a second view that is accessible from the Convert view.
- By default, the map view should display 8 bytes representing a CAN data frame, with each byte presented with the same UI as the Convert view.
- A table of data values is presented, and is empty by default. In the table header, an "Add" button allows the user to add a new row to the table.
- Each row in the table has a "Delete" button in the far right column.
- Each row should allow the user to input the following values:
  - Label: A text field for entering a label for the data value.
  - Bit start: A number field for entering the bit position (out of 64) to start the value.
  - Bit length: A number field for entering the number of bits to represent the value.
  - Byte order: A dropdown for selecting the byte order for the value.
  - Bit order: A dropdown for selecting the bit order for the value.
  - Value: A text field for entering the decimal value. The "Value" field should be editable.
