# Overview

byte-map is a simple utility web app in Next.js to help visualize binary data conversion. It was born out of a frustration with understanding how to encode/decode integers to/from binary. The primary context for this conversion is for preparing the data portion of a CAN data frame for CAN TX, and interpreting the data portion of a CAN data frame for CAN RX. Manufacturers might use MSB or LSB for their CAN data frame, and this can be confusing when trying to understand the data.

# Requirements

- [ ] User can input a decimal number and see the binary and hexadecimal representations of that number.
- [ ] User can select MSB or LSB for the binary representation.
- [ ] User can select the number of bytes to represent the number.
- [ ] User can select the byte order for the binary representation.
- [ ] Output should be human readable and easy to understand.
