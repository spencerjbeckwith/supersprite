import Matrix from './util/matrix.js';
import Color from './util/color.js';
import { prepareMainShader } from './shader.js';
import { prepareDrawing } from './draw.js';
const defaultWidth = 400;
const defaultHeight = 240;
/** Initializes supersprite. This must be called before loading textures or drawing anything. */
function initialize(options) {
    // Create our canvases in DOM
    const cv1 = document.createElement('canvas');
    const cv2 = document.createElement('canvas');
    cv1.setAttribute('style', 'position: absolute; left: 50%; top: 50%; transform: translate(-50%,-50%); overflow: hidden;');
    cv2.setAttribute('style', 'position: absolute; left: 50%; top: 50%; transform: translate(-50%,-50%); overflow: hidden;');
    document.body.style.backgroundColor = '#000000';
    document.body.appendChild(cv1);
    document.body.appendChild(cv2);
    // Size canvases appropriately
    cv1.width = (options === null || options === void 0 ? void 0 : options.displayWidth) || (options === null || options === void 0 ? void 0 : options.viewWidth) || window.innerWidth;
    cv1.height = (options === null || options === void 0 ? void 0 : options.displayHeight) || (options === null || options === void 0 ? void 0 : options.viewHeight) || window.innerHeight;
    cv2.width = cv1.width;
    cv2.height = cv1.height;
    // Get contexts
    const gl = cv1.getContext('webgl2', options === null || options === void 0 ? void 0 : options.glOptions);
    if (!gl) {
        throw new Error('Failed to initialize WebGL context!');
    }
    const ctx = cv2.getContext('2d', options === null || options === void 0 ? void 0 : options.ctxOptions);
    if (!ctx) {
        throw new Error('Failed to initialize 2D canvas context!');
    }
    const main = prepareMainShader(gl, options === null || options === void 0 ? void 0 : options.mainShaderOptions);
    // Changes the string options into the appropriate GL enums
    function getGLParameter(str) {
        switch (str) {
            case ('linear'): {
                return gl === null || gl === void 0 ? void 0 : gl.LINEAR;
            }
            case ('nearest'): {
                return gl === null || gl === void 0 ? void 0 : gl.NEAREST;
            }
            case ('nearestMipmapNearest'): {
                return gl === null || gl === void 0 ? void 0 : gl.NEAREST_MIPMAP_NEAREST;
            }
            case ('linearMipmapNearest'): {
                return gl === null || gl === void 0 ? void 0 : gl.LINEAR_MIPMAP_NEAREST;
            }
            case ('nearestMipmapLinear'): {
                return gl === null || gl === void 0 ? void 0 : gl.NEAREST_MIPMAP_LINEAR;
            }
            case ('linearMipmapLinear'): {
                return gl === null || gl === void 0 ? void 0 : gl.LINEAR_MIPMAP_LINEAR;
            }
            case ('repeat'): {
                return gl === null || gl === void 0 ? void 0 : gl.REPEAT;
            }
            case ('clampToEdge'): {
                return gl === null || gl === void 0 ? void 0 : gl.CLAMP_TO_EDGE;
            }
            case ('mirroredRepeat'): {
                return gl === null || gl === void 0 ? void 0 : gl.MIRRORED_REPEAT;
            }
        }
    }
    // Set up gameTexture
    const gameTexture = gl.createTexture();
    if (!gameTexture) {
        throw new Error(`Failed to create gameTexture!`);
    }
    gl.bindTexture(gl.TEXTURE_2D, gameTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, defaultWidth, defaultHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    if (options === null || options === void 0 ? void 0 : options.gameTextureParameters) {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, getGLParameter(options.gameTextureParameters.textureMagFilter || 'linear') || gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, getGLParameter(options.gameTextureParameters.textureMinFilter || 'linear') || gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, getGLParameter(options.gameTextureParameters.textureWrapS || 'repeat') || gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, getGLParameter(options.gameTextureParameters.textureWrapT || 'repeat') || gl.REPEAT);
    }
    else {
        // Defaults
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    }
    // Used for rendering the gameTexture
    const gameTexturePositionMatrix = new Matrix([2, 0, 0, 0, -2, 0, -1, 1, 1]);
    const gameTextureTextureMatrix = new Matrix([1, 0, 0, 0, 1, 0, 0, 0, 1]);
    // Set up framebuffer
    const framebuffer = gl.createFramebuffer();
    if (!framebuffer) {
        throw new Error(`Failed to create framebuffer!`);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, gameTexture, 0);
    // Initialize gl
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    const projection = Matrix.projection(400, 240);
    const internalTimer = { current: 0 };
    // Create return object
    const s = {
        // Elements
        cv1: cv1,
        cv2: cv2,
        atlasImage: null,
        // Contexts
        gl: gl,
        ctx: ctx,
        // For drawing
        main: main,
        gameTexture: gameTexture,
        atlasTexture: null,
        framebuffer: framebuffer,
        draw: prepareDrawing(gl, ctx, main, projection, internalTimer),
        // Initial view properties
        projection: projection,
        viewWidth: defaultWidth,
        viewHeight: defaultHeight,
        displayWidth: defaultWidth,
        displayHeight: defaultHeight,
        // Other
        internalTimer: internalTimer,
        background: {
            red: 0,
            green: 0,
            blue: 0,
        },
        blend: [1, 1, 1, 1],
        options: {
            responsive: (options === null || options === void 0 ? void 0 : options.responsive) ? options.responsive : 'scale',
            maintainAspectRatio: (options === null || options === void 0 ? void 0 : options.maintainAspectRatio) ? options.maintainAspectRatio : true,
            scalePerfectly: (options === null || options === void 0 ? void 0 : options.scalePerfectly) ? options.scalePerfectly : true,
            contextImageSmoothing: (options === null || options === void 0 ? void 0 : options.contextImageSmoothing) ? options.contextImageSmoothing : false,
            matchPageToBackground: (options === null || options === void 0 ? void 0 : options.matchPageToBackground) ? options.matchPageToBackground : false,
            enableCanvasResize: (options === null || options === void 0 ? void 0 : options.enableCanvasResize) ? options.enableCanvasResize : true,
        },
        // Methods
        setAtlas: function (atlasObject) {
            this.atlasTexture = atlasObject.texture;
            this.atlasImage = atlasObject.image;
            this.draw.atlasTexture = this.atlasTexture;
            this.draw.atlasImage = this.atlasImage;
            gl.uniform1i(main.uniforms.atlasSampler, 0);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.atlasTexture);
        },
        setProjection: function (viewWidth, viewHeight, displayWidth, displayHeight) {
            // Call anytime the view or display changes size
            this.viewWidth = viewWidth;
            this.viewHeight = viewHeight;
            this.displayWidth = displayWidth || viewWidth;
            this.displayHeight = displayHeight || viewHeight;
            this.projection = Matrix.projection(this.viewWidth, this.viewHeight);
            this.draw.projection = this.projection;
            // Resize canvases
            this.cv1.width = displayWidth || viewWidth;
            this.cv1.height = displayHeight || viewHeight;
            this.cv2.width = this.cv1.width;
            this.cv2.height = this.cv1.height;
            // Resize game texture
            gl.bindTexture(gl.TEXTURE_2D, this.gameTexture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.viewWidth, this.viewHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
            // Fix content
            ctx.imageSmoothingEnabled = this.options.contextImageSmoothing;
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.scale(this.displayWidth / this.viewWidth, this.displayHeight / this.viewHeight);
        },
        beginRender: function () {
            // Call at the start of each frame
            if (this.options.matchPageToBackground) {
                document.body.style.backgroundColor = Color.toHex(new Color(this.background.red, this.background.green, this.background.blue));
            }
            // Draw to the framebuffer
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
            gl.viewport(0, 0, this.viewWidth, this.viewHeight);
            gl.clearColor(this.background.red, this.background.green, this.background.blue, 1);
            gl.clear(gl.COLOR_BUFFER_BIT);
            ctx.clearRect(0, 0, this.viewWidth, this.viewHeight);
            // Reset other properties
            if (this.atlasTexture) {
                gl.bindTexture(gl.TEXTURE_2D, this.atlasTexture);
            }
            gl.uniform4f(this.main.uniforms.blend, 1, 1, 1, 1);
            this.internalTimer.current++;
            if (this.internalTimer.current > 4096) {
                this.internalTimer.current = 0;
            }
        },
        endRender: function (transform, positions, UVs) {
            // Call at the end of each frame
            // Switch to correct framebuffer and texture
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.viewport(0, 0, this.displayWidth, this.displayHeight);
            gl.clearColor(0, 0, 0, 1);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.bindTexture(gl.TEXTURE_2D, this.gameTexture);
            // If arguments not provided, defaults to a unit quad
            main.setPositions(positions);
            main.setUVs(UVs);
            let mat = gameTexturePositionMatrix;
            if (transform) {
                mat = gameTexturePositionMatrix.copy();
                mat = transform(mat);
            }
            // Set uniforms
            gl.uniformMatrix3fv(main.uniforms.positionMatrix, false, mat.values);
            gl.uniformMatrix3fv(main.uniforms.textureMatrix, false, gameTextureTextureMatrix.values);
            if (this.blend instanceof Color) {
                gl.uniform4fv(main.uniforms.blend, [this.blend.red, this.blend.green, this.blend.blue, this.blend.alpha || 1]);
            }
            else {
                gl.uniform4fv(main.uniforms.blend, this.blend);
            }
            gl.uniform1i(main.uniforms.useTexture, 1);
            // Draw!
            gl.drawArrays(gl.TRIANGLES, 0, 6);
        },
        loadTexture: function (url, texParameters) {
            return new Promise((resolve, reject) => {
                const tex = gl.createTexture();
                if (!tex) {
                    throw new Error(`Failed to create WebGLTexture!`);
                }
                gl.bindTexture(gl.TEXTURE_2D, tex);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, getGLParameter((texParameters === null || texParameters === void 0 ? void 0 : texParameters.textureMagFilter) || 'linear') || gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, getGLParameter((texParameters === null || texParameters === void 0 ? void 0 : texParameters.textureMinFilter) || 'linear') || gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, getGLParameter((texParameters === null || texParameters === void 0 ? void 0 : texParameters.textureWrapS) || 'repeat') || gl.REPEAT);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, getGLParameter((texParameters === null || texParameters === void 0 ? void 0 : texParameters.textureWrapT) || 'repeat') || gl.REPEAT);
                const image = new Image();
                image.src = url;
                image.addEventListener('load', () => {
                    gl.bindTexture(gl.TEXTURE_2D, tex);
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
                    resolve({
                        image: image,
                        texture: tex,
                        width: image.width,
                        height: image.height,
                    });
                });
                image.addEventListener('error', reject);
                image.addEventListener('abort', reject);
            });
        },
        resizeCanvas: function () {
            switch (this.options.responsive) {
                case ('stretch'): {
                    // Fill up all available space
                    if (this.options.maintainAspectRatio) {
                        const ratio = this.viewWidth / this.viewHeight;
                        let newWidth = this.viewWidth, newHeight = this.viewHeight;
                        if (window.innerWidth > window.innerHeight) {
                            newWidth = newHeight * ratio;
                            newHeight = window.innerHeight;
                        }
                        else {
                            newWidth = window.innerWidth;
                            newHeight = newWidth / ratio;
                        }
                        this.setProjection(newWidth, newHeight);
                    }
                    else {
                        this.setProjection(window.innerWidth, window.innerHeight);
                    }
                    break;
                }
                case ('scale'): {
                    // Stretch, but only to whole-pixel values
                    if (this.options.maintainAspectRatio) {
                        let scale = 1;
                        if (window.innerWidth > window.innerHeight) {
                            scale = window.innerHeight / this.viewHeight;
                        }
                        else {
                            scale = window.innerWidth / this.viewWidth;
                        }
                        scale = Math.max(scale, 1);
                        if (this.options.scalePerfectly) {
                            scale = Math.floor(scale);
                        }
                        this.setProjection(this.viewWidth, this.viewHeight, this.viewWidth * scale, this.viewHeight * scale);
                    }
                    else {
                        this.setProjection(this.viewWidth, this.viewHeight, window.innerWidth, window.innerHeight);
                    }
                    break;
                }
                // Do nothing on static
                default: {
                    break;
                }
            }
        },
    };
    // Post-initialization adjustments
    s.ctx.imageSmoothingEnabled = s.options.contextImageSmoothing;
    s.setProjection((options === null || options === void 0 ? void 0 : options.viewWidth) || s.viewWidth, (options === null || options === void 0 ? void 0 : options.viewHeight) || s.viewHeight, options === null || options === void 0 ? void 0 : options.displayWidth, options === null || options === void 0 ? void 0 : options.displayHeight);
    if (s.options.enableCanvasResize) {
        window.addEventListener('resize', s.resizeCanvas.bind(s));
        window.addEventListener('orientation', s.resizeCanvas.bind(s));
        s.resizeCanvas();
    }
    return s;
}
export { initialize, };
