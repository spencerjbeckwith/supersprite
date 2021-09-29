import Matrix from './util/matrix';
import Color from './util/color';
import { prepareMainShader, MainShader, MainShaderOptions }from './shader';
import { prepareDrawing, Draw } from './draw';

/** Options object provided to supersprite's initialize() function. */
interface SuperspriteOptions {

    /** The initial width of the canvas. Default 400. */
    displayWidth?: number;

    /** The initial height of the canvas. Default 200. */
    displayHeight?: number;

    /** The initial width of the game view, which will stretch to fill the canvas if it does not match displayWidth. Default 400. */
    viewWidth?: number;

    /** The initial height of the game view, which will stretch to fill the canvas if it does not match displayHeight. Default 200. */
    viewHeight?: number;

    /** Options object for the WebGL context. No default provided. */
    glOptions?: WebGLContextAttributes;

    /** Options object for the 2D canvas context. No default provided. */
    ctxOptions?: CanvasRenderingContext2DSettings;

    /** How to respond to different screen sizes or changes in the screen size. "static" maintains the same size, "stretch" will fill the entire screen with the game view, and "scale" will stretch only the display and not the game view. Default "scale".*/
    responsive?: 'static' | 'stretch' | 'scale';

    /** If true, the view will maintain the same aspect ratio as set by the initial viewWidth and viewHeight. Default true.*/
    maintainAspectRatio?: boolean;

    /** If true, the view will not scale to any non-integer values even if it could. Default true. */
    scalePerfectly?: boolean;

    /** Controls whether or not the 2D canvas context should use antialiasing or not. Default false. */
    contextImageSmoothing?: boolean;

    /** If true, the HTML's background color will be matched to supersprite's background color. Default false. */
    matchPageToBackground?: boolean;

    /** If true, the canvas will resize responsively as the page changes size. Default true. */
    enableCanvasResize?: boolean;

    /** Options that can be passed during initialization to configure the shader. Can be used to replace the default source. */
    mainShaderOptions?: MainShaderOptions;

    /** Optional initial texture parameters to apply to the game texture, depending on the style of your game. */
    gameTextureParameters?: {
        textureMagFilter?: 'linear' | 'nearest';
        textureMinFilter?: 'linear' | 'nearest' | 'nearestMipmapNearest' | 'linearMipmapNearest' | 'nearestMipmapLinear' | 'linearMipmapLinear';
        textureWrapS?: 'repeat' | 'clampToEdge' | 'mirroredRepeat';
        textureWrapT?: 'repeat' | 'clampToEdge' | 'mirroredRepeat';
    }
}

/** Main access point to use supersprite. */
interface Supersprite {
    /** The WebGL canvas */
    cv1: HTMLCanvasElement;

    /** The 2D context canvas, overlaid above the first canvas. */
    cv2: HTMLCanvasElement;

    /** An image element of the atlas texture for sprite drawing. */
    atlasImage: HTMLImageElement | null;

    /** The WebGL context used by supersprite. */
    gl: WebGL2RenderingContext;

    /** The 2D context used by supersprite, overlaid above the first canvas. */
    ctx: CanvasRenderingContext2D;

    /** A matrix used by WebGL to convert pixels into clipspace coordinates. */
    projection: Matrix;

    /** A timer that increments on each frame, allowing for continual animation or other effects. */
    internalTimer: { current: number };

    /** The texture that all rendering happens onto, which is then drawn to the screen at the end of each frame. */
    gameTexture: WebGLTexture;

    /** The texture from which all sprites should be drawn. */
    atlasTexture: WebGLTexture | null;

    /** The FrameBuffer used to draw the gameTexture before the end of the frame. */
    framebuffer: WebGLFramebuffer;

    /** The width of the game view, where drawing can occur. It may or may not match the displayWidth, depending on the "responsive" property. */
    viewWidth: number;
    /** The height of the game view, where drawing can occur. It may or may not match the displayHeight, depending on the "responsive" property. */
    viewHeight: number;
    /** The width of the canvases. It may or may not match the viewWidth, depending on the "responsive" property. */
    displayWidth: number;
    /** The height of the canvases. It may or may not match the viewHeight, depending on the "responsive" property.*/
    displayHeight: number;

    /** The background color to draw when nothing else is present. */
    background: {
        red: number;
        blue: number;
        green: number;
    };
    
