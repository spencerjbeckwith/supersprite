var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
/**
 * Collection of four vectors that indicate the RGBA values of a color.
 */
var Color = /** @class */ (function () {
    /** Creates a new color from three or four vectors. Each must be between 0 and 1. */
    function Color(red, green, blue, alpha) {
        this.red = red;
        this.green = green;
        this.blue = blue;
        this.alpha = alpha || 1;
    }
    return Color;
}());
Color.fromHex = function (hex, alpha) {
    hex = hex.replace('#', '');
    if (hex.length !== 6) {
        throw new ColorError('Color.fromHex requires a six-digit hex color.');
    }
    return new Color(parseInt(hex[0] + hex[1], 16) / 255, parseInt(hex[2] + hex[3], 16) / 255, parseInt(hex[4] + hex[5], 16) / 255, alpha);
};
var ColorError = /** @class */ (function (_super) {
    __extends(ColorError, _super);
    function ColorError(message) {
        return _super.call(this, message) || this;
    }
    return ColorError;
}(Error));
export default Color;
