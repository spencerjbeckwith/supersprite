import Color from './util/color.js';
import Matrix from './util/matrix.js';
import Shader from './shader.js';
import draw from './draw.js';
interface superspriteOptions {
    /** Your animation frame function. Be sure to call requestAnimationFrame at the end. This will be invoked by supersprite automatically once the atlas texture has loaded. */
    mainLoop: () => void;
    /** A URL to the atlas texture output by supersprite. Note that in order to test locally, you must host a local webserver to serve this resource. */
    atlasURL: string;
    /** Determines supersprite's behavior according to the window size. 'static' maintains a constant view and display size, 'stretch' matches the view and display size to the window, and 'scale' keeps the view size constant while stretching the display to the window size. */
    responsive?: 'static' | 'stretch' | 'scale';
    /** If true, supersprite will leave bars on screen to ensure no canvas contents are distorted. */
    maintainAspectRatio?: boolean;
    /** If true and 'responsive' is set to 'scale', only whole numbers will be scaled to. Ideal for pixel-perfect situations. */
    scalePerfectly?: boolean;
    /** Determines what color will appear behind all drawing. */
    backgroundColor?: {
        red: number;
        green: number;
        blue: number;
    };
    /** Controls GL's antialiasing. Should be false for pixel-art games, true otherwise. */
    glAntialias?: boolean;
    /** Controls the 2D context's antialiasing. Should be false for pixel-art games, true otherwise. */
    contextImageSmoothing?: boolean;
    /** The initial width of the view. May change if the responsive option is set to 'stretch'. */
    viewWidth?: number;
    /** The initial height of the view. May change if the responsive option is set to 'stretch'. */
    viewHeight?: number;
    /** The initial width of the canvas. May change if the responsive option is not set to 'static'. */
    displayWidth?: number;
    /** The initial height of the canvas. May change if the responsive option is not set to 'static'.*/
    displayHeight?: number;
}
/** Initialize supersprite by creating the canvases, setting up the GL and 2D contexts, and loading the atlas texture. */
declare function initialize(options: superspriteOptions): void;
/** Refreshes the size of the canvas according to the current size of the window and supersprite's responsive, maintainAspectRatio, and scalePerfectly options. */
declare function resizeCanvas(): void;
export { Color, Matrix, Shader, initialize, resizeCanvas, draw, };
