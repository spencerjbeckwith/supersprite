import { Color } from "./Color";
import { Shader } from "./Shader";

/** A collection of images to be rendered */
export interface Sprite {
    width: number;
    height: number;
    images: SpriteImage[];
}

/** Presents one image in a Sprite's animation cycle */
export interface SpriteImage {
    /** X location of this image within the atlas texture */
    x: number;

    /** Y location of this image within the atlas texture */
    y: number;

    /** Pre-computed texture matrix that transforms the unit quad into clipspace to select this image from the atlas texture */
    t: [
        number, number, number,
        number, number, number,
        number, number, number
    ];
}

export type GLDrawModes =
    | "POINTS"
    | "LINE_STRIP"
    | "LINE_LOOP"
    | "LINES"
    | "TRIANGLE_STRIP"
    | "TRIANGLE_FAN"
    | "TRIANGLES";

export interface DrawTextOptions {
    /** Horizontal alignment of the drawn text */
    hAlign?: CanvasTextAlign;

    /** Vertical alignment of the drawn text */
    vAlign?: CanvasTextBaseline;

    /** The name of the CSS font to use */
    fontName?: string;

    /** 
     * The size (in px) of the font to draw with.
     * 
     * If the canvas scales up, the font will scale as well - making small fonts appear larger and more readable. This can be useful if the view is normally small.
     */
    fontSize?: number;

    /** The color to use for the text. Should be a hex string or CSS color, but may also be a CanvasGradient or CanvasPattern. */
    textColor?: string | CanvasGradient | CanvasPattern;

    /** A pixel width which, if exceeded, the text will be crammed into (and therefore distorted). If not provided or set to null, there is no horizontal limit to the text. */
    maxWidth?: number | null;

    /** If true, a shadow will be rendered underneath the text to help it visually pop. */
    drawShadow?: boolean;

    /** If `drawShadow` is true, this will offset the shadow horizontally underneath the text. */
    shadowOffsetX?: number;

    /** If `drawShadow` is true, this will offset the shadow vertically underneath the text. */
    shadowOffsetY?: number;

    /** If `drawShadow` is true, this will be the color of the shadow. Should be a hex string or CSS color, but may also be a CanvasGradient or CanvasPattern. */
    shadowColor?: string | CanvasGradient | CanvasPattern;

    /** The number of pixels to separate each line by. Only applicable when drawing wrapping text. */
    lineSeparation?: number;

    /** A pattern of characters that lines are allowed to break on, so that text breaks don't occur in the middle of words. */
    lineBreakCharacters?: RegExp;
}

/** Configurable default values to use when drawing. */
export interface DrawDefaults extends DrawTextOptions {
    /** Color to use when drawing primitives, when no color is specified */
    primitiveColor?: Color;
}

/** Responsible for all methods that actually render to the screen */
export class Draw {

    /** Compiled Shader instance containing attribute/uniform locations */
    shader: Shader;

    /** WebGL2 rendering context for our GL methods */
    gl: WebGL2RenderingContext;

    /** 2D canvas context for our ctx methods. If null, this second canvas is disabled and these methods will throw if called. */
    ctx: CanvasRenderingContext2D | null;

    /** Current projection matrix */
    projectionMatrix: number[];

    /** Configurable default values to use when drawing. */
    defaults: Required<DrawDefaults>;

    constructor(shader: Shader, gl: WebGL2RenderingContext, ctx: CanvasRenderingContext2D | null, projectionMatrix: number[], defaults?: DrawDefaults) {
        this.shader = shader;
        this.gl = gl;
        this.ctx = ctx;
        this.projectionMatrix = projectionMatrix;
        this.defaults = {
            primitiveColor: defaults?.primitiveColor ?? new Color("#ffffff"),
            fontName: defaults?.fontName ?? "Arial",
            fontSize: defaults?.fontSize ?? 12,
            hAlign: defaults?.hAlign ?? "left",
            vAlign: defaults?.vAlign ?? "top",
            textColor: defaults?.textColor ?? "#fafafa",
            drawShadow: defaults?.drawShadow ?? false,
            shadowColor: defaults?.shadowColor ?? "#a0a0a0",
            shadowOffsetX: defaults?.shadowOffsetX ?? 1,
            shadowOffsetY: defaults?.shadowOffsetY ?? 1,
            lineSeparation: defaults?.lineSeparation ?? 16,
            maxWidth: defaults?.maxWidth ?? null,
            lineBreakCharacters: defaults?.lineBreakCharacters ?? / |\/|\\|-/g
        };
    }

