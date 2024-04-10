import { MainShader } from './shader.js';
import Color from './util/color.js';
import Matrix from './util/matrix.js';

/*
    Unless otherwise noted, all coordinates provided are in PIXELS, with 0,0, being the top-left of the screen and (supersprite.viewWidth, supersprite.viewHeight) being the bottom-right.
    All colors may either be a Color instance or an array of up to four values, indicated RGBA respectively. Any omitted values are treated as 1.
    And finally, all "speed" method variants take speed in units of frames per second. So, you'll probably be using values < 1.
*/

/** A sprite instance, as exported by supersprite's compiler */
interface Sprite {
    width: number;
    height: number;
    originX: number;
    originY: number;
    images: SpriteImage[];
}

/** Contains data about a single image of a sprite */
interface SpriteImage {
    x: number;
    y: number;
    /** A precomputed 3x3 matrix, used to slice this sprite image out of the texture atlas. */
    t: [number, number, number, number, number, number, number, number, number];
}

/** An options object for drawing text on the 2D context. */
interface DrawTextOptions {
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

/** The main access point for all drawing methods */
interface Draw {
    /** Contains a reference to the loaded atlas WebGL texture as required by some drawing methods. Must be set via supersprite.setAtlas() */
    atlasTexture: WebGLTexture | null;
    /** Contains a reference to the loaded atlas HTML image as required by some drawing methods. Must be set via supersprite.setAtlas()*/
    atlasImage: HTMLImageElement | null;
    /** Contains a reference to the current view projection as set by supersprite.setProjection() */
    projection: Matrix,

    /** Draws a line from one point to another */
    line: (x: number, y: number, x2: number, y2: number, color: Color | number[]) => void;

    /** Draws a filled rectangle between two points */
    rect: (x: number, y: number, x2: number, y2: number, color: Color | number[]) => void;

    /** Draws a circle centered on a position, made of the specified number of segments */
    circle: (x: number, y: number, radius: number, segments: number, color: Color | number[]) => void;

    /** Draws any type of WebGL primitive, provided its mode and vertex positions */
    primitive: (mode: 'points' | 'lineStrip' | 'lineLoop' | 'lines' | 'triangleStrip' | 'triangleFan' | 'triangles', positions: number[], color: Color | number[]) => void;

    /** Draws an image from a sprite with optional transformations or blending */
    sprite: (sprite: Sprite, image: number, x: number, y: number, transform?: (mat: Matrix) => Matrix, color?: Color | number[]) => void;

    /** Draws an animated, looping sprite with optional transformations or blending*/
    spriteSpeed: (sprite: Sprite, speed: number, x: number, y: number, transform?: (mat: Matrix) => Matrix, color?: Color | number[]) => void;

    /** Draws a contorted image from a sprite with optional transformations or blending */
    spriteSpecial: (sprite: Sprite, image: number, x: number, y: number, positions: number[], UVs?: number[], transform?: (mat: Matrix) => Matrix, color?: Color | number[]) => void;

    /** Draws an contorted, animated sprite with optional transformations or blending */
    spriteSpeedSpecial: (sprite: Sprite, speed: number, x: number, y: number, positions: number[], UVs?: number[], transform?: (mat: Matrix) => Matrix, color?: Color | number[]) => void;

    /** Draws an image from a sprite onto the 2D context canvas */
    spriteCtx: (sprite: Sprite, image: number, x: number, y: number, scaleX?: number, scaleY?: number) => void;

    /** Draws an animated, looping sprite onto the 2D context canvas */
    spriteSpeedCtx: (sprite: Sprite, speed: number, x: number, y: number, scaleX?: number, scaleY?: number) => void;

    /** Draws a contorted texture with optional transformations or blending*/
    texture: (texture: WebGLTexture, x: number, y: number, width: number, height: number, positions: number[], UVs?: number[], transform?: (mat: Matrix) => Matrix, color?: Color | number[]) => void;

    /** Draws a line of text onto the 2D context canvas */
    text: (x: number, y: number, text: string, options?: DrawTextOptions) => void;

