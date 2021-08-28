import Shader from "./shader.js";
import Color from "./util/color.js";
import s from './sprite.js';

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
function drawLine(x: number, y: number, x2: number, y2: number, col: Color): void;
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
function drawLine(x: number, y: number, x2: number, y2: number, r: number, g: number, b: number, a?: number): void;
function drawLine(x: number, y: number, x2: number, y2: number, rcol: Color | number, g?: number, b?: number, a?: number): void {
    const positions = [x, y, x2, y2];
    preparePrimitive(positions,rcol,g,b,a);
    s.gl?.drawArrays(s.gl.LINES,0,2);
}

/**
 * Draws a solid rectangle between two points.
 * @param x X coordinate of the top-left point
 * @param y Y coordinate of the top-left point
 * @param x2 X coordinate of the bottom-right point
 * @param y2 Y coordinate of the bottom-right point
 * @param col A Color instance to use for this rectangle
 */
function drawRect(x: number, y: number, x2: number, y2: number, col: Color): void;
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
function drawRect(x: number, y: number, x2: number, y2: number, r: number, g: number, b: number, a?: number): void;
function drawRect(x: number, y: number, x2: number, y2: number, rcol: Color | number, g?: number, b?: number, a?: number): void {
    const positions = [ // ew
        x, y2, x, y, x2, y,
        x2, y, x2, y2, x, y2,
    ];
    preparePrimitive(positions,rcol,g,b,a);
    s.gl?.drawArrays(s.gl.TRIANGLES,0,6);
}

/**
 * Draws a circle.
 * @param x X coordinate of the center
 * @param y Y coordinate of the center
 * @param radius Radius of the circle in pixels
 * @param segments How many triangles the circle is made of - higher values make the circle smoother, but decrease performance. Segments are more visible when circles are larger.
 * @param col A Color instance to use for this circle.
 */
function drawCircle(x: number, y: number, radius: number, segments: number, col: Color): void;
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
function drawCircle(x: number, y: number, radius: number, segments: number, r: number, g: number, b: number, a?: number): void;
function drawCircle(x: number, y: number, radius: number, segments: number, rcol: Color | number, g?: number, b?: number, a?: number): void {
    const positions = [x, y];

    // Push each successive segment onto position attribute
    let theta = 0;
    for (let i = 0; i <= segments; i++) {
        positions.push(x+(radius*Math.cos(theta)));
        positions.push(y+(radius*Math.sin(theta)));
        theta += Math.PI*2/segments;
    }

    preparePrimitive(positions,rcol,g,b,a);
    s.gl?.drawArrays(s.gl.TRIANGLE_FAN,0,segments+2);
}

/**
 * Draws a primitive.
 * @param mode The GL array draw mode to use for this primitive. Possible values are gl.POINTS, gl.LINE_STRIP, gl.LINE_LOOP, gl.LINES, gl.TRIANGLE_STRIP, gl.TRIANGLE_FAN, or gl.TRIANGLES.
 * @param positions An array of numbers, with each pair indicating of the next vertex of the primitive. These coordinates must be given in pixels, not clipspace.
 * @param col A Color instance to use for this primitive.
 */
function drawPrimitive(mode: number, positions: number[], col: Color): void;
/**
 * Draws a primitive.
 * @param mode The GL array draw mode to use for this primitive. Possible values are gl.POINTS, gl.LINE_STRIP, gl.LINE_LOOP, gl.LINES, gl.TRIANGLE_STRIP, gl.TRIANGLE_FAN, or gl.TRIANGLES.
 * @param positions An array of numbers, with each pair indicating of the next vertex of the primitive. These coordinates must be given in pixels, not clipspace.
 * @param r Red color vector (0-1)
 * @param g Green color vector (0-1)
 * @param b Blue color vector (0-1)
 * @param a Optional alpha channel (0-1)
 */
function drawPrimitive(mode: number, positions: number[], r: number, g: number, b: number, a?: number): void;
function drawPrimitive(mode: number, positions: number[], rcol: Color | number, g?: number, b?: number, a?: number): void {
    preparePrimitive(positions,rcol,g,b,a);
    s.gl?.drawArrays(mode,0,positions.length/2);
}

