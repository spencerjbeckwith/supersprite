import Matrix from "./util/matrix";
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
    static currentProgram: WebGLProgram;
    static positionOrder: Float32Array;
    static triangleOrder: Float32Array;
    static imageShader: Shader;
    static primitiveShader: Shader;
    static projection: Matrix;
    static createShader: (type: number, source: string) => WebGLShader;
    /** Must be called before any drawing can take place. */
    static init: (gl: WebGLRenderingContext, viewWidth: number, viewHeight: number, imageOptions: ShaderOptions, primitiveOptions: ShaderOptions) => void;
    /** Must be called every time the view changes size. */
    static setProjection: (viewWidth: number, viewHeight: number) => void;
    constructor(opt: ShaderOptions);
    use(positions?: Float32Array): void;
}
export default Shader;