    /** A color to blend the entire gameTexture by. */
    blend: Color | [number, number, number, number];

    /** Provides access to all properties/methods directly related to the shader */
    main: MainShader;
    /** Provides access to all drawing properties/methods */
    draw: Draw,

    /** Stored options, depending on how supersprite is initialized */
    options: {
        /** How to respond to different screen sizes or changes in the screen size. "static" maintains the same size, "stretch" will fill the entire screen with the game view, and "scale" will stretch only the display and not the game view. */
        responsive: 'static' | 'stretch' | 'scale';

        /** If true, the view will maintain the same aspect ratio as set by the initial viewWidth and viewHeight. */
        maintainAspectRatio: boolean;

        /** If true, the view will not scale to any non-integer values even if it could. */
        scalePerfectly: boolean;

        /** Controls whether or not the 2D canvas context should use antialiasing or not. */
        contextImageSmoothing: boolean;

        /** If true, the HTML's background color will be matched to supersprite's background color. */
        matchPageToBackground: boolean;

        /** If true, the canvas will resize responsively as the page changes size. Default true. */
        enableCanvasResize: boolean;
    }

    /** Called to make the canvas respond properly to different screen sizes. */
    resizeCanvas: () => void;

    /** Must be called each time the game view or the canvas display changes size in order to ensure the projection matrix remains correct. The displayWidth and displayHeight must only be provided if they are different from the view. Normally this is only called when the screen is resized. */
    setProjection: (viewWidth: number, viewHeight: number, displayWidth?: number, displayHeight?: number) => void;

    /** Must be called at the start of every frame. */
    beginRender: () => void;

    /** Must be called at the end of every frame. The optional transform, positions, and UVs arguments can apply transformations or contortions to the entire gameTexture as its drawn. */
    endRender: (transform?: (mat: Matrix) => Matrix, positions?: number[], UVs?: number[]) => void;

    /** Loads a new texture and image element from a provided URL. */
    loadTexture: (url: string, texParameters?: {
        textureMagFilter?: number;
        textureMinFilter?: number;
        textureWrapS?: number;
        textureWrapT?: number;
    }) => Promise<AtlasTextureObject>;

    /** Sets the atlasTexture and atlasImage, as returned from loadTexture. Must be called AFTER initializing supersprite, but BEFORE you start drawing. */
    setAtlas: (atlasObject: AtlasTextureObject) => void;
}

/** Holds all texture/image information required for supersprite to draw it, both in WebGL or on the 2D context. */
interface AtlasTextureObject {
    image: HTMLImageElement; 
    texture: WebGLTexture;
    width: number;
    height: number;
}

const defaultWidth = 400;
const defaultHeight = 240;