/**
 * Draws a sprite.
 * @param sprite Sprite resource as output by supersprite's atlas compiler.
 * @param image Index of the image to draw from the sprite. Images begin at 0. Values past the total number will wrap back around to an existing image.
 * @param x X coordinate to place the sprite's origin
 * @param y Y coordinate to place the sprite's origin
 */
function drawSprite(sprite: Sprite, image: number, x: number, y: number): void;
/** 
 * Draws a sprite.
 * @param sprite Sprite resource as output by supersprite's atlas compiler.
 * @param image Index of the image to draw from the sprite. Images begin at 0. Values past the total number will wrap back around to an existing image.
 * @param x X coordinate to place the sprite's origin
 * @param y Y coordinate to place the sprite's origin
 * @param transformFn A function that allows you to apply transformations to this sprite's position matrix. Must return a Matrix.
 */
function drawSprite(sprite: Sprite, image: number, x: number, y: number, transformFn: TransformerFn): void;
/** 
 * Draws a sprite.
 * @param sprite Sprite resource as output by supersprite's atlas compiler.
 * @param image Index of the image to draw from the sprite. Images begin at 0. Values past the total number will wrap back around to an existing image.
 * @param x X coordinate to place the sprite's origin
 * @param y Y coordinate to place the sprite's origin
 * @param transformFn A function that allows you to apply transformations to this sprite's position matrix. Must return a Matrix.
 * @param col A Color instance to blend this sprite with.
 */
function drawSprite(sprite: Sprite, image: number, x: number, y: number, transformFn: TransformerFn | null, col: Color): void;
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
function drawSprite(sprite: Sprite, image: number, x: number, y: number, transformFn: TransformerFn | null, r: number, g: number, b: number, a?: number): void;
function drawSprite(sprite: Sprite, image: number, x: number, y: number, transformFn?: TransformerFn | null, rcol?: Color | number , g?: number, b?: number, a?: number): void {
    if (s.gl && s.shaders.image) {
        s.shaders.image.use();
        s.gl.bindTexture(s.gl.TEXTURE_2D,s.atlasTexture);

        // Limit our image
        image = Math.floor(image);
        if (!sprite.images[image]) {
            image %= sprite.images.length;
        }

        // Set position matrix
        let mat = s.projection.copy().translate(x,y).scale(sprite.width,sprite.height);

        // Chain more transformations here!
        if (transformFn) {
            mat = transformFn(mat);
        }

        // Move by sprite's origin - do after transformations so its still relevant in clipspace
        if (sprite.originX !== 0 || sprite.originY !== 0) {
            mat.translate(-sprite.originX/sprite.width,-sprite.originY/sprite.height);
        }

        s.gl.uniformMatrix3fv(s.shaders.image.uniforms.positionMatrix,false,mat.values);
        s.gl.uniformMatrix3fv(s.shaders.image.uniforms.textureMatrix,false,sprite.images[image].t);

        if (rcol instanceof Color) {
            s.gl.uniform4f(s.shaders.image?.uniforms.blend || null,rcol.red,rcol.green,rcol.blue,rcol.alpha);
        } else if (rcol !== undefined && g !== undefined && b !== undefined) {
            s.gl.uniform4f(s.shaders.image?.uniforms.blend || null,rcol,g,b,(a === undefined) ? 1 : a);
        } else {
            s.gl.uniform4f(s.shaders.image?.uniforms.blend || null,1,1,1,1);
        }
    
        s.gl.drawArrays(s.gl.TRIANGLES,0,6);
    }
}

/**
 * Draws and animates a sprite.
 * @param sprite Sprite resource as output by supersprite's atlas compiler
 * @param speed Number of frames per second to animate the sprite. Should be less than 1.
 * @param x X coordinate to place the sprite's origin
 * @param y Y coordinate to place the sprite's origin
 */
