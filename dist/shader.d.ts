import Color from "./util/color.js";
import Matrix from "./util/matrix.js";
interface ShaderOptions {
    vertexSource: string;
    fragmentSource: string;
    useTexture: boolean;
    names: {
        positionAttribute: string;
        positionUniform: string;
        blendUniform: string;
        textureAttribute?: string;
        textureUniform?: string;
    };
}
declare class Shader {
    program: WebGLProgram;
    positionAttribute: number;
    positionMatrix: WebGLUniformLocation;
    blendUniform: WebGLUniformLocation;
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
    static imageShader: Shader;
    static primitiveShader: Shader;
    static projection: Matrix;
    static internalTimer: number;
    static createShader: (type: number, source: string) => WebGLShader;
    static cv1: HTMLCanvasElement;
    static cv2: HTMLCanvasElement;
    static gameTexture: WebGLTexture;
    static atlasTexture: WebGLTexture;
    static frameBuffer: WebGLFramebuffer;
    static gameTexturePositionMatrix: number[];
    static gameTextureIdentityMatrix: number[];
    static gameTextureBlend: Color | number[];
    static viewWidth: number;
    static viewHeight: number;
    static displayWidth: number;
    static displayHeight: number;
    static backgroundColor: {
        red: number;
        green: number;
        blue: number;
    };
    static contextImageSmoothing: boolean;
    static responsive: 'static' | 'stretch' | 'scale';
    static maintainAspectRatio?: boolean;
    static scalePerfectly?: boolean;
    /** Must be called before any drawing can take place. */
    static init: (gl: WebGLRenderingContext, ctx: CanvasRenderingContext2D, viewWidth: number, viewHeight: number, displayWidth?: number, displayHeight?: number, imageOptions?: ShaderOptions, primitiveOptions?: ShaderOptions, positionOrder?: Float32Array, triangleOrder?: Float32Array) => void;
    /** Must be called at the start of every animation frame.*/
    static beginRender: () => void;
    /** Must be called at the end of every animation frame. */
    static render: () => void;
    /** Must be called before the main loop begins. */
    static loadAtlasTexture: (url: string) => Promise<WebGLTexture>;
    /** Must be called every time the view changes size. */
    static setProjection: (viewWidth: number, viewHeight: number, displayWidth?: number, displayHeight?: number) => void;
    static setBackgroundColor: (red: number, green: number, blue: number) => void;
    constructor(opt: ShaderOptions);
    use(positions?: Float32Array): void;
}
export default Shader;