    /** Draws multiple lines of text onto the 2D context canvas */
    textWrap: (x: number, y: number, text: string, width: number, options?: DrawTextOptions) => void;

}

/** Sets up references and methods, to be used internally */
function prepareDrawing(gl: WebGL2RenderingContext, ctx: CanvasRenderingContext2D, main: MainShader, projection: Matrix, internalTimer: {current: number}): Draw {
    // Utility methods
    function preparePrimitive(positions: number[], color: Color | number[]): void {
        main.setPositions(positions);
        main.setUVs(positions);
        gl.uniformMatrix3fv(main.uniforms.positionMatrix, false, projection.values);
        gl.uniform1i(main.uniforms.useTexture,0);
        if (color instanceof Color) {
            gl.uniform4f(main.uniforms.blend, color.red, color.green, color.blue, color.alpha);
        } else {
            gl.uniform4f(main.uniforms.blend, color[0] === undefined ? 1 : color[0], color[1] === undefined ? 1: color[1], color[2] === undefined ? 1: color[2], color[3] === undefined ? 1: color[3]);
        }
    }

    function limitImage(sprite: Sprite, image: number): number {
        image = Math.floor(image);
        if (!sprite.images[image]) {
            image %= sprite.images.length;
        }
        return image;
    }

    function speedToImage(sprite: Sprite, speed: number): number {
        return (internalTimer.current * speed) % sprite.images.length;
    }

    // Methods defined outside of the returned object, because other draw methods depend on them
    function drawSprite(this: Draw, sprite: Sprite, image: number, x: number, y: number, transform?: (mat: Matrix) => Matrix, color?: Color | number[]) {
        image = limitImage(sprite, image);

        // Set position matrix
        let mat = this.projection.copy().translate(x,y).scale(sprite.width, sprite.height);
        if (transform) {
            mat = transform(mat);
        }

        // Move by sprite's origin - do after transformations so its still relevant in clipspace
        if (sprite.originX !== 0 || sprite.originY !== 0) {
            mat.translate(-sprite.originX / sprite.width, -sprite.originY / sprite.height);
        }

        gl.bindTexture(gl.TEXTURE_2D, this.atlasTexture);
        gl.bindVertexArray(main.vao);
        gl.uniformMatrix3fv(main.uniforms.positionMatrix, false, mat.values);
        gl.uniformMatrix3fv(main.uniforms.textureMatrix, false, sprite.images[image].t);
        gl.uniform1i(main.uniforms.useTexture,1);
        if (color instanceof Color) {
            gl.uniform4f(main.uniforms.blend, color.red, color.green, color.blue, color.alpha);
        } else if (color instanceof Array) {
            gl.uniform4f(main.uniforms.blend, color[0] === undefined ? 1 : color[0], color[1] === undefined ? 1: color[1], color[2] === undefined ? 1: color[2], color[3] === undefined ? 1: color[3]);
        } else {
            gl.uniform4f(main.uniforms.blend, 1, 1, 1, 1);
        }
        
        gl.drawArrays(gl.TRIANGLES,0,6);
        gl.bindVertexArray(null);
    }

    function drawSpriteSpecial(this: Draw, sprite: Sprite, image: number, x: number, y: number, positions: number[], UVs?: number[], transform?: (mat: Matrix) => Matrix, color?: Color | number[]) {
        image = limitImage(sprite, image);

        // Set position matrix
        let mat = this.projection.copy().translate(x,y).scale(sprite.width, sprite.height);
        if (transform) {
            mat = transform(mat);
        }

        // Move by sprite's origin - do after transformations so its still relevant in clipspace
        if (sprite.originX !== 0 || sprite.originY !== 0) {
            mat.translate(-sprite.originX / sprite.width, -sprite.originY / sprite.height);
        }

        // Don't use the VAO
        gl.bindTexture(gl.TEXTURE_2D, this.atlasTexture);
        main.setPositions(positions);
        main.setUVs(UVs);
        gl.uniformMatrix3fv(main.uniforms.positionMatrix, false, mat.values);
        gl.uniformMatrix3fv(main.uniforms.textureMatrix, false, sprite.images[image].t);
        gl.uniform1i(main.uniforms.useTexture,1);
        if (color instanceof Color) {
            gl.uniform4f(main.uniforms.blend, color.red, color.green, color.blue, color.alpha);
        } else if (color instanceof Array) {
            gl.uniform4f(main.uniforms.blend, color[0] === undefined ? 1 : color[0], color[1] === undefined ? 1: color[1], color[2] === undefined ? 1: color[2], color[3] === undefined ? 1: color[3]);
        } else {
            gl.uniform4f(main.uniforms.blend, 1, 1, 1, 1);
        }
        
        gl.drawArrays(gl.TRIANGLES, 0, Math.floor(positions.length/2));
    }

    function drawSpriteCtx(this: Draw, sprite: Sprite, image: number, x: number, y: number, scaleX = 1, scaleY = 1) {
        if (this.atlasImage) {
            image = limitImage(sprite, image);
            const i = sprite.images[image];
            ctx.drawImage(this.atlasImage, i.x, i.y, sprite.width, sprite.height, x - sprite.originX, y - sprite.originY, sprite.width * scaleX, sprite.height * scaleY);
        }
    }

    function drawText(x: number, y: number, text: string, options?: DrawTextOptions) {
        ctx.textAlign = options?.hAlign || 'left';
        ctx.textBaseline = options?.vAlign || 'top';
        ctx.font = `${options?.fontSize || 10}px ${options?.fontName || 'sans-serif'}`;
        if (options?.drawShadow) {
            ctx.fillStyle = 'black';
            ctx.fillText(text, x + (options.shadowOffsetX === undefined ? 1 : options.shadowOffsetX), y + ( options.shadowOffsetY === undefined ? 1 : options.shadowOffsetY), options.maxWidth);
        }
        ctx.fillStyle = options?.color || 'white';
        ctx.fillText(text, x, y, options?.maxWidth);
    }

    // And here's the actual return:
    return {
        atlasTexture: null,
        atlasImage: null,
        projection: projection,

        sprite: drawSprite,
        spriteSpecial: drawSpriteSpecial,
        spriteCtx: drawSpriteCtx,
        text: drawText,

        line: function(x: number, y: number, x2: number, y2: number, color: Color | number[]) {
            preparePrimitive([ x, y, x2, y2 ], color);
            gl.drawArrays(gl.LINES, 0, 2);
        },

        rect: function(x: number, y: number, x2: number, y2: number, color: Color | number[]) {
            preparePrimitive([ x, y,  x, y2,  x2, y2,  x2, y2,  x2, y,  x, y], color);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
        },

        circle: function(x: number, y: number, radius: number, segments: number, color: Color | number[]) {
            const positions = [x, y];

            // Push each successive segment onto our positions
            let theta = 0;
            for (let i = 0; i <= segments; i++) {
                positions.push(x+(radius*Math.cos(theta)));
                positions.push(y+(radius*Math.sin(theta)));
                theta += Math.PI * 2 / segments;
            }

            preparePrimitive(positions, color);
            gl.drawArrays(gl.TRIANGLE_FAN,0,segments + 2);
        },

        primitive: function(mode: 'points' | 'lineStrip' | 'lineLoop' | 'lines' | 'triangleStrip' | 'triangleFan' | 'triangles', positions: number[], color: Color | number[]) {
            let glEnum: number = gl.TRIANGLES;
            switch (mode) {
                case ('points'): { glEnum = gl.POINTS; break; }
                case ('lineStrip'): { glEnum = gl.LINE_STRIP; break; }
                case ('lineLoop'): { glEnum = gl.LINE_LOOP; break; }
                case ('lines'): { glEnum = gl.LINES; break; }
                case ('triangleStrip'): { glEnum = gl.TRIANGLE_STRIP; break; }
                case ('triangleFan'): { glEnum = gl.TRIANGLE_FAN; break; }
                case ('triangles'): { glEnum = gl.TRIANGLES; break; }
                default: break;
            }
            preparePrimitive(positions, color);
            gl.drawArrays(glEnum, 0, positions.length / 2);
        },

        spriteSpeed: function(spr: Sprite, speed: number, x: number, y: number, transform?: (mat: Matrix) => Matrix, color?: Color | number[]) {
            drawSprite.bind(this)(spr, speedToImage(spr, speed), x, y, transform, color);
        },

        spriteSpeedSpecial: function(spr: Sprite, speed: number, x: number, y: number, positions: number[], UVs?: number[], transform?: (mat: Matrix) => Matrix, color?: Color | number[]) {
            drawSpriteSpecial.bind(this)(spr, speedToImage(spr, speed), x, y, positions, UVs, transform, color);
        },

        spriteSpeedCtx: function(spr: Sprite, speed: number, x: number, y: number, scaleX = 1, scaleY = 1) {
            drawSpriteCtx.bind(this)(spr, speedToImage(spr, speed), x, y, scaleX, scaleY);
        },

        texture: function(texture: WebGLTexture, x: number, y: number, width: number, height: number, positions: number[], UVs?: number[], transform?: (mat: Matrix) => Matrix, color?: Color | number[]) {
            gl.bindTexture(gl.TEXTURE_2D,texture);
            main.setPositions(positions);
            main.setUVs(UVs);
            
            let mat = this.projection.copy().translate(x,y).scale(width,height);
            if (transform) {
                mat = transform(mat);
            }

            gl.uniformMatrix3fv(main.uniforms.positionMatrix, false, mat.values);
            gl.uniformMatrix3fv(main.uniforms.textureMatrix, false, Matrix.identity);
            gl.uniform4f(main.uniforms.blend, 1, 1, 1, 1);
            gl.uniform1i(main.uniforms.useTexture,1);
            if (color instanceof Color) {
                gl.uniform4f(main.uniforms.blend, color.red, color.green, color.blue, color.alpha);
            } else if (color instanceof Array) {
                gl.uniform4f(main.uniforms.blend, color[0] === undefined ? 1 : color[0], color[1] === undefined ? 1: color[1], color[2] === undefined ? 1: color[2], color[3] === undefined ? 1: color[3]);
            } else {
                gl.uniform4f(main.uniforms.blend, 1, 1, 1, 1);
            }

            gl.drawArrays(gl.TRIANGLES, 0, positions.length / 2);
            gl.bindTexture(gl.TEXTURE_2D, this.atlasTexture as WebGLTexture);
        },

        textWrap: function(x: number, y: number, text: string, width: number, options?: DrawTextOptions) {
            const lines: string[] = [];
            let position = 0, lineIndex = 0, current = '';

            // Figure out the text for each line
            while (position <= text.length) {
                const char = text.charAt(position);
                if (char === '') {
                    // End of text
                    lines[lineIndex] = current;
                    break;
                } else if (ctx.measureText(current).width > width && char.match(options?.lineBreakCharacters || / |\/|\\|-/g)) {
                    if (char !== ' ') {
                        current += char; // Include all characters but spaces
                    }
                    // Reset to write the next line
                    lines[lineIndex] = current;
                    lineIndex++;
                    current = '';
                } else {
                    // Not a breaking character, or not wide enough yet
                    current += char;
                }
                position++;
            }

            // Figure out where to actually draw, based on our vertical alignment
            let startY = y;
            if (options?.vAlign === 'middle') {
                startY = y-((lines.length-1)*(options.lineSeparation || 16))/2;
            } else if (options?.vAlign === 'bottom') {
                startY = y-((lines.length-1)*(options.lineSeparation || 16));
            }

            // Draw each line
            for (let l = 0; l < lines.length; l++) {
                drawText(x,startY+(l*(options?.lineSeparation || 16)),lines[l],options);
            }
        },
    }
}

export {
    Sprite,
    SpriteImage,
    Draw,
    DrawTextOptions,
    prepareDrawing,
}