    /** Prepares to draw a primitive shape with the provided vertex positions */
    preparePrimitive(positions: number[], color?: Color) {
        this.shader.setPositions(positions);
        this.gl.uniformMatrix3fv(this.shader.uniforms.positionMatrix, false, this.projectionMatrix);
        this.gl.uniform1i(this.shader.uniforms.textured, 0);
        const col = color ?? this.defaults.primitiveColor;
        this.gl.uniform4f(this.shader.uniforms.blend, col.red, col.green, col.blue, col.alpha);
    }

    /** 
     * Draws a line between (`x`, `y`) and (`x2`, `y2`).
     * 
     * If no color is specified, this will be drawn in the `defaultColor` of this instance.
     */
    line(x: number, y: number, x2: number, y2: number, color?: Color) {
        this.preparePrimitive([x, y, x2, y2], color);
        this.gl.drawArrays(this.gl.LINES, 0, 2);
    }

    /** 
     * Draws a filled rectangle, using (`x`, `y`) and (`x2`, `y2`) as opposite corners.
     * 
     * If no color is specified, this will be drawn in the `defaultColor` of this instance.
     */
    rect(x: number, y: number, x2: number, y2: number, color?: Color) {
        this.preparePrimitive([
            // First triangle
            x, y,
            x, y2, 
            x2, y2,
            // Second triangle
            x2, y2,
            x2, y,
            x, y,
        ], color);
        this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
    }

    /**
     * Draws a circle centered at (`x`, `y`) and made of the specified number of segments.
     * 
     * More segments makes the circle appear smoother but takes more processing. The payoff for adding more segments decreases as the circle gets smaller, as the difference becomes harder and harder to see.
     * 
     * If no color is specified, this will be drawn in the `defaultColor` of this instance.
     */
    circle(x: number, y: number, radius: number, segments: number, color?: Color) {
        const positions = [x, y];

        // Push each successive segment onto our positions
        let theta = 0;
        for (let i = 0; i <= segments; i++) {
            positions.push(x + (radius * Math.cos(theta)));
            positions.push(y + (radius * Math.sin(theta)));
            theta += (Math.PI * 2) / segments;
        }

        this.preparePrimitive(positions, color);
        this.gl.drawArrays(this.gl.TRIANGLE_FAN, 0, 2 + segments);
    }

    /**
     * Draws any kind of WebGL2 primitive, provided its drawing mode and vertex positions.
     * 
     * Vertex positions should be pixel coordinates, not clipspace coordinates. They will be read two-at-a-time. If the list of positions is an odd number, the last (incomplete) vertex will be ignored.
     * 
     * [Visual differences between draw modes](https://webcodingcenter.com/webgl/Drawing-Modes).
     * 
     * To improve performance, consider initializing your list of vertices once and passing that to this function each frame, rather than redefining the array anew every frame.
     * 
     * If no color is specified, this will be drawn in the `defaultColor` of this instance.
     */
    primitive(mode: GLDrawModes, positions: number[], color?: Color) {
        this.preparePrimitive(positions, color);
        this.gl.drawArrays(this.gl[mode], 0, positions.length / 2);
    }

    /** Draws an image from a sprite at (`x`, `y`). */
    sprite(sprite: Sprite, image: number, x: number, y: number) {
        // TODO draw.sprite
    }

    /** Draws a sprite animated at `animationSpeed` images per second at (`x`, `y`). */
    spriteAnim(sprite: Sprite, animationSpeed: number, x: number, y: number) {
        // TODO draw.spriteAnim
    }

