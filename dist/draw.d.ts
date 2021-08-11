import Color from "./util/color.js";
/** An options object for drawing text on the 2D context. */
interface drawTextOptions {
    /** Horizontal alignment of the text */
    hAlign?: CanvasTextAlign;
    /** Vertical alignment of the text */
    vAlign?: CanvasTextBaseline;
    /** The name of the CSS font to use */
    fontName?: string;
    /** The size (px) of the font to draw with. Note that if your canvas scales, the font will scale also, making small fonts appear large and readable if your view is normally small. */
    fontSize?: number;
    /** The color to use for the text */
    color?: string | CanvasGradient | CanvasPattern;
    /** A width which, if exceeded, the text will be crammed into. */
    maxWidth?: number;
    /** If true, a black shadow will appear under the text to help it pop. */
    drawShadow?: boolean;
    /** If drawShadow is true, this is the number of pixels to offset the shadow horizontally from the text */
    shadowOffsetX?: number;
    /** If drawShadow is true, this is the number of pixels to offset the shadow vertically from the text */
    shadowOffsetY?: number;
    /** The number of pixels to separate each line by, when drawing wrapping text */
    lineSeparation?: number;
    /** A pattern of character that the lines are allowed to break on - so that text breaks don't occur in the middle of words. By default is spaces, back and forward slashes, and hyphens. */
    lineBreakCharacters?: RegExp;
}
/**
 * Draws a line from one point to another.
 * @param x X coordinate of the first point
 * @param y Y coordinate of the first point
 * @param x2 X coordinate of the second point
 * @param y2 Y coordinate of the second point
 * @param col A Color instance to use for this line
 */
declare function drawLine(x: number, y: number, x2: number, y2: number, col: Color): void;
/**
 * Draws a line from one point to another.
 * @param x X coordinate of the first point
 * @param y Y coordinate of the first point
 * @param x2 X coordinate of the second point
 * @param y2 Y coordinate of the second point
 * @param r Red color vector (0-1)
 * @param g Green color vector (0-1)
 * @param b Blue color vector (0-1)
 * @param a Optional alpha channel (0-1)
 */
declare function drawLine(x: number, y: number, x2: number, y2: number, r: number, g: number, b: number, a?: number): void;
/**
 * Draws a solid rectangle between two points.
 * @param x X coordinate of the top-left point
 * @param y Y coordinate of the top-left point
 * @param x2 X coordinate of the bottom-right point
 * @param y2 Y coordinate of the bottom-right point
 * @param col A Color instance to use for this rectangle
 */
declare function drawRect(x: number, y: number, x2: number, y2: number, col: Color): void;
/**
 * Draws a solid rectangle between two points.
 * @param x X coordinate of the top-left point
 * @param y Y coordinate of the top-left point
 * @param x2 X coordinate of the bottom-right point
 * @param y2 Y coordinate of the bottom-right point
 * @param r Red color vector (0-1)
 * @param g Green color vector (0-1)
 * @param b Blue color vector (0-1)
 * @param a Optional alpha channel (0-1)
 */
declare function drawRect(x: number, y: number, x2: number, y2: number, r: number, g: number, b: number, a?: number): void;
/**
 * Draws a circle.
 * @param x X coordinate of the center
 * @param y Y coordinate of the center
 * @param radius Radius of the circle in pixels
 * @param segments How many triangles the circle is made of - higher values make the circle smoother, but decrease performance. Segments are more visible when circles are larger.
 * @param col A Color instance to use for this circle.
 */
declare function drawCircle(x: number, y: number, radius: number, segments: number, col: Color): void;
/**
 * Draws a circle.
 * @param x X coordinate of the center
 * @param y Y coordinate of the center
 * @param radius Radius of the circle in pixels
 * @param segments How many triangles the circle is made of - higher values make the circle smoother, but decrease performance. Segments are more visible when circles are larger.
 * @param r Red color vector (0-1)
 * @param g Green color vector (0-1)
 * @param b Blue color vector (0-1)
 * @param a Optional alpha channel (0-1)
 */
