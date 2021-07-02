/**
 * Collection of four vectors that indicate the RGBA values of a color.
 */
declare class Color {
    red: number;
    green: number;
    blue: number;
    alpha: number;
    /** Transforms a CSS hex color into its RGB vectors. */
    static fromHex: (hex: string, alpha?: number) => Color;
    /** Creates a new color from three or four vectors. Each must be between 0 and 1. */
    constructor(red: number, green: number, blue: number, alpha?: number);
}
export default Color;
