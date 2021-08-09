import Shader from "./shader.js";
import Color from "./util/color.js";
function drawLine(x, y, x2, y2, rcol, g, b, a) {
    const positions = [x, y, x2, y2];
    preparePrimitive(positions, rcol, g, b, a);
    Shader.gl.drawArrays(Shader.gl.LINES, 0, 2);
}
function drawRect(x, y, x2, y2, rcol, g, b, a) {
    const positions = [
        x, y2, x, y, x2, y,
        x2, y, x2, y2, x, y2,
    ];
    preparePrimitive(positions, rcol, g, b, a);
    Shader.gl.drawArrays(Shader.gl.TRIANGLES, 0, 6);
}
function drawCircle(x, y, radius, segments, rcol, g, b, a) {
    const positions = [x, y];
    // Push each successive segment onto position attribute
    let theta = 0;
    for (let i = 0; i <= segments; i++) {
        positions.push(x + (radius * Math.cos(theta)));
        positions.push(y + (radius * Math.sin(theta)));
        theta += Math.PI * 2 / segments;
    }
    preparePrimitive(positions, rcol, g, b, a);
    Shader.gl.drawArrays(Shader.gl.TRIANGLE_FAN, 0, segments + 2);
}
function drawPrimitive(mode, positions, rcol, g, b, a) {
    preparePrimitive(positions, rcol, g, b, a);
    Shader.gl.drawArrays(mode, 0, positions.length / 2);
}
function drawSprite(sprite, image, x, y, transformFn, rcol, g, b, a) {
    Shader.imageShader.use();
    // Limit our image
    image = Math.floor(image);
    if (!sprite.images[image]) {
        image %= sprite.images.length;
    }
    // Set position matrix
    let mat = Shader.projection.copy().translate(x, y).scale(sprite.width, sprite.height);
    // Chain more transformations here!
    if (transformFn) {
        mat = transformFn(mat);
    }
    // Move by sprite's origin - do after transformations so its still relevant in clipspace
    if (sprite.originX !== 0 || sprite.originY !== 0) {
        mat.translate(-sprite.originX / sprite.width, -sprite.originY / sprite.height);
    }
    Shader.gl.uniformMatrix3fv(Shader.imageShader.positionMatrix, false, mat.values);
    Shader.gl.uniformMatrix3fv(Shader.imageShader.textureMatrix || null, false, sprite.images[image].t);
    if (rcol instanceof Color) {
        Shader.gl.uniform4f(Shader.imageShader.blendUniform, rcol.red, rcol.green, rcol.blue, rcol.alpha);
    }
    else if (rcol !== undefined && g !== undefined && b !== undefined) {
        Shader.gl.uniform4f(Shader.imageShader.blendUniform, rcol, g, b, (a === undefined) ? 1 : a);
    }
    else {
        Shader.gl.uniform4f(Shader.imageShader.blendUniform, 1, 1, 1, 1);
    }
    Shader.gl.drawArrays(Shader.gl.TRIANGLES, 0, 6);
}
function drawSpriteSpeed(sprite, speed, x, y, transformFn, rcol, g, b, a) {
    drawSprite(sprite, (Shader.internalTimer * speed) % sprite.images.length, x, y, transformFn, rcol, g, b, a);
}
function drawText(x, y, text, opt) {
    const ctx = Shader.ctx;
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
function drawTextWrap(x, y, text, width, opt) {
    const ctx = Shader.ctx;
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
    Shader.primitiveShader.use(new Float32Array(positions));
    if (rcol instanceof Color) {
        Shader.gl.uniform4f(Shader.primitiveShader.blendUniform, rcol.red, rcol.green, rcol.blue, rcol.alpha);
    }
    else if (g !== undefined && b !== undefined) {
        Shader.gl.uniform4f(Shader.primitiveShader.blendUniform, rcol, g, b, (a === undefined) ? 1 : a);
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
    text: drawText,
    textWrap: drawTextWrap,
};