declare function drawCircle(x: number, y: number, radius: number, segments: number, r: number, g: number, b: number, a?: number): void;
/**
 * Draws a primitive.
 * @param mode The GL array draw mode to use for this primitive. Possible values are gl.POINTS, gl.LINE_STRIP, gl.LINE_LOOP, gl.LINES, gl.TRIANGLE_STRIP, gl.TRIANGLE_FAN, or gl.TRIANGLES.
 * @param positions An array of numbers, with each pair indicating of the next vertex of the primitive. These coordinates must be given in pixels, not clipspace.
 * @param col A Color instance to use for this primitive.
 */
declare function drawPrimitive(mode: number, positions: number[], col: Color): void;
/**
 * Draws a primitive.
 * @param mode The GL array draw mode to use for this primitive. Possible values are gl.POINTS, gl.LINE_STRIP, gl.LINE_LOOP, gl.LINES, gl.TRIANGLE_STRIP, gl.TRIANGLE_FAN, or gl.TRIANGLES.
 * @param positions An array of numbers, with each pair indicating of the next vertex of the primitive. These coordinates must be given in pixels, not clipspace.
 * @param r Red color vector (0-1)
 * @param g Green color vector (0-1)
 * @param b Blue color vector (0-1)
 * @param a Optional alpha channel (0-1)
 */
declare function drawPrimitive(mode: number, positions: number[], r: number, g: number, b: number, a?: number): void;
/**
 * Draws a sprite.
 * @param sprite Sprite resource as output by supersprite's atlas compiler.
 * @param image Index of the image to draw from the sprite. Images begin at 0. Values past the total number will wrap back around to an existing image.
 * @param x X coordinate to place the sprite's origin
 * @param y Y coordinate to place the sprite's origin
 */
declare function drawSprite(sprite: Sprite, image: number, x: number, y: number): void;
/**
 * Draws a sprite.
 * @param sprite Sprite resource as output by supersprite's atlas compiler.
 * @param image Index of the image to draw from the sprite. Images begin at 0. Values past the total number will wrap back around to an existing image.
 * @param x X coordinate to place the sprite's origin
 * @param y Y coordinate to place the sprite's origin
 * @param transformFn A function that allows you to apply transformations to this sprite's position matrix. Must return a Matrix.
 */
declare function drawSprite(sprite: Sprite, image: number, x: number, y: number, transformFn: TransformerFn): void;
/**
 * Draws a sprite.
 * @param sprite Sprite resource as output by supersprite's atlas compiler.
 * @param image Index of the image to draw from the sprite. Images begin at 0. Values past the total number will wrap back around to an existing image.
 * @param x X coordinate to place the sprite's origin
 * @param y Y coordinate to place the sprite's origin
 * @param transformFn A function that allows you to apply transformations to this sprite's position matrix. Must return a Matrix.
 * @param col A Color instance to blend this sprite with.
 */
declare function drawSprite(sprite: Sprite, image: number, x: number, y: number, transformFn: TransformerFn | null, col: Color): void;
/**
 * Draws a sprite.
 * @param sprite Sprite resource as output by supersprite's atlas compiler
 * @param image Index of the image to draw from the sprite. Images begin at 0. Values past the total number will wrap back around to an existing image.
 * @param x X coordinate to place the sprite's origin
 * @param y Y coordinate to place the sprite's origin
 * @param transformFn A function that allows you to apply transformations to this sprite's position matrix. Must return a Matrix.
 * @param r Red color vector to blend (0-1)
 * @param g Green color vector to blend (0-1)
 * @param b Blue color vector to blend (0-1)
 * @param a Optional alpha channel to blend (0-1)
 */
declare function drawSprite(sprite: Sprite, image: number, x: number, y: number, transformFn: TransformerFn | null, r: number, g: number, b: number, a?: number): void;
/**
 * Draws and animates a sprite.
 * @param sprite Sprite resource as output by supersprite's atlas compiler
 * @param speed Number of frames per second to animate the sprite. Should be less than 1.
 * @param x X coordinate to place the sprite's origin
 * @param y Y coordinate to place the sprite's origin
 */
declare function drawSpriteSpeed(sprite: Sprite, speed: number, x: number, y: number): void;
/**
 * Draws and animates a sprite.
 * @param sprite Sprite resource as output by supersprite's atlas compiler
 * @param speed Number of frames per second to animate the sprite. Should be less than 1.
 * @param x X coordinate to place the sprite's origin
 * @param y Y coordinate to place the sprite's origin
 * @param transformFn A function that allows you to apply transformations to this sprite's position matrix. Must return a Matrix.
 */
