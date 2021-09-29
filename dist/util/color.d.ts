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
    /** Transforms a Color instance into a CSS hex color, including the preceding #. */
    static toHex: (col: Color) => string;
    /** Creates a new color from three or four vectors. Each must be between 0 and 1. */
    constructor(red: number, green: number, blue: number, alpha?: number);
    /** Inverts this color. */
    invert(): Color;
}
export default Color;