/** Initializes supersprite. This must be called before loading textures or drawing anything. */
function initialize(options?: SuperspriteOptions): Supersprite {
    // Create our canvases in DOM
    const cv1 = document.createElement('canvas');
    const cv2 = document.createElement('canvas');
    cv1.setAttribute('style','position: absolute; left: 50%; top: 50%; transform: translate(-50%,-50%); overflow: hidden;');
    cv2.setAttribute('style','position: absolute; left: 50%; top: 50%; transform: translate(-50%,-50%); overflow: hidden;');
    document.body.style.backgroundColor = '#000000';
    document.body.appendChild(cv1);
    document.body.appendChild(cv2);
    
    // Size canvases appropriately
    cv1.width = options?.displayWidth || options?.viewWidth || window.innerWidth;
    cv1.height = options?.displayHeight || options?.viewHeight || window.innerHeight;
    cv2.width = cv1.width;
    cv2.height = cv1.height;

    // Get contexts
    const gl = cv1.getContext('webgl2', options?.glOptions);
    if (!gl) { throw new Error('Failed to initialize WebGL context!'); }
    const ctx = cv2.getContext('2d', options?.ctxOptions);
    if (!ctx) { throw new Error('Failed to initialize 2D canvas context!'); }
    const main = prepareMainShader(gl, options?.mainShaderOptions);

    // Set up gameTexture
    const gameTexture = gl.createTexture();
    if (!gameTexture) { throw new Error(`Failed to create gameTexture!`); }
    gl.bindTexture(gl.TEXTURE_2D, gameTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, defaultWidth, defaultHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE,null);
    if (options?.gameTextureParameters) {
        // Change the string options into the appropriate GL enums
        function getGLParameter(str: 'linear' | 'nearest' | 'nearestMipmapNearest' | 'linearMipmapNearest' | 'nearestMipmapLinear' | 'linearMipmapLinear' | 'repeat' | 'clampToEdge' | 'mirroredRepeat'): number | undefined {
            switch (str) {
                case ('linear'): { return gl?.LINEAR; }
                case ('nearest'): { return gl?.NEAREST; }
                case ('nearestMipmapNearest'): { return gl?.NEAREST_MIPMAP_NEAREST; }
                case ('linearMipmapNearest'): { return gl?.LINEAR_MIPMAP_NEAREST; }
                case ('nearestMipmapLinear'): { return gl?.NEAREST_MIPMAP_LINEAR; }
                case ('linearMipmapLinear'): { return gl?.LINEAR_MIPMAP_LINEAR; }
                case ('repeat'): { return gl?.REPEAT; }
                case ('clampToEdge'): { return gl?.CLAMP_TO_EDGE; }
                case ('mirroredRepeat'): { return gl?.MIRRORED_REPEAT; }
            }
        }

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, getGLParameter(options.gameTextureParameters.textureMagFilter || 'linear') || gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, getGLParameter(options.gameTextureParameters.textureMinFilter || 'nearestMipmapLinear') || gl.NEAREST_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, getGLParameter(options.gameTextureParameters.textureWrapS || 'repeat') || gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, getGLParameter(options.gameTextureParameters.textureWrapT || 'repeat') || gl.REPEAT);
    } else {
        // Defaults
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    }

    // Used for rendering the gameTexture
    const gameTexturePositionMatrix = new Matrix([2, 0, 0, 0, -2, 0, -1, 1, 1]);
    const gameTextureTextureMatrix = new Matrix([1, 0, 0, 0, 1, 0, 0, 0, 1]);

    // Set up framebuffer
    const framebuffer = gl.createFramebuffer();
    if (!framebuffer) { throw new Error(`Failed to create framebuffer!`); }
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, gameTexture, 0);

    // Initialize gl
    gl.clearColor(0,0,0,1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);

    const projection = Matrix.projection(400, 240);
    const internalTimer = { current: 0 };

    // Create return object
    const s: Supersprite = {
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
        blend: [ 1, 1, 1, 1],
        options: {
            responsive: options?.responsive ? options.responsive : 'scale',
            maintainAspectRatio: options?.maintainAspectRatio ? options.maintainAspectRatio : true,
            scalePerfectly: options?.scalePerfectly ? options.scalePerfectly : true,
            contextImageSmoothing: options?.contextImageSmoothing ? options.contextImageSmoothing : false,
            matchPageToBackground: options?.matchPageToBackground ? options.matchPageToBackground : false,
            enableCanvasResize: options?.enableCanvasResize ? options.enableCanvasResize : true,
        },

        // Methods
        setAtlas: function(atlasObject: AtlasTextureObject) {
            this.atlasTexture = atlasObject.texture;
            this.atlasImage = atlasObject.image;
            this.draw.atlasTexture = this.atlasTexture;
            this.draw.atlasImage = this.atlasImage;

            gl.uniform1i(main.uniforms.atlasSampler, 0);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.atlasTexture);
        },

        setProjection: function(viewWidth: number, viewHeight: number, displayWidth?: number, displayHeight?: number) {
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
            ctx.setTransform(1,0,0,1,0,0);
            ctx.scale(this.displayWidth / this.viewWidth, this.displayHeight / this.viewHeight);
        },

        beginRender: function() {
            // Call at the start of each frame
            if (this.options.matchPageToBackground) {
                document.body.style.backgroundColor = Color.toHex(new Color(this.background.red,this.background.green,this.background.blue));
            }

            // Draw to the framebuffer
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);    
            gl.viewport(0, 0, this.viewWidth, this.viewHeight);
            gl.clearColor(this.background.red, this.background.green, this.background.blue, 1);
            gl.clear(gl.COLOR_BUFFER_BIT);
            ctx.clearRect(0, 0, this.viewWidth, this.viewHeight);
    
            // Reset other properties
            if (this.atlasTexture) { gl.bindTexture(gl.TEXTURE_2D,this.atlasTexture); }
            gl.uniform4f(this.main.uniforms.blend,1,1,1,1);
            this.internalTimer.current++;
            if (this.internalTimer.current > 4096) { this.internalTimer.current = 0; }
        },

        endRender: function(transform?: (mat: Matrix) => Matrix, positions?: number[], UVs?: number[]) {
            // Call at the end of each frame
    
            // Switch to correct framebuffer and texture
            gl.bindFramebuffer(gl.FRAMEBUFFER,null);
            gl.viewport(0,0,this.displayWidth,this.displayHeight);
            gl.clearColor(0,0,0,1);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.bindTexture(gl.TEXTURE_2D,this.gameTexture);
    
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
                gl.uniform4fv(main.uniforms.blend,[this.blend.red,this.blend.green,this.blend.blue,this.blend.alpha || 1]);
            } else {
                gl.uniform4fv(main.uniforms.blend,this.blend);
            }
            gl.uniform1i(main.uniforms.useTexture,1);

            // Draw!
            gl.drawArrays(gl.TRIANGLES,0,6);
        },

        loadTexture: function(url: string, texParameters?: {
            textureMagFilter?: number;
            textureMinFilter?: number;
            textureWrapS?: number;
            textureWrapT?: number;
        }): Promise<AtlasTextureObject> {
            return new Promise((resolve, reject) => {
                const tex = gl.createTexture();
                if (!tex) { throw new Error(`Failed to create WebGLTexture!`); }
                gl.bindTexture(gl.TEXTURE_2D,tex);
                gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,texParameters?.textureMagFilter || gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,texParameters?.textureMinFilter || gl.NEAREST_MIPMAP_LINEAR);
                gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,texParameters?.textureWrapS || gl.REPEAT);
                gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,texParameters?.textureWrapT || gl.REPEAT);
        
                const image = new Image();
                image.src = url;
                image.addEventListener('load',() => {
                    gl.bindTexture(gl.TEXTURE_2D,tex);
                    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);
                    resolve({
                        image: image,
                        texture: tex,
                        width: image.width,
                        height: image.height,
                    });
                });
                image.addEventListener('error',reject);
                image.addEventListener('abort',reject);
            });
        },

        resizeCanvas: function() {
            switch (this.options.responsive) {
                case ('stretch'): {
                    // Fill up all available space
                    if (this.options.maintainAspectRatio) {
                        const ratio = this.viewWidth / this.viewHeight;
                        let newWidth = this.viewWidth, newHeight = this.viewHeight;
    
                        if (window.innerWidth > window.innerHeight) {
                            newWidth = newHeight * ratio;
                            newHeight = window.innerHeight;
                        } else {
                            newWidth = window.innerWidth;
                            newHeight = newWidth / ratio;
                        }
    
                        this.setProjection(newWidth,newHeight);
                    } else {
                        this.setProjection(window.innerWidth,window.innerHeight);
                    }
                    
                    break;
                }
    
                case ('scale'): {
                    // Stretch, but only to whole-pixel values
                    if (this.options.maintainAspectRatio) {
                        let scale = 1;
                        if (window.innerWidth > window.innerHeight) {
                            scale = window.innerHeight / this.viewHeight;
                        } else {
                            scale = window.innerWidth / this.viewWidth;
                        }
    
                        scale = Math.max(scale,1);
                        if (this.options.scalePerfectly) {
                            scale = Math.floor(scale);
                        }
    
                        this.setProjection(this.viewWidth,this.viewHeight,this.viewWidth * scale, this.viewHeight * scale);
                    } else {
                        this.setProjection(this.viewWidth,this.viewHeight,window.innerWidth,window.innerHeight);
                    }
    
                    break;
                }
    
                // Do nothing on static
                default: { break; }
            }
        },
    }

    // Post-initialization adjustments
    s.ctx.imageSmoothingEnabled = s.options.contextImageSmoothing;
    s.setProjection(options?.viewWidth || s.viewWidth, options?.viewHeight || s.viewHeight, options?.displayWidth, options?.displayHeight);
    if (s.options.enableCanvasResize) {
        window.addEventListener('resize',s.resizeCanvas.bind(s));
        window.addEventListener('orientation',s.resizeCanvas.bind(s));
        s.resizeCanvas();
    }

    return s;
}

export {
    Supersprite,
    SuperspriteOptions,
    initialize,
}