declare function drawSpriteSpeed(sprite: Sprite, speed: number, x: number, y: number, transformFn: TransformerFn): void;
/**
 * Draws and animates a sprite.
 * @param sprite Sprite resource as output by supersprite's atlas compiler
 * @param speed Number of frames per second to animate the sprite. Should be less than 1.
 * @param x X coordinate to place the sprite's origin
 * @param y Y coordinate to place the sprite's origin
 * @param transformFn A function that allows you to apply transformations to this sprite's position matrix. Must return a Matrix.
 * @param col A Color instance to blend this sprite with.
 */
declare function drawSpriteSpeed(sprite: Sprite, speed: number, x: number, y: number, transformFn: TransformerFn | null, col: Color): void;
/**
 * Draws and animates a sprite.
 * @param sprite Sprite resource as output by supersprite's atlas compiler
 * @param speed Number of frames per second to animate the sprite. Should be less than 1.
 * @param x X coordinate to place the sprite's origin
 * @param y Y coordinate to place the sprite's origin
 * @param transformFn A function that allows you to apply transformations to this sprite's position matrix. Must return a Matrix.
 * @param r Red color vector to blend (0-1)
 * @param g Green color vector to blend (0-1)
 * @param b Blue color vector to blend (0-1)
 * @param a Optional alpha channel to blend (0-1)
 */
declare function drawSpriteSpeed(sprite: Sprite, speed: number, x: number, y: number, transformFn: TransformerFn | null, r: number, g: number, b: number, a?: number): void;
/**
 * Draws a sprite on the 2D context. Blending and transformations past scaling are not possible, and the sprite will appear above all regular GL drawing.
 * @param sprite Sprite resource as output by supersprite's atlas compiler
 * @param image Index of the image to draw from the sprite. Images begin at 0. Values past the total number will wrap back around to an existing image.
 * @param x X coordinate to place the sprite's origin
 * @param y Y coordinate to place the sprite's origin
 * @param scaleX Optional scale factor to apply to the sprite horizontally
 * @param scaleY Optional scale factor to apply to the sprite vertically
 */
declare function drawSpriteCtx(sprite: Sprite, image: number, x: number, y: number, scaleX?: number, scaleY?: number): void;
/**
 * Draws an animated sprite on the 2D context. Blending and transformations past scaling are not possible, and the sprite will appear above all regular GL drawing.
 * @param sprite Sprite resource as output by supersprite's atlas compiler
 * @param speed Number of frames per second to animate the sprite. Should be less than 1.
 * @param x X coordinate to place the sprite's origin
 * @param y Y coordinate to place the sprite's origin
 * @param scaleX Optional scale factor to apply to the sprite horizontally
 * @param scaleY Optional scale factor to apply to the sprite vertically
 */
declare function drawSpriteSpeedCtx(sprite: Sprite, speed: number, x: number, y: number, scaleX?: number, scaleY?: number): void;
/**
 * Draws a line of text on the 2D context.
 * @param x X coordinate to place the text at
 * @param y Y coordinate to place the text at
 * @param text The text string to draw
 * @param opt Optional options to control aspects of the drawing, such as alignment, color and font. Defaults to white 10px sans-serif aligned top-left.
 */
declare function drawText(x: number, y: number, text: string, opt?: drawTextOptions): void;
/**
 * Draws text on the 2D context, constrained to fit in a certain space. Exceeding the provided width will allow the text to break onto multiple lines.
 * @param x X coordinate to place the text at
 * @param y Y coordinate to place the test at
 * @param text The text string to draw
 * @param width The width (in pixels) that, once exceeded, the text should break
 * @param opt Optional options to control aspects of the drawing, such as alignment, color, and font. Defaults to white 10px sans-serif aligned top-left.
 */
declare function drawTextWrap(x: number, y: number, text: string, width: number, opt?: drawTextOptions): void;
declare const _default: {
    line: typeof drawLine;
    rect: typeof drawRect;
    circle: typeof drawCircle;
    primitive: typeof drawPrimitive;
    sprite: typeof drawSprite;
    spriteSpeed: typeof drawSpriteSpeed;
    spriteCtx: typeof drawSpriteCtx;
    spriteSpeedCtx: typeof drawSpriteSpeedCtx;
    text: typeof drawText;
    textWrap: typeof drawTextWrap;
};
export default _default;