function drawSpriteSpeed(sprite: Sprite, speed: number, x: number, y: number): void;
/**
 * Draws and animates a sprite.
 * @param sprite Sprite resource as output by supersprite's atlas compiler
 * @param speed Number of frames per second to animate the sprite. Should be less than 1.
 * @param x X coordinate to place the sprite's origin
 * @param y Y coordinate to place the sprite's origin
 * @param transformFn A function that allows you to apply transformations to this sprite's position matrix. Must return a Matrix.
 */
function drawSpriteSpeed(sprite: Sprite, speed: number, x: number, y: number, transformFn: TransformerFn): void;
/**
 * Draws and animates a sprite.
 * @param sprite Sprite resource as output by supersprite's atlas compiler
 * @param speed Number of frames per second to animate the sprite. Should be less than 1.
 * @param x X coordinate to place the sprite's origin
 * @param y Y coordinate to place the sprite's origin
 * @param transformFn A function that allows you to apply transformations to this sprite's position matrix. Must return a Matrix.
 * @param col A Color instance to blend this sprite with.
 */
function drawSpriteSpeed(sprite: Sprite, speed: number, x: number, y: number, transformFn: TransformerFn | null, col: Color): void;
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
function drawSpriteSpeed(sprite: Sprite, speed: number, x: number, y: number, transformFn: TransformerFn | null, r: number, g: number, b: number, a?: number): void;
function drawSpriteSpeed(sprite: Sprite, speed: number, x: number, y: number, transformFn?: TransformerFn | null, rcol?: Color | number, g?: number, b?: number, a?: number): void {
    if (rcol instanceof Color) {
        drawSprite(sprite,(s.internalTimer*speed)%sprite.images.length,x,y,transformFn || null,rcol);
    } else if (rcol && g && b) {
        drawSprite(sprite,(s.internalTimer*speed)%sprite.images.length,x,y,transformFn || null,rcol,g,b,a);
    } else if (transformFn) {
        drawSprite(sprite,(s.internalTimer*speed)%sprite.images.length,x,y,transformFn);
    } else {
        drawSprite(sprite,(s.internalTimer*speed)%sprite.images.length,x,y);
    }
}

/**
 * Draws a sprite on the 2D context. Blending and transformations past scaling are not possible, and the sprite will appear above all regular GL drawing.
 * @param sprite Sprite resource as output by supersprite's atlas compiler
 * @param image Index of the image to draw from the sprite. Images begin at 0. Values past the total number will wrap back around to an existing image.
 * @param x X coordinate to place the sprite's origin
 * @param y Y coordinate to place the sprite's origin
 * @param scaleX Optional scale factor to apply to the sprite horizontally
 * @param scaleY Optional scale factor to apply to the sprite vertically
 */
function drawSpriteCtx(sprite: Sprite, image: number, x: number, y: number, scaleX = 1, scaleY = 1): void {
    const ctx = s.ctx;
    if (!ctx) {
        throw new Error('Context not initialized!');
    }
    image = Math.floor(image);
    if (!sprite.images[image]) {
        image %= sprite.images.length;
    }
    const i = sprite.images[image];
    if (!s.atlasImage) {
        throw new Error('Cannot draw a context sprite with no texture loaded.');
    }
    ctx.drawImage(s.atlasImage, i.x, i.y, sprite.width, sprite.height, x-sprite.originX, y-sprite.originY, sprite.width*scaleX, sprite.height*scaleY);
}

/**
 * Draws an animated sprite on the 2D context. Blending and transformations past scaling are not possible, and the sprite will appear above all regular GL drawing.
 * @param sprite Sprite resource as output by supersprite's atlas compiler
 * @param speed Number of frames per second to animate the sprite. Should be less than 1.
 * @param x X coordinate to place the sprite's origin
 * @param y Y coordinate to place the sprite's origin
 * @param scaleX Optional scale factor to apply to the sprite horizontally
 * @param scaleY Optional scale factor to apply to the sprite vertically
 */
