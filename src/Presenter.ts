export type Responsiveness = "static" | "stretch" | "scale";

/** Options to configure the Presenter */
export interface PresenterOptions {
    /** Lowest possible width of the canvases. Must be set if canvases are not specified manually. */
    baseWidth?: number;

    /** Lowest possible height of the canvases. Must be set if the canvases are not specified manually. */
    baseHeight?: number;

    /**
     * Canvas to use for WebGL2. If not specified, a canvas will be created and styled automatically.
     * 
     * If `baseWidth` and `baseHeight` are set, they will take precedence over the original size of the canvas. 
     */
    glCanvas?: HTMLCanvasElement;

    /**
     * Canvas to use for a 2D rendering context. This context is used for rendering above the GL canvas and is not affected by global effects, making it useful for HUDs or rendering text easily.
     * 
     * If `baseWidth` and `baseHeight` are set, they will take precedence over the original size of the canvas. This canvas will always match the size of the GL canvas.
     * 
     * If not specified, a canvas will be created and styled automatically. If providing a canvas, ensure it is styled to remain exactly on top of the GL canvas at all times. To disable the 2D context entirely, set to null. */
    ctxCanvas?: HTMLCanvasElement | null;

    /**
     * How the canvases should behave when the window changes size or orientation.
     * 
     * - `static`: No change, the canvases will always stay the same size
     * - `stretch`: The canvas will fill all available space, potentially distorting shapes.
     * - `scale`: The canvas will increase or decrease in size, while maintain its aspect ratio. This preserves shapes but may add bars on the top or sides of the view.
     * 
     * Defaults to `scale` if not provided.
     */
    responsiveness?: Responsiveness;

    /**
     * If `responsiveness` is set to `scale`, this ensures that the canvases will only scale to whole numbers, preventing bizarre visual artifacts and distortions from fractional pixels.
     * 
     * If `responsiveness` is not set to `scale`, this has no effect. Defaults to true.
     */
    scalePerfectly?: boolean;

    /** Callback when the canvas is resized. Note that if `responsiveness` is set to `static` this will never be called. */
    onResize?: ((newWidth: number, newHeight: number) => void) | undefined;
}

/** Manages the HTML canvases and their rendering contexts */
export class Presenter {

    /** Options used to create this Presenter, including default values */
    options: Required<PresenterOptions>;

    /** GL rendering context from the GL canvas */
    gl: WebGL2RenderingContext;

    /** 2D rendering context from the 2D canvas. Will be null if the 2D context is disabled by setting `options.ctxCanvas` to null. */
    ctx: CanvasRenderingContext2D | null;

    /** Factor of horizontal scaling currently applied to the canvases. If `responsiveness` is set to `static` this will always be 1. */
    scaleX: number;

    /** Factor of vertical scaling currently applied to the canvases. If `responsiveness` is set to `static` this will always be 1. */
    scaleY: number;

    constructor(options: PresenterOptions) {
        if (!options.baseWidth && !options.baseHeight && !options.glCanvas) {
            throw new PresenterError("Presenter must be initialized with either A) baseWidth and baseHeight or B) glCanvas specified.");
        }
        if (options.ctxCanvas && options.glCanvas === options.ctxCanvas) {
            throw new PresenterError("glCanvas and ctxCanvas must not be the same HTML element.");
        }

        const baseWidth = options.baseWidth ?? options.glCanvas?.width;
        const baseHeight = options.baseHeight ?? options.glCanvas?.height;
        if (!baseWidth || !baseHeight) {
            throw new PresenterError("Unable to determine base dimensions. Make sure either that both baseWidth and baseHeight are set, or the glCanvas is specified.");
        }

        let glCanvas: HTMLCanvasElement;
        const centerAndLayerCSS = "position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); overflow: hidden;";
        if (!options.glCanvas) {
            // Create a GL canvas
            glCanvas = document.createElement("canvas");
            glCanvas.setAttribute("style", centerAndLayerCSS);
            document.body.appendChild(glCanvas);
        } else {
            // Use pre-existing canvas
            glCanvas = options.glCanvas;
        }

        let ctxCanvas: HTMLCanvasElement | null = null;
        if (!options.ctxCanvas) {
            // Create a 2D canvas
            ctxCanvas = document.createElement("canvas");
            ctxCanvas.setAttribute("style", centerAndLayerCSS);
            document.body.appendChild(ctxCanvas);
        } else {
            if (options.ctxCanvas !== null) {
                // Use pre-existing canvas
                ctxCanvas = options.ctxCanvas;
            }
        }

        this.scaleX = 1;
        this.scaleY = 1;

        this.options = {
            baseWidth,
            baseHeight,
            glCanvas,
            ctxCanvas,
            responsiveness: options.responsiveness ?? "scale",
            scalePerfectly: options.scalePerfectly ?? true,
            onResize: options.onResize ?? (() => {}),
        };

        // Create our contexts
        const gl = glCanvas.getContext("webgl2");
        if (!gl) {
            throw new PresenterError("Failed to initialize WebGL2 context!");
        }

        let ctx: CanvasRenderingContext2D | null = null;
        if (ctxCanvas !== null) {
            ctx = ctxCanvas.getContext("2d");
            if (!ctx) {
                throw new PresenterError("Failed to initialize 2D canvas context!");
            }
        }

        this.gl = gl;
        this.ctx = ctx;

        if (this.options.responsiveness !== "static") {
            window.addEventListener("resize", this.resize.bind(this));
            window.addEventListener("orientationchange", this.resize.bind(this));
            this.resize();
        }
    }

    /** Resizes the canvases according its options and the new size of the window */
    resize() {
        switch (this.options.responsiveness) {
            case ("stretch"): {
                // Fill up all available space
                this.scaleX = window.innerWidth / this.options.baseWidth;
                this.scaleY = window.innerHeight / this.options.baseHeight;
                break;
            }
            case ("scale"): {
                // Maintain our aspect ratio
                let scale = 1;
                if (window.innerWidth > window.innerHeight) {
                    scale = window.innerHeight / this.options.baseHeight;
                } else {
                    scale = window.innerWidth / this.options.baseWidth;
                }
                scale = Math.max(scale, 1);
                if (this.options.scalePerfectly) {
                    scale = Math.floor(scale);
                }
                this.scaleX = scale;
                this.scaleY = scale;
                break;
            }
            default: break;
        }

        // Resize our canvases
        const width = this.currentWidth;
        const height = this.currentHeight;
        this.options.glCanvas.width = width;
        this.options.glCanvas.height = height;
        if (this.options.ctxCanvas) {
            this.options.ctxCanvas.width = width;
            this.options.ctxCanvas.height = height;
        }

        // Call our callback
        this.options.onResize(width, height);
    }

    /** Current width of the canvases, accounting for scaling */
    get currentWidth(): number {
        return this.options.baseWidth * this.scaleX;
    }

    /** Current height of the canvases, accounting for scaling */
    get currentHeight(): number {
        return this.options.baseHeight * this.scaleY;
    }
}

/** Describes issues with the canvases or their rendering contexts */
export class PresenterError extends Error {};