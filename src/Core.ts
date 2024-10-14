import { Draw, DrawDefaults } from "./Draw";
import { Presenter, PresenterOptions } from "./Presenter";
import { Shader } from "./Shader";
import { MAX_TRANSFORMATIONS } from "./shaders/vertex";
import { Color } from "./util/Color";
import { Timer } from "./util/Timer";
import { Transform } from "./util/Transform";

/** Union of values for GL texture magnification functions */
export type GLTextureParameterMagFilter =
    | "LINEAR"
    | "NEAREST";

/** Union of values for GL texture minification functions */
export type GLTextureParameterMinFilter = 
    | "LINEAR"
    | "NEAREST"
    | "NEAREST_MIPMAP_NEAREST"
    | "LINEAR_MIPMAP_NEAREST"
    | "NEAREST_MIPMAP_LINEAR"
    | "LINEAR_MIPMAP_LINEAR";

/** Union of values for GL texture wrap parameters */
export type GLTextureParameterWrap = 
    | "REPEAT"
    | "CLAMP_TO_EDGE"
    | "MIRRORED_REPEAT";

/** Texture parameters set when initialzing a GL texture */
export interface GLTextureParameters {
    /** GL function to use when the texture must be magnified. Defaults to "NEAREST", which looks good at low resolutions. */
    magFilter?: GLTextureParameterMagFilter;
    /** GL function to use when the texture must be minified. Defaults to "NEAREST", which looks good at low resolutions.  */
    minFilter?: GLTextureParameterMinFilter;
    /** Wrapping behavior at the horizontal edges of the texture. Defaults to "REPEAT". */
    wrapS?: GLTextureParameterWrap;
    /** Wrapping beahvior at the vertical edges of the texture. Defaults to "REPEAT". */
    wrapT?: GLTextureParameterWrap;
}

export interface SuperspriteOptions {
    /** 
     * Options for initializing the rendering canvases. At the minimum, must have either:
     * - Both base dimensions set (`baseWidth` and `baseHeight`)
     * - Canvas reference(s) set (`glCanvas`, and optionally, `ctxCanvas`) 
     * 
     * If one of the above is not met, this instance will throw on initialization.
     * */
    presenter: PresenterOptions;

    /** Information about the texture atlas. If set to null, no texture will be loaded and only primitive drawing methods will be available. */
    atlas: {
        /** URL of the image to use */
        url: string;
        /** Texture parameters for the atlas to override defaults */
        parameters?: GLTextureParameters;
    } | null;

    /** Configurable default overrides for various draw methods */
    drawDefaults?: DrawDefaults;

    /** Set of texture parameters to override defaults for the game texture */
    gameTexture?: GLTextureParameters;
}

export class Core {

    /** Contains all rendering methods */
    draw: Draw;

    /** Manages the underlying GL shader plus their attributes and uniforms */
    shader: Shader;

    /** Manages HTML canvases and exposes their rendering contexts*/
    presenter: Presenter;

    /** Handles change-over-time such as sprite animations */
    timer: Timer;

    /** Information about the texture atlas */
    atlas: {
        /** WebGL texture containing the atlas, if it has been loaded */
        texture: WebGLTexture | null;

        /** Image containing the atlas, if it has been loaded */
        image: CanvasImageSource | null;
    }

    /** The texture on which all other rendering methods draw to */
    gameTexture: WebGLTexture;

    /** Framebuffer used to render to the game texture, so different effects may be applied "globally" */
    framebuffer: WebGLFramebuffer;

    /** Projection matrix based on the view's current size, translating from pixel coordinates into clipspace */
    #projection: number[];
    get projection() {
        return this.#projection;
    }

    /** Pre-initialized matrix for the game texture's position on screen */
    #positionsMatrix: number[];

    /** Pre-initialized identity matrix */
    #identityMatrix: number[];

    /** Pre-initialized array of zeros used to unset any prior transformations before rendering the game texture */
    #transformationReset: number[];

    /** Whatever color the background is set to in `beginRender()`. */
    #frameBackgroundColor: Color;

    constructor(options: SuperspriteOptions) {
        // Position matrix to place the game texture into clipspace
        this.#positionsMatrix = [
            2, 0, 0,
            0, 2, 0,
            -1, -1, 1
        ];

