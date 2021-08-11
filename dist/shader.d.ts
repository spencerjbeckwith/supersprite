import Color from "./util/color.js";
import Matrix from "./util/matrix.js";
/** A class for shader programs used by supersprite, which contains a lot of static properties and methods to control supersprite's drawing behavior. */
declare class Shader {
    /** The WebGL program created by this Shader instance. */
    program: WebGLProgram;
    blendUniform: WebGLUniformLocation;
    positionAttribute: number;
    positionMatrix: WebGLUniformLocation;
    textureAttribute?: number;
    textureMatrix?: WebGLUniformLocation;
    buffer: WebGLBuffer;
    static gl: WebGLRenderingContext;
    static ctx: CanvasRenderingContext2D;
    static currentProgram: WebGLProgram | null;
    /** Determines the order of vertices drawn when drawing image squares. */
    static positionOrder: Float32Array;
    /** Determines the order of vertices drawn when drawing primitives. */
    static triangleOrder: Float32Array;
    /** The shader to be used when drawing sprites. */
    static imageShader: Shader;
    /** The shader to be used when drawing primitives such as circles or lines. */
    static primitiveShader: Shader;
    /** A 3D projection matrix that is set according to the current view/displa sizes. */
    static projection: Matrix;
    /** Used for drawing sprites by their image speed and other time-sensitive effects. */
    static internalTimer: number;
    /**
     * Creates a Shader from a type (vertex or attribute) and its source code.
     * @param type The type of shader to create - gl.VERTEX_SHADER or gl.FRAGMENT_SHADER
     * @param source The code to compile
     */
    static createShader: (type: number, source: string) => WebGLShader;
    /** The GL canvas. */
    static cv1: HTMLCanvasElement;
    /** The 2D canvas. */
    static cv2: HTMLCanvasElement;
    /** All drawing happens to the gameTexture, which is then drawn via the imageShader. This allows full-screen shader effects. */
    static gameTexture: WebGLTexture;
    /** The texture from which all sprites are drawn. */
    static atlasTexture: WebGLTexture;
    /** The image element that becomes the atlas texture. */
    static atlasImage: HTMLImageElement;
    /** The buffer used to allow drawing onto the gameTexture, to enable full-screen shader effects. */
    static frameBuffer: WebGLFramebuffer;
    static gameTexturePositionMatrix: number[];
    static gameTextureIdentityMatrix: number[];
    /** You can set this to alter the blend of the full game screen, for full-screen effects like flashing or fading. */
    static gameTextureBlend: Color | number[];
    /** The current width of the view, which is the game's playing area. */
    static viewWidth: number;
    /** The current height of the view, which is the game's playing area. */
    static viewHeight: number;
    /** The current width of the display, which is the size of the canvas on-screen. This may or may not match viewWidth depending on your options. */
    static displayWidth: number;
    /** The current height of the display, which is the size of the canvas on-screen. This may or may not match viewHeight depending on your options. */
    static displayHeight: number;
    /** The color to place behind all other drawing. */
    static backgroundColor: {
        red: number;
        green: number;
        blue: number;
    };
    /** Determines supersprite's behavior according to the window size. 'static' maintains a constant view and display size, 'stretch' matches the view and display size to the window, and 'scale' keeps the view size constant while stretching the display to the window size. */
    static responsive: 'static' | 'stretch' | 'scale';
    /** If true, supersprite will leave bars on screen to ensure no canvas contents are distorted. */
    static maintainAspectRatio?: boolean;
    /** If true and 'responsive' is set to 'scale', only whole numbers will be scaled to. Ideal for pixel-perfect situations. */
    static scalePerfectly?: boolean;
    /** Controls the 2D context's antialiasing. Should be false for pixel-art games, true otherwise. */
    static contextImageSmoothing: boolean;
    /** Must be called before any drawing can take place. This is called by the initialize function. If you'd rather set up your canvases directly, use this function instead. You will have to set 'cv1', 'cv2', 'responsive', 'maintainAspectRatio', and 'scalePerfectly' on Shader manually, however.
    
    By providing imageOptions or primitiveOptions you can override the default image and primitive shaders with your own program.
    */
    static init: (gl: WebGLRenderingContext, ctx: CanvasRenderingContext2D, viewWidth: number, viewHeight: number, displayWidth?: number, displayHeight?: number, imageOptions?: ShaderOptions, primitiveOptions?: ShaderOptions, positionOrder?: Float32Array, triangleOrder?: Float32Array) => void;
    /** Must be called at the start of every animation frame before any drawing can take place. */
    static beginRender: () => void;
    /** Must be called at the end of every animation frame, after all drawing is done. */
    static render: () => void;
    /** Must be called before the main loop begins. This is called automatically by the initialize function. */
    static loadAtlasTexture: (url: string) => Promise<WebGLTexture>;
    /** Must be called every time the view changes size. */
    static setProjection: (viewWidth: number, viewHeight: number, displayWidth?: number, displayHeight?: number) => void;
    /** Updates the background color. */
    static setBackgroundColor: (red: number, green: number, blue: number) => void;
    /** Creates a new Shader instance with a new shader program. */
    constructor(opt: ShaderOptions);
    /** Sets this current Shader instance as the current program to use when drawing. */
    use(positions?: Float32Array): void;
}
export default Shader;