function drawSpriteSpeedCtx(sprite: Sprite, speed: number, x: number, y: number, scaleX = 1, scaleY = 1): void {
    drawSpriteCtx(sprite,(s.internalTimer*speed)%sprite.images.length,x,y,scaleX,scaleY);
}

/**
 * Draws a line of text on the 2D context.
 * @param x X coordinate to place the text at
 * @param y Y coordinate to place the text at
 * @param text The text string to draw
 * @param opt Optional options to control aspects of the drawing, such as alignment, color and font. Defaults to white 10px sans-serif aligned top-left.
 */
function drawText(x: number, y: number, text: string, opt?: drawTextOptions): void {
    const ctx = s.ctx;
    if (!ctx) {
        throw new Error('Context not initialized!');
    }
    ctx.textAlign = opt?.hAlign || 'left';
    ctx.textBaseline = opt?.vAlign || 'top';
    ctx.font = `${opt?.fontSize || 10}px ${opt?.fontName || 'sans-serif'}`;
    if (opt?.drawShadow) {
        ctx.fillStyle = 'black';
        ctx.fillText(text,x+(opt.shadowOffsetX === undefined ? 1 : opt.shadowOffsetX),y+(opt.shadowOffsetY === undefined ? 1 : opt.shadowOffsetY),opt.maxWidth);
    }
    ctx.fillStyle = opt?.color || 'white';
    ctx.fillText(text,x,y,opt?.maxWidth);
}

/**
 * Draws text on the 2D context, constrained to fit in a certain space. Exceeding the provided width will allow the text to break onto multiple lines.
 * @param x X coordinate to place the text at
 * @param y Y coordinate to place the test at
 * @param text The text string to draw
 * @param width The width (in pixels) that, once exceeded, the text should break
 * @param opt Optional options to control aspects of the drawing, such as alignment, color, and font. Defaults to white 10px sans-serif aligned top-left.
 */
function drawTextWrap(x: number, y: number, text: string, width: number, opt?: drawTextOptions) {
    const ctx = s.ctx;
    if (!ctx) {
        throw new Error('Context not initialized!');
    }
    const lines: string[] = [];
    let position = 0, lineIndex = 0, current = '';

    // Figure out the text for each line
    while (position <= text.length) {
        const char = text.charAt(position);
        if (char === '') {
            // End of text
            lines[lineIndex] = current;
            break;
        } else if (ctx.measureText(current).width > width && char.match(opt?.lineBreakCharacters || / |\/|\\|-/g)) {
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
    if (opt?.vAlign === 'middle') {
        startY = y-((lines.length-1)*(opt.lineSeparation || 16))/2;
    } else if (opt?.vAlign === 'bottom') {
        startY = y-((lines.length-1)*(opt.lineSeparation || 16));
    }

    // Draw each line
    for (let l = 0; l < lines.length; l++) {
        drawText(x,startY+(l*(opt?.lineSeparation || 16)),lines[l],opt);
    }
}

function preparePrimitive(positions: number[], rcol: Color | number, g?: number, b?: number, a?: number): void {
    s.shaders.primitive?.use(new Float32Array(positions));
    if (rcol instanceof Color) {
        s.gl?.uniform4f(s.shaders.primitive?.uniforms.blend || null,rcol.red,rcol.green,rcol.blue,rcol.alpha);
    } else if (g !== undefined && b !== undefined) {
        s.gl?.uniform4f(s.shaders.primitive?.uniforms.blend || null,rcol,g,b,(a === undefined) ? 1 : a);
    } else {
        throw new DrawError(`Illegal color arguments! R: ${rcol}, G: ${g}, B: ${b}, A: ${a}`);
    }
}

class DrawError extends Error {
    constructor(message?: string) {
        super(message);
    }
}

export default {
    line: drawLine,
    rect: drawRect,
    circle: drawCircle,
    primitive: drawPrimitive,
    sprite: drawSprite,
    spriteSpeed: drawSpriteSpeed,
    spriteCtx: drawSpriteCtx,
    spriteSpeedCtx: drawSpriteSpeedCtx,
    text: drawText,
    textWrap: drawTextWrap,
}