        // Texture matrix for the game texture is identity, because we aren't slicing or contorting it (unless UVs are manually defined)
        this.#identityMatrix = [
            1, 0, 0,
            0, 1, 0,
            0, 0, 1
        ];

        // Create our child classes
        this.presenter = new Presenter(options.presenter);
        this.#projection = [
            2 / this.presenter.options.baseWidth, 0, 0,
            0, -2 / this.presenter.options.baseHeight, 0,
            -1, 1, 1
        ];
        const gl = this.presenter.gl;
        this.shader = new Shader(gl);
        this.timer = new Timer();
        this.draw = new Draw(
            this.shader,
            this.presenter.gl,
            this.presenter.ctx,
            null,
            this.projection,
            this.timer,
            options.drawDefaults,
        );

        // Load the atlas asynchronously, if specified in the options
        this.atlas = {
            texture: null,
            image: null,
        }
        if (options.atlas) {
            const tex = gl.createTexture();
            if (!tex) {
                throw new CoreError("Failed to create atlas texture!");
            }
            gl.bindTexture(gl.TEXTURE_2D, tex);
            this.#setTextureParameters(options.atlas.parameters);
            
            const image = new window.Image();
            image.src = options.atlas.url;
            image.addEventListener("load", () => {
                gl.bindTexture(gl.TEXTURE_2D, tex);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
                gl.uniform1i(this.shader.uniforms.atlas, 0);
                gl.activeTexture(gl.TEXTURE0);
                this.atlas.texture = tex;
                this.atlas.image = image;
                this.draw.atlasImage = image;
            });
            image.addEventListener("error", console.error);
        }

        // Set up the game texture
        const gameTexture = gl.createTexture();
        if (!gameTexture) {
            throw new CoreError("Failed to create game texture!");
        }
        this.gameTexture = gameTexture;
        gl.bindTexture(gl.TEXTURE_2D, this.gameTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.presenter.options.baseWidth, this.presenter.options.baseHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        this.#setTextureParameters(options.gameTexture);
        gl.bindTexture(gl.TEXTURE_2D, null);

        // Set up the framebuffer
        const framebuffer = gl.createFramebuffer();
        if (!framebuffer) {
            throw new CoreError("Failed to create framebuffer!");
        }
        this.framebuffer = framebuffer;
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, gameTexture, 0);

        // Prepare GL to start rendering
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.disable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        this.#frameBackgroundColor = new Color("#000000");

        // Listen for view change events to update our projection
        this.presenter.options.onResize = (newWidth, newHeight) => {
            // Fix 2D context
            const ctx = this.presenter.ctx;
            if (ctx) {
                ctx.imageSmoothingEnabled = this.draw.defaults.contextSmoothing;
                ctx.setTransform(1, 0, 0, 1, 0, 0);
                ctx.scale(newWidth / this.presenter.options.baseWidth, newHeight / this.presenter.options.baseHeight);
            }

            // And call onResize if it was manually defined
            if (options.presenter.onResize) {
                options.presenter.onResize(newWidth, newHeight);
            }
        };

        // Transformation reset: array of zeros so drawing our game texture doesn't apply anything from prior draw calls
        this.#transformationReset = [];
        while (this.#transformationReset.length < MAX_TRANSFORMATIONS * 3) {
            this.#transformationReset.push(0);
        }

        // Scale ctx correctly on init
        const ctx = this.presenter.ctx;
        if (ctx) {
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.scale(this.presenter.scaleX, this.presenter.scaleY);
            ctx.imageSmoothingEnabled = this.draw.defaults.contextSmoothing;
        }
    }

    /** Should be called at the start of every frame to initialize drawing */
    beginRender(backgroundColor?: Color) {
        const gl = this.presenter.gl;
        const ctx = this.presenter.ctx;

        // Draw to the framebuffer
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
        gl.viewport(0, 0, this.presenter.options.baseWidth, this.presenter.options.baseHeight);

        // Clear background to specified color, or default
        const bg = backgroundColor ?? this.draw.defaults.backgroundColor;
        gl.clearColor(bg.red, bg.green, bg.blue, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        this.#frameBackgroundColor = bg;
        if (ctx) {
            ctx.clearRect(0, 0, this.presenter.currentWidth, this.presenter.currentHeight);
        }

        // Reset texture and blend
        if (this.atlas.texture) {
            gl.bindTexture(gl.TEXTURE_2D, this.atlas.texture);
        }
        gl.uniform4f(this.shader.uniforms.blend, 1, 1, 1, 1);

        // Handle timing
        this.timer.increment();
    }

    /** Should be called at the end of every frame to render the game texture to the screen */
    endRender(positions?: number[], UVs?: number[], transform?: Transform, blend?: Color) {
        const gl = this.presenter.gl;

        // Switch to correct framebuffer and texture
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindTexture(gl.TEXTURE_2D, this.gameTexture);

        gl.viewport(0, 0, this.presenter.currentWidth, this.presenter.currentHeight);
        // Multiply background color by our blend to avoid "leakage" behind the game texture
        // Also keep the page matched to this color, if configured
        const bgRed = this.#frameBackgroundColor.red * (blend?.red ?? 1);
        const bgGreen = this.#frameBackgroundColor.green * (blend?.green ?? 1);
        const bgBlue = this.#frameBackgroundColor.blue * (blend?.blue ?? 1);
        gl.clearColor(bgRed, bgGreen, bgBlue, 1);
        if (this.draw.defaults.matchPageToBackground) {
            document.body.style.backgroundColor = new Color(bgRed, bgGreen, bgBlue).toHex();
        }
        gl.clear(gl.COLOR_BUFFER_BIT);

        this.shader.setPositions(positions);
        this.shader.setUVs(UVs);

        // Apply transformation (or a reset)
        gl.uniform3fv(this.shader.uniforms.transformations, transform?.toArray() ?? this.#transformationReset);

        // Set uniforms and render the game texture
        gl.uniformMatrix3fv(this.shader.uniforms.positionMatrix, false, this.#positionsMatrix);
        gl.uniformMatrix3fv(this.shader.uniforms.textureMatrix, false, this.#identityMatrix);
        gl.uniform1i(this.shader.uniforms.textured, 1);

        // Set blend if provided
        gl.uniform4f(this.shader.uniforms.blend, blend?.red ?? 1, blend?.green ?? 1, blend?.blue ?? 1, blend?.alpha ?? 1);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
        gl.bindTexture(gl.TEXTURE_2D, null); // Unbind the game texture or we may create a feedback loop next frame
    }

    /** Updates the texture parameters on the currently bound texture */
    #setTextureParameters(params?: GLTextureParameters) {
        const gl = this.presenter.gl;
        const magFilter = params?.magFilter || "NEAREST";
        const minFilter = params?.minFilter || "NEAREST";
        const wrapS = params?.wrapS || "REPEAT";
        const wrapT = params?.wrapT || "REPEAT";
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl[magFilter]);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl[minFilter]);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl[wrapS]);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl[wrapT]);
    }
}

/** Describes issues with the Core or its usage of its child classes or WebGL */
export class CoreError extends Error {};