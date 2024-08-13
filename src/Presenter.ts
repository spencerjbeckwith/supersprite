
export type zGLTextureParameter =
    | "LINEAR"
    | "NEAREST"
    | "NEAREST_MIPMAP_NEAREST"
    | "LINEAR_MIPMAP_NEAREST"
    | "NEAREST_MIPMAP_LINEAR"
    | "LINEAR_MIPMAP_LINEAR"
    | "REPEAT"
    | "CLAMP_TO_EDGE"
    | "MIRRORED_REPEAT";

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

    /** If the 2D rendering context should have smoothing enabled or not. If the 2D context is disabled this has no effect. Defaults to false. */
    ctxSmoothingEnabled?: boolean;

    /** If `responsiveness` is set to `scale`, this ensures that the canvases will only scale to whole numbers, preventing bizarre visual artifacts and distortions from fractional pixels.
     * 
     * If `responsiveness` is not set to `scale`, this has no effect. Defaults to true.
     */
    scalePerfectly?: boolean;
}

/** Manages the HTML canvases and their rendering contexts */
export class Presenter {

    //options: Required<PresenterOptions>;

    //gl: WebGL2RenderingContext;
    //ctx: CanvasRenderingContext2D;

    constructor(options: PresenterOptions) {
        //this.options = options;
    }

    /** Resizes the canvases according its options and the new size of the window */
    resize() {

    }

    /** Current width of the canvases, accounting for scaling */
    get currentWidth(): number {
        return 0;
    }

    /** Current height of the canvases, accounting for scaling */
    get currentHeight(): number {
        return 0;
    }
}

export class PresenterError extends Error {};