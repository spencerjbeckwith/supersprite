/**
 * Collection of four vectors that indicate the RGBA values of a color.
 */
class Color {
    /** Creates a new color from three or four vectors. Each must be between 0 and 1. */
    constructor(red, green, blue, alpha) {
        this.red = red;
        this.green = green;
        this.blue = blue;
        this.alpha = (alpha === undefined) ? 1 : alpha;
    }
    /** Inverts this color. */
    invert() {
        return new Color(1 - this.red, 1 - this.green, 1 - this.blue, this.alpha);
    }
}
Color.fromHex = function (hex, alpha) {
    hex = hex.replace('#', '');
    if (hex.length !== 6) {
        throw new Error('Color.fromHex requires a six-digit hex color.');
    }
    return new Color(parseInt(hex[0] + hex[1], 16) / 255, parseInt(hex[2] + hex[3], 16) / 255, parseInt(hex[4] + hex[5], 16) / 255, alpha);
};
Color.toHex = function (col) {
    const r = Math.round(col.red * 255).toString(16);
    const g = Math.round(col.green * 255).toString(16);
    const b = Math.round(col.blue * 255).toString(16);
    return `#${r.length < 2 ? '0' : ''}${r}${g.length < 2 ? '0' : ''}${g}${b.length < 2 ? '0' : ''}${b}`;
};
export default Color;
