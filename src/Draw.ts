import { Color } from "./util/Color";
import { Shader } from "./Shader";
import { Timer } from "./util/Timer";
import { Transform } from "./util/Transform";

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

    /** Atlas from which to draw sprites on the 2D canvas context. If the 2D canvas context is disabled this has no effect. */
    atlasImage: CanvasImageSource | null;

    /** Current projection matrix */
    projectionMatrix: number[];

    /** Internal timer used to animate sprites */
    timer: Timer;

    /** Configurable default values to use when drawing. */
    defaults: Required<DrawDefaults>;

    constructor(shader: Shader, gl: WebGL2RenderingContext, ctx: CanvasRenderingContext2D | null, atlasImage: CanvasImageSource | null, projectionMatrix: number[], timer: Timer, defaults?: DrawDefaults) {
        this.shader = shader;
        this.gl = gl;
        this.ctx = ctx;
        this.atlasImage = atlasImage;
        this.projectionMatrix = projectionMatrix;
        this.timer = timer;
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

    /** Ensures a provided image index corresponds to an actual image of a sprite */
    #limitImage(sprite: Sprite, image: number) {
        image = Math.max(0, Math.floor(image));
        if (!sprite.images[image]) {
            image %= sprite.images.length;
        }
        return image;
    }

    /** Converts an animation speed (in frames per second) to an image index in the sprite, based on this instance's Timer */
    #speedToImage(sprite: Sprite, speed: number) {
        return (this.timer.current * speed / 60) % sprite.images.length;
    }

    /** Prepares to draw a primitive shape with the provided vertex positions */
    preparePrimitive(positions: number[], color?: Color) {
        // Set our positions and projection
        this.shader.setPositions(positions);
        this.gl.uniformMatrix3fv(this.shader.uniforms.positionMatrix, false, this.projectionMatrix);

        // Disable texture
        this.gl.disableVertexAttribArray(this.shader.attributes.texture);
        this.gl.uniform1i(this.shader.uniforms.textured, 0);

        // Set the color (via the blend uniform)
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
    sprite(sprite: Sprite, image: number, x: number, y: number, transform?: Transform) {
        this.gl.bindVertexArray(this.shader.vao);
        this.spriteSpecial(sprite, image, x, y, 6, transform);
        this.gl.bindVertexArray(null);
    }

    /** Draws a sprite animated at `animationSpeed` images per second at (`x`, `y`). */
    spriteAnim(sprite: Sprite, animationSpeed: number, x: number, y: number, transform?: Transform) {
        this.sprite(sprite, this.#speedToImage(sprite, animationSpeed), x, y, transform);
    }

    /**
     * Draws an image from a sprite at (`x`, `y`) using custom vertices and UV coordinates.
     *
     * - Positions may be used to contort the sprite in ways a regular transformation couldn't. These are defined in pixel coordinates, not clipspace.
     * - UVs may be used to set the texture coordinate for each provided vertex in positions. This allows any part of the image texture to be applied to the shape in any way. Note that while `UVs` is also in pixel coordinates, they correspond to the *sprite image* - where (0, 0) is the top-left corner.
     *   These are defined relative to the sprite - wherein a value of (1, 1) refers to the bottom-right corner.
     * 
     * Positions and UVs are provided to this function by calls to `draw.shader.setPositions()` and `draw.shader.setUVs()`.
     * 
     * `vertices` determines how many vertices should be drawn. This should correspond to the length of the positions/UVs lists, divided by 2.
     */
    spriteSpecial(sprite: Sprite, image: number, x: number, y: number, vertices = 6, transform?: Transform) {
        image = this.#limitImage(sprite, image);

        // Set transformations
        const t = new Transform().translate(x, y).scale(sprite.width, sprite.height);
        if (transform) {
            t.append(transform);
        }
        this.gl.uniform3fv(this.shader.uniforms.transformations, t.toArray());

        // Set texture coordinates
        this.gl.uniformMatrix3fv(this.shader.uniforms.textureMatrix, false, sprite.images[image].t);
        
        // Do the draw call
        this.gl.uniform1i(this.shader.uniforms.textured, 1);
        this.gl.drawArrays(this.gl.TRIANGLES, 0, vertices);
    }

    /**
     * Draws a sprite animated at `animationSpeed` images per second at (`x`, `y`) using custom vertices and UV coordinates.
     * 
     * As with `spriteSpecial()`, this function expects positions and UVs to be set ahead of time via `draw.shader.setPositions()` and `draw.shader.setUVs()`.
     * The final number of vertices should also be provided to this function. 
     */
    spriteSpecialAnim(sprite: Sprite, animationSpeed: number, x: number, y: number, vertices = 6, transform?: Transform) {
        this.spriteSpecial(sprite, this.#speedToImage(sprite, animationSpeed), x, y, vertices, transform);
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
    spriteCtx(sprite: Sprite, image: number, x: number, y: number, scaleX = 1, scaleY = 1) {
        if (!this.ctx) {
            throw new DrawError("Unable to draw sprites on the 2D canvas context as it is not initialized.");
        }
        if (!this.atlasImage) {
            throw new DrawError("atlasImage must be specified to draw sprites on the 2D canvas context.");
        }

        const i = sprite.images[this.#limitImage(sprite, image)];
        this.ctx.drawImage(this.atlasImage, i.x, i.y, sprite.width, sprite.height, x, y, sprite.width * scaleX, sprite.height * scaleY);
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
    spriteCtxAnim(sprite: Sprite, animationSpeed: number, x: number, y: number, scaleX = 1, scaleY = 1) {
        this.spriteCtx(sprite, this.#speedToImage(sprite, animationSpeed), x, y, scaleX, scaleY);
    }

    /**
     * Draws a single line of text at (`x`, `y`) on the 2D canvas context with the provided options.
     * 
     * Text may not be drawn to the GL canvas - if this is necessary, considering using a sprite as a font.
     * 
     * If the 2D context is disabled, this will throw an error.
    */
    text(text: string, x: number, y: number, options?: DrawTextOptions) {
        if (!this.ctx) {
            throw new DrawError("Unable to draw text on the 2D canvas context as it is not initialized.");
        }

        // Don't draw if it's pointless
        if (text.length === 0) return;

        this.ctx.textAlign = options?.hAlign ?? this.defaults.hAlign;
        this.ctx.textBaseline = options?.vAlign ?? this.defaults.vAlign;
        this.ctx.font = `${options?.fontSize ?? this.defaults.fontSize}px ${options?.fontName ?? this.defaults.fontName}`;
        const maxWidth = options?.maxWidth ?? this.defaults.maxWidth ?? undefined;
        if (options?.drawShadow || this.defaults.drawShadow) {
            this.ctx.fillStyle = options?.shadowColor ?? this.defaults.shadowColor;
            this.ctx.fillText(
                text,
                x + (options?.shadowOffsetX ?? this.defaults.shadowOffsetX),
                y + (options?.shadowOffsetY ?? this.defaults.shadowOffsetY),
                maxWidth,
            );
        }
        this.ctx.fillStyle = options?.textColor ?? this.defaults.textColor;
        this.ctx.fillText(text, x, y, maxWidth);
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
        if (!this.ctx) {
            throw new DrawError("Unable to draw wrapped text on the 2D canvas context as it is not initialized.");
        }
        const lines: string[] = [];
        let position = 0, lineIndex = 0, currentLine = "";

        // Figure out the text for each line
        while (position <= text.length) {
            const char = text.charAt(position);
            if (char === "") {
                // End of the text
                lines[lineIndex] = currentLine;
                break;
            } else {
                if (this.ctx.measureText(currentLine).width >= width && char.match(options?.lineBreakCharacters ?? this.defaults.lineBreakCharacters)) {
                    // We are wide enough to break, and on a matching break character
                    if (char !== " ") {
                        currentLine += char; // Include all characters except spaces
                    }
                    // Reset to the next line
                    lines[lineIndex] = currentLine;
                    lineIndex++;
                    currentLine = "";
                } else {
                    // Not a breaking character, or not wide enough yet
                    // Don't add space at the start of a new line
                    if (currentLine.length > 0 || char !== " ") {
                        currentLine += char;
                    }
                }
            }
            position++;
        }

        // Figure out where to actually draw based on vertical alignment
        let startY = y;
        const vAlign = options?.vAlign ?? this.defaults.vAlign;
        const sep = options?.lineSeparation ?? this.defaults.lineSeparation;
        switch (vAlign) {
            case ("middle"): {
                startY = y - ((lines.length - 1) * sep) / 2;
                break;
            }
            case ("bottom"): {
                startY = y - ((lines.length - 1) * sep);
                break;
            }
            default: break;
        }

        // Draw each line
        for (let l = 0; l < lines.length; l++) {
            this.text(lines[l], x, startY + (l * sep), options);
        }
    }
}

/** Describes problems with drawing/rendering, either via WebGL or the 2D context */
export class DrawError extends Error {};