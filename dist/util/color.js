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
    invert() {
        return new Color(1 - this.red, 1 - this.green, 1 - this.blue, this.alpha);
    }
}
Color.fromHex = function (hex, alpha) {
    hex = hex.replace('#', '');
    if (hex.length !== 6) {
        throw new ColorError('Color.fromHex requires a six-digit hex color.');
    }
    return new Color(parseInt(hex[0] + hex[1], 16) / 255, parseInt(hex[2] + hex[3], 16) / 255, parseInt(hex[4] + hex[5], 16) / 255, alpha);
};
class ColorError extends Error {
    constructor(message) {
        super(message);
    }
}
export default Color;