    /**
     * Draws an image from a sprite at (`x`, `y`) using custom vertices and UV coordinates.
     * 
     * `positions` and `UVs` should be defined in pixel coordinates, not clipspace.
     * - `positions` may be used to contort the sprite in ways a regular transformation couldn't.
     * - `UVs` may be used to set the texture coordinate for each provided vertex in `positions`. This allows any part of the image texture to be applied to the shape in any way. Note that while `UVs` is also in pixel coordinates, they correspond to the *sprite image* - where (0, 0) is the top-left corner.
     * 
     * If `UVs` is not provided, the UV coordinates will match the positions. This will appear to "slice" sections out of the image rather than contort it.
     * 
     */
    spriteSpecial(sprite: Sprite, image: number, x: number, y: number, positions: number[], UVs?: number[]) {
        // TODO draw.spriteSpecial
    }

    /**
     * Draws a sprite animated at `animationSpeed` iamges per second at (`x`, `y`) using custom vertices and UV coordinates.
     * 
     * `positions` and `UVs` should be defined in pixel coordinates, not clipspace.
     * - `positions` may be used to contort the sprite in ways a regular transformation couldn't.
     * - `UVs` may be used to set the texture coordinate for each provided vertex in `positions`. This allows any part of the image texture to be applied to the shape in any way. Note that while `UVs` is also in pixel coordinates, they correspond to the *sprite image* - where (0, 0) is the top-left corner.
     * 
     * If `UVs` is not provided, the UV coordinates will match the positions. This will appear to "slice" sections out of the image rather than contort it.
     * 
     */
    spriteSpecialAnim(sprite: Sprite, animationSpeed: number, x: number, y: number, positions: number[], UVs?: number[]) {
        // TODO draw.spriteSpecialAnim
    }

    /** 
     * Draws an image from a sprite at (`x`, `y`) on the 2D canvas context.
     * 
     * This is less performant than drawing to the GL canvas, but ensures your drawn elements are not affected by global effects.
     * 
     * An optional `scaleX` and `scaleY` may be provided, which will scale the sprite from it's top-left corner. `scaleX` and `scaleY` both default to 1 if not provided, meaning no transformation.
     * 
     * If other types of transformations are needed, consider drawing the sprite on the GL canvas with those transformations instead as this will significantly improve performance. If transformations are needed on the 2D context, the 2D rendering [transformation API](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D#transformations) must be used manually between supersprite calls.
     * 
     * If the 2D context is disabled, this will throw an error.
     */
    spriteCtx(sprite: Sprite, image: number, x: number, y: number, scaleX?: number, scaleY?: number) {
        // TODO draw.spriteCtx
    }

    /** 
     * Draws a sprite animated at `animationSpeed` images per second at (`x`, `y`) on the 2D canvas context.
     * 
     * This is less performant than drawing to the GL canvas, but ensures your drawn elements are not affected by global effects.
     * 
     * An optional `scaleX` and `scaleY` may be provided, which will scale the sprite from it's top-left corner. `scaleX` and `scaleY` both default to 1 if not provided, meaning no transformation.
     * 
     * If other types of transformations are needed, consider drawing the sprite on the GL canvas with those transformations instead as this will significantly improve performance. If transformations are needed on the 2D context, the 2D rendering [transformation API](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D#transformations) must be used manually between supersprite calls.
     * 
     * If the 2D context is disabled, this will throw an error.
     */
    spriteCtxAnim(sprite: Sprite, animationSpeed: number, x: number, y: number, scaleX?: number, scaleY?: number) {
        // TODO draw.spriteCtxAnim
    }

    /**
     * Draws a single line of text at (`x`, `y`) on the 2D canvas context with the provided options.
     * 
     * Text may not be drawn to the GL canvas - if this is necessary, considering using a sprite as a font.
     * 
     * If the 2D context is disabled, this will throw an error.
    */
    text(text: string, x: number, y: number, options?: DrawTextOptions) {
        // TODO draw.text
    }

    /** 
     * Draws multiple lines of text at (`x`, `y`) on the 2D canvas context with the provided options.
     * 
     * If the width of the drawn text exceeds `width`, the text will be split into multiple lines. This is useful for constraining some text's taken area, such as keeping it within a box.
     * 
     * Text may not be drawn to the GL canvas - if this is necessary, consider using a sprite as a font.
     * 
     * If the 2D context is disabled, this will throw an error.
     */
    textWrap(text: string, x: number, y: number, width: number, options?: DrawTextOptions) {
        // TODO draw.textWrap
    }
}

/** Describes problems with drawing/rendering, either via WebGL or the 2D context */
export class DrawError extends Error {};