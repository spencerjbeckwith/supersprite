import Color from './util/color.js';
import Matrix from './util/matrix.js';
/** Sets up references and methods, to be used internally */
function prepareDrawing(gl, ctx, main, projection, internalTimer) {
    // Utility methods
    function preparePrimitive(positions, color) {
        main.setPositions(positions);
        main.setUVs(positions);
        gl.uniformMatrix3fv(main.uniforms.positionMatrix, false, projection.values);
        gl.uniform1i(main.uniforms.useTexture, 0);
        if (color instanceof Color) {
            gl.uniform4f(main.uniforms.blend, color.red, color.green, color.blue, color.alpha);
        }
        else {
            gl.uniform4f(main.uniforms.blend, color[0] === undefined ? 1 : color[0], color[1] === undefined ? 1 : color[1], color[2] === undefined ? 1 : color[2], color[3] === undefined ? 1 : color[3]);
        }
    }
    function limitImage(sprite, image) {
        image = Math.floor(image);
        if (!sprite.images[image]) {
            image %= sprite.images.length;
        }
        return image;
    }
    function speedToImage(sprite, speed) {
        return (internalTimer.current * speed) % sprite.images.length;
    }
    // Methods defined outside of the returned object, because other draw methods depend on them
    function drawSprite(sprite, image, x, y, transform, color) {
        image = limitImage(sprite, image);
        // Set position matrix
        let mat = this.projection.copy().translate(x, y).scale(sprite.width, sprite.height);
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
        gl.uniform1i(main.uniforms.useTexture, 1);
        if (color instanceof Color) {
            gl.uniform4f(main.uniforms.blend, color.red, color.green, color.blue, color.alpha);
        }
        else if (color instanceof Array) {
            gl.uniform4f(main.uniforms.blend, color[0] === undefined ? 1 : color[0], color[1] === undefined ? 1 : color[1], color[2] === undefined ? 1 : color[2], color[3] === undefined ? 1 : color[3]);
        }
        else {
            gl.uniform4f(main.uniforms.blend, 1, 1, 1, 1);
        }
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        gl.bindVertexArray(null);
    }
    function drawSpriteSpecial(sprite, image, x, y, positions, UVs, transform, color) {
        image = limitImage(sprite, image);
        // Set position matrix
        let mat = this.projection.copy().translate(x, y).scale(sprite.width, sprite.height);
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
        gl.uniform1i(main.uniforms.useTexture, 1);
        if (color instanceof Color) {
            gl.uniform4f(main.uniforms.blend, color.red, color.green, color.blue, color.alpha);
        }
        else if (color instanceof Array) {
            gl.uniform4f(main.uniforms.blend, color[0] === undefined ? 1 : color[0], color[1] === undefined ? 1 : color[1], color[2] === undefined ? 1 : color[2], color[3] === undefined ? 1 : color[3]);
        }
        else {
            gl.uniform4f(main.uniforms.blend, 1, 1, 1, 1);
        }
        gl.drawArrays(gl.TRIANGLES, 0, Math.floor(positions.length / 2));
    }
    function drawSpriteCtx(sprite, image, x, y, scaleX = 1, scaleY = 1) {
        if (this.atlasImage) {
            image = limitImage(sprite, image);
            const i = sprite.images[image];
            ctx.drawImage(this.atlasImage, i.x, i.y, sprite.width, sprite.height, x - sprite.originX, y - sprite.originY, sprite.width * scaleX, sprite.height * scaleY);
        }
    }
    function drawText(x, y, text, options) {
        ctx.textAlign = (options === null || options === void 0 ? void 0 : options.hAlign) || 'left';
        ctx.textBaseline = (options === null || options === void 0 ? void 0 : options.vAlign) || 'top';
        ctx.font = `${(options === null || options === void 0 ? void 0 : options.fontSize) || 10}px ${(options === null || options === void 0 ? void 0 : options.fontName) || 'sans-serif'}`;
        if (options === null || options === void 0 ? void 0 : options.drawShadow) {
            ctx.fillStyle = 'black';
            ctx.fillText(text, x + (options.shadowOffsetX === undefined ? 1 : options.shadowOffsetX), y + (options.shadowOffsetY === undefined ? 1 : options.shadowOffsetY), options.maxWidth);
        }
        ctx.fillStyle = (options === null || options === void 0 ? void 0 : options.color) || 'white';
        ctx.fillText(text, x, y, options === null || options === void 0 ? void 0 : options.maxWidth);
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
        line: function (x, y, x2, y2, color) {
            preparePrimitive([x, y, x2, y2], color);
            gl.drawArrays(gl.LINES, 0, 2);
        },
        rect: function (x, y, x2, y2, color) {
            preparePrimitive([x, y, x, y2, x2, y2, x2, y2, x2, y, x, y], color);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
        },
        circle: function (x, y, radius, segments, color) {
            const positions = [x, y];
            // Push each successive segment onto our positions
            let theta = 0;
            for (let i = 0; i <= segments; i++) {
                positions.push(x + (radius * Math.cos(theta)));
                positions.push(y + (radius * Math.sin(theta)));
                theta += Math.PI * 2 / segments;
            }
            preparePrimitive(positions, color);
            gl.drawArrays(gl.TRIANGLE_FAN, 0, segments + 2);
        },
        primitive: function (mode, positions, color) {
            let glEnum = gl.TRIANGLES;
            switch (mode) {
                case ('points'): {
                    glEnum = gl.POINTS;
                    break;
                }
                case ('lineStrip'): {
                    glEnum = gl.LINE_STRIP;
                    break;
                }
                case ('lineLoop'): {
                    glEnum = gl.LINE_LOOP;
                    break;
                }
                case ('lines'): {
                    glEnum = gl.LINES;
                    break;
                }
                case ('triangleStrip'): {
                    glEnum = gl.TRIANGLE_STRIP;
                    break;
                }
                case ('triangleFan'): {
                    glEnum = gl.TRIANGLE_FAN;
                    break;
                }
                case ('triangles'): {
                    glEnum = gl.TRIANGLES;
                    break;
                }
                default: break;
            }
            preparePrimitive(positions, color);
            gl.drawArrays(glEnum, 0, positions.length / 2);
        },
        spriteSpeed: function (spr, speed, x, y, transform, color) {
            drawSprite.bind(this)(spr, speedToImage(spr, speed), x, y, transform, color);
        },
        spriteSpeedSpecial: function (spr, speed, x, y, positions, UVs, transform, color) {
            drawSpriteSpecial.bind(this)(spr, speedToImage(spr, speed), x, y, positions, UVs, transform, color);
        },
        spriteSpeedCtx: function (spr, speed, x, y, scaleX = 1, scaleY = 1) {
            drawSpriteCtx.bind(this)(spr, speedToImage(spr, speed), x, y, scaleX, scaleY);
        },
        texture: function (texture, x, y, width, height, positions, UVs, transform, color) {
            gl.bindTexture(gl.TEXTURE_2D, texture);
            main.setPositions(positions);
            main.setUVs(UVs);
            let mat = this.projection.copy().translate(x, y).scale(width, height);
            if (transform) {
                mat = transform(mat);
            }
            gl.uniformMatrix3fv(main.uniforms.positionMatrix, false, mat.values);
            gl.uniformMatrix3fv(main.uniforms.textureMatrix, false, Matrix.identity);
            gl.uniform4f(main.uniforms.blend, 1, 1, 1, 1);
            gl.uniform1i(main.uniforms.useTexture, 1);
            if (color instanceof Color) {
                gl.uniform4f(main.uniforms.blend, color.red, color.green, color.blue, color.alpha);
            }
            else if (color instanceof Array) {
                gl.uniform4f(main.uniforms.blend, color[0] === undefined ? 1 : color[0], color[1] === undefined ? 1 : color[1], color[2] === undefined ? 1 : color[2], color[3] === undefined ? 1 : color[3]);
            }
            else {
                gl.uniform4f(main.uniforms.blend, 1, 1, 1, 1);
            }
            gl.drawArrays(gl.TRIANGLES, 0, positions.length / 2);
            gl.bindTexture(gl.TEXTURE_2D, this.atlasTexture);
        },
        textWrap: function (x, y, text, width, options) {
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
                else if (ctx.measureText(current).width > width && char.match((options === null || options === void 0 ? void 0 : options.lineBreakCharacters) || / |\/|\\|-/g)) {
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
            if ((options === null || options === void 0 ? void 0 : options.vAlign) === 'middle') {
                startY = y - ((lines.length - 1) * (options.lineSeparation || 16)) / 2;
            }
            else if ((options === null || options === void 0 ? void 0 : options.vAlign) === 'bottom') {
                startY = y - ((lines.length - 1) * (options.lineSeparation || 16));
            }
            // Draw each line
            for (let l = 0; l < lines.length; l++) {
                drawText(x, startY + (l * ((options === null || options === void 0 ? void 0 : options.lineSeparation) || 16)), lines[l], options);
            }
        },
    };
}
export { prepareDrawing, };
