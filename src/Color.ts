/** A color used for primitives and palettes */
export class Color {

    /** Red factor of this color, from 0 to 1 */
    red: number;
    /** Green factor of this color, from 0 to 1 */
    green: number;
    /** Blue factor of this color, from 0 to 1 */
    blue: number;
    /** Alpha channel for this color, from 0 to 1 */
    alpha: number;

    /** Creates a new color provided a hex code (with or without the hash mark) and an optional alpha channel */
    constructor(hex: string, alpha?: number)
    /** Creates a channel provided RGB values, all either from 0 to 1 or 0 to 255. Alpha channel optional. */
    constructor(red: number, green: number, blue: number, alpha?: number)
    constructor(arg1: number | string, arg2?: number, arg3?: number, arg4?: number) {
        let alpha = 1;
        if (typeof arg1 === "string") {
            // Constructing from hex code
            const hex = arg1.replace("#", "");
            if (arg2) alpha = arg2;

            if (hex.length !== 6) {
                throw new ColorError(`Hex code ${hex} must be six characters long (not including #).`);
            }

            this.red = parseInt(hex[0] + hex[1], 16) / 255;
            this.green = parseInt(hex[2] + hex[3], 16) / 255;
            this.blue = parseInt(hex[4] + hex[5], 16) / 255;

            if (isNaN(this.red) || isNaN(this.green) || isNaN(this.blue)) {
                throw new ColorError(`Hex code ${hex} is not a valid color.`);
            }
        } else {
            // Constructing from RGB values
            const red = arg1;
            const green = arg2!;
            const blue = arg3!;
            if (arg4) alpha = arg4;

            // Ensure we are within range
            if (red < 0 || red > 255) {
                throw new ColorError(`Red channel (${red}) is out of range: 0-255`);
            }
            if (green < 0 || green > 255) {
                throw new ColorError(`Green channel (${green}) is out of range: 0-255`);
            }
            if (blue < 0 || blue > 255) {
                throw new ColorError(`Blue channel (${blue}) is out of range: 0-255`);
            }
            
            if (red > 1 || green > 1 || blue > 1) {
                // We are in range 0-255
                this.red = red / 255;
                this.green = green / 255;
                this.blue = blue / 255;
            } else {
                // We are in range 0-1
                this.red = red;
                this.green = green;
                this.blue = blue;
            }    
        }

        if (alpha < 0 || alpha > 1) {
            throw new ColorError(`Alpha channel (${alpha}) is out of range: 0-1`);
        }
        this.alpha = alpha;
    }

    /** Inverts the RGB channels of this instance and returns it as a new Color */
    invert(): Color {
        return new Color(1 - this.red, 1 - this.green, 1 - this.blue, this.alpha);
    }

    /** Converts this Color into a CSS-friendly hex representation, including the hash mark */
    toHex(): string {
        let r = Math.min(255, Math.round(this.red * 256)).toString(16);
        let g = Math.min(255, Math.round(this.green * 256)).toString(16);
        let b = Math.min(255, Math.round(this.blue * 256)).toString(16);
        if (r.length < 2) r = "0" + r;
        if (g.length < 2) g = "0" + g;
        if (b.length < 2) b = "0" + b;
        return `#${r}${g}${b}`;
    }
}

/** Error class used when Colors fail validation */
export class ColorError extends Error {}
