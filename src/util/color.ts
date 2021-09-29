/**
 * Collection of four vectors that indicate the RGBA values of a color.
 */
class Color {
    red: number;
    green: number;
    blue: number;
    alpha: number;
    /** Transforms a CSS hex color into its RGB vectors. */
    static fromHex: (hex: string, alpha?: number) => Color;
    /** Transforms a Color instance into a CSS hex color, including the preceding #. */
    static toHex: (col: Color) => string;

    /** Creates a new color from three or four vectors. Each must be between 0 and 1. */
    constructor(red: number, green: number, blue: number, alpha?: number) {
        this.red = red;
        this.green = green;
        this.blue = blue;
        this.alpha = (alpha === undefined) ? 1 : alpha;
    }

    /** Inverts this color. */
    invert(): Color {
        return new Color(1-this.red,1-this.green,1-this.blue,this.alpha);
    }
}

Color.fromHex = function(hex: string, alpha?: number) : Color {
    hex = hex.replace('#','');
    if (hex.length !== 6) {
        throw new Error('Color.fromHex requires a six-digit hex color.');
    }
    return new Color(
        parseInt(hex[0]+hex[1],16)/255,
        parseInt(hex[2]+hex[3],16)/255,
        parseInt(hex[4]+hex[5],16)/255,
        alpha);
}

Color.toHex = function(col: Color) : string {
    const r = Math.round(col.red*255).toString(16);
    const g = Math.round(col.green*255).toString(16);
    const b = Math.round(col.blue*255).toString(16);
    return `#${r.length < 2 ? '0' : ''}${r}${g.length < 2 ? '0' : ''}${g}${b.length < 2 ? '0': ''}${b}`;
}

export default Color;