export class StringRounder {
    private roundedValue: string;
  
    constructor(num: number) {
      this.roundedValue = StringRounder.roundAndTrim(num);
    }
  
    /**
     * Rounds the number to eight decimals and removes any unnecessary trailing zeros.
     * If the decimal part is all zeros, it returns an integer string.
     * @param num - The number to round and format.
     * @returns The formatted number as a string.
     */
    private static roundAndTrim(num: number): string {
      // Round to eight decimal places using toFixed (which returns a string)
      const fixed = num.toFixed(8);
      // Remove trailing zeros in the decimal part:
      // - The first replace removes zeros after a non-zero digit in the decimal fraction.
      // - The second replace removes the decimal point if only zeros remain.
      return fixed.replace(/(\.\d*?[1-9])0+$/, "$1").replace(/\.0+$/, "");
    }
  
    /**
     * Returns the formatted number as a string.
     */
    public toString(): string {
      return this.roundedValue;
    }
}