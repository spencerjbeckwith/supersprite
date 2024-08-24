import { Draw, DrawDefaults } from "./Draw";
import { Presenter, PresenterOptions } from "./Presenter";
import { Shader } from "./Shader";
import { Timer } from "./util/Timer";

export interface SuperspriteOptions {
    /** 
     * Options for initializing the rendering canvases. At the minimum, must have either:
     * - Both base dimensions set (`baseWidth` and `baseHeight`)
     * - Canvas reference(s) set (`glCanvas`, and optionally, `ctxCanvas`) 
     * 
     * If one of the above is not met, this instance will throw on initialization.
     * */
    presenter: PresenterOptions;

    /** URL of the image to use as the texture atlas. If set to null, no texture will be loaded and only primitive drawing methods will be available. */
    atlasUrl: string | null;

    /** Configurable default overrides for various draw methods */
    drawDefaults?: DrawDefaults;
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

    /** Projection matrix based on the view's current size */
    #projection: number[];
    get projection() {
        return this.#projection;
    }

    constructor(options: SuperspriteOptions) {
        this.#projection = [1, 0, 0, 0, 1, 0, 0, 0, 1];

        // Create our child classes
        this.presenter = new Presenter(options.presenter);
        this.shader = new Shader(this.presenter.gl);
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
        if (options.atlasUrl) {
            // TODO
        }

        // Set up the game texture
        // TODO

        // Set up the framebuffer
        // TODO

        // Prepare GL to start rendering
        // TODO
    }

    beginRender() {
        // TODO
    }

    endRender() {
        // TODO
    }
}

export class CoreError extends Error {};