import Color from "./util/color.js";
import s from './sprite.js';
function drawLine(x, y, x2, y2, rcol, g, b, a) {
    var _a;
    const positions = [x, y, x2, y2];
    preparePrimitive(positions, rcol, g, b, a);
    (_a = s.gl) === null || _a === void 0 ? void 0 : _a.drawArrays(s.gl.LINES, 0, 2);
}
function drawRect(x, y, x2, y2, rcol, g, b, a) {
    var _a;
    const positions = [
        x, y2, x, y, x2, y,
        x2, y, x2, y2, x, y2,
    ];
    preparePrimitive(positions, rcol, g, b, a);
    (_a = s.gl) === null || _a === void 0 ? void 0 : _a.drawArrays(s.gl.TRIANGLES, 0, 6);
}
function drawCircle(x, y, radius, segments, rcol, g, b, a) {
    var _a;
    const positions = [x, y];
    // Push each successive segment onto position attribute
    let theta = 0;
    for (let i = 0; i <= segments; i++) {
        positions.push(x + (radius * Math.cos(theta)));
        positions.push(y + (radius * Math.sin(theta)));
        theta += Math.PI * 2 / segments;
    }
    preparePrimitive(positions, rcol, g, b, a);
    (_a = s.gl) === null || _a === void 0 ? void 0 : _a.drawArrays(s.gl.TRIANGLE_FAN, 0, segments + 2);
}
function drawPrimitive(mode, positions, rcol, g, b, a) {
    var _a;
    preparePrimitive(positions, rcol, g, b, a);
    (_a = s.gl) === null || _a === void 0 ? void 0 : _a.drawArrays(mode, 0, positions.length / 2);
}
function drawSprite(sprite, image, x, y, transformFn, rcol, g, b, a) {
    var _a, _b, _c;
    if (s.gl && s.shaders.image) {
        s.shaders.image.use();
        s.gl.bindTexture(s.gl.TEXTURE_2D, s.atlasTexture);
        // Limit our image
        image = Math.floor(image);
        if (!sprite.images[image]) {
            image %= sprite.images.length;
        }
        // Set position matrix
        let mat = s.projection.copy().translate(x, y).scale(sprite.width, sprite.height);
        // Chain more transformations here!
        if (transformFn) {
            mat = transformFn(mat);
        }
        // Move by sprite's origin - do after transformations so its still relevant in clipspace
        if (sprite.originX !== 0 || sprite.originY !== 0) {
            mat.translate(-sprite.originX / sprite.width, -sprite.originY / sprite.height);
        }
        s.gl.uniformMatrix3fv(s.shaders.image.uniforms.positionMatrix, false, mat.values);
        s.gl.uniformMatrix3fv(s.shaders.image.uniforms.textureMatrix, false, sprite.images[image].t);
        if (rcol instanceof Color) {
            s.gl.uniform4f(((_a = s.shaders.image) === null || _a === void 0 ? void 0 : _a.uniforms.blend) || null, rcol.red, rcol.green, rcol.blue, rcol.alpha);
        }
        else if (rcol !== undefined && g !== undefined && b !== undefined) {
            s.gl.uniform4f(((_b = s.shaders.image) === null || _b === void 0 ? void 0 : _b.uniforms.blend) || null, rcol, g, b, (a === undefined) ? 1 : a);
        }
        else {
            s.gl.uniform4f(((_c = s.shaders.image) === null || _c === void 0 ? void 0 : _c.uniforms.blend) || null, 1, 1, 1, 1);
        }
        s.gl.drawArrays(s.gl.TRIANGLES, 0, 6);
    }
}
function drawSpriteSpeed(sprite, speed, x, y, transformFn, rcol, g, b, a) {
    if (rcol instanceof Color) {
        drawSprite(sprite, (s.internalTimer * speed) % sprite.images.length, x, y, transformFn || null, rcol);
    }
    else if (rcol && g && b) {
        drawSprite(sprite, (s.internalTimer * speed) % sprite.images.length, x, y, transformFn || null, rcol, g, b, a);
    }
    else if (transformFn) {
        drawSprite(sprite, (s.internalTimer * speed) % sprite.images.length, x, y, transformFn);
    }
    else {
        drawSprite(sprite, (s.internalTimer * speed) % sprite.images.length, x, y);
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
function drawSpriteCtx(sprite, image, x, y, scaleX = 1, scaleY = 1) {
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
    ctx.drawImage(s.atlasImage, i.x, i.y, sprite.width, sprite.height, x - sprite.originX, y - sprite.originY, sprite.width * scaleX, sprite.height * scaleY);
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
function drawSpriteSpeedCtx(sprite, speed, x, y, scaleX = 1, scaleY = 1) {
    drawSpriteCtx(sprite, (s.internalTimer * speed) % sprite.images.length, x, y, scaleX, scaleY);
}
/**
 * Draws a line of text on the 2D context.
 * @param x X coordinate to place the text at
 * @param y Y coordinate to place the text at
 * @param text The text string to draw
 * @param opt Optional options to control aspects of the drawing, such as alignment, color and font. Defaults to white 10px sans-serif aligned top-left.
 */
function drawText(x, y, text, opt) {
    const ctx = s.ctx;
    if (!ctx) {
        throw new Error('Context not initialized!');
    }
    ctx.textAlign = (opt === null || opt === void 0 ? void 0 : opt.hAlign) || 'left';
    ctx.textBaseline = (opt === null || opt === void 0 ? void 0 : opt.vAlign) || 'top';
    ctx.font = `${(opt === null || opt === void 0 ? void 0 : opt.fontSize) || 10}px ${(opt === null || opt === void 0 ? void 0 : opt.fontName) || 'sans-serif'}`;
    if (opt === null || opt === void 0 ? void 0 : opt.drawShadow) {
        ctx.fillStyle = 'black';
        ctx.fillText(text, x + (opt.shadowOffsetX === undefined ? 1 : opt.shadowOffsetX), y + (opt.shadowOffsetY === undefined ? 1 : opt.shadowOffsetY), opt.maxWidth);
    }
    ctx.fillStyle = (opt === null || opt === void 0 ? void 0 : opt.color) || 'white';
    ctx.fillText(text, x, y, opt === null || opt === void 0 ? void 0 : opt.maxWidth);
}
/**
 * Draws text on the 2D context, constrained to fit in a certain space. Exceeding the provided width will allow the text to break onto multiple lines.
 * @param x X coordinate to place the text at
 * @param y Y coordinate to place the test at
 * @param text The text string to draw
 * @param width The width (in pixels) that, once exceeded, the text should break
 * @param opt Optional options to control aspects of the drawing, such as alignment, color, and font. Defaults to white 10px sans-serif aligned top-left.
 */
function drawTextWrap(x, y, text, width, opt) {
    const ctx = s.ctx;
    if (!ctx) {
        throw new Error('Context not initialized!');
    }
    const lines = [];
    let position = 0, lineIndex = 0, current = '';
    // Figure out the text for each line
    while (position <= text.length) {
        const char = text.charAt(position);
        if (char === '') {
            // End of text
            lines[lineIndex] = current;
            break;
        }
        else if (ctx.measureText(current).width > width && char.match((opt === null || opt === void 0 ? void 0 : opt.lineBreakCharacters) || / |\/|\\|-/g)) {
            if (char !== ' ') {
                current += char; // Include all characters but spaces
            }
            // Reset to write the next line
            lines[lineIndex] = current;
            lineIndex++;
            current = '';
        }
        else {
            // Not a breaking character, or not wide enough yet
            current += char;
        }
        position++;
    }
    // Figure out where to actually draw, based on our vertical alignment
    let startY = y;
    if ((opt === null || opt === void 0 ? void 0 : opt.vAlign) === 'middle') {
        startY = y - ((lines.length - 1) * (opt.lineSeparation || 16)) / 2;
    }
    else if ((opt === null || opt === void 0 ? void 0 : opt.vAlign) === 'bottom') {
        startY = y - ((lines.length - 1) * (opt.lineSeparation || 16));
    }
    // Draw each line
    for (let l = 0; l < lines.length; l++) {
        drawText(x, startY + (l * ((opt === null || opt === void 0 ? void 0 : opt.lineSeparation) || 16)), lines[l], opt);
    }
}
function preparePrimitive(positions, rcol, g, b, a) {
    var _a, _b, _c, _d, _e;
    (_a = s.shaders.primitive) === null || _a === void 0 ? void 0 : _a.use(new Float32Array(positions));
    if (rcol instanceof Color) {
        (_b = s.gl) === null || _b === void 0 ? void 0 : _b.uniform4f(((_c = s.shaders.primitive) === null || _c === void 0 ? void 0 : _c.uniforms.blend) || null, rcol.red, rcol.green, rcol.blue, rcol.alpha);
    }
    else if (g !== undefined && b !== undefined) {
        (_d = s.gl) === null || _d === void 0 ? void 0 : _d.uniform4f(((_e = s.shaders.primitive) === null || _e === void 0 ? void 0 : _e.uniforms.blend) || null, rcol, g, b, (a === undefined) ? 1 : a);
    }
    else {
        throw new DrawError(`Illegal color arguments! R: ${rcol}, G: ${g}, B: ${b}, A: ${a}`);
    }
}
class DrawError extends Error {
    constructor(message) {
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
};
