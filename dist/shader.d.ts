import supersprite from "./sprite";
declare class Shader {
    program: WebGLProgram;
    attributes: {
        [name: string]: number;
    } | ShaderAttributes;
    uniforms: {
        [name: string]: WebGLUniformLocation;
    } | ShaderUniforms;
    positionBuffer: WebGLBuffer;
    textureBuffer: WebGLBuffer;
    use: Function;
    /**
     * Creates a Shader from a type (vertex or attribute) and its source code.
     * @param type The type of shader to create - gl.VERTEX_SHADER or gl.FRAGMENT_SHADER
     * @param source The code to compile
     */
    static createShader: (gl: WebGLRenderingContext, type: number, source: string) => WebGLShader;
    /** Must be called before the main loop begins. This is called automatically by the initialize function. */
    static loadAtlasTexture: (url: string) => Promise<WebGLTexture>;
    /** Creates a new Shader instance with a new shader program. */
    constructor(s: supersprite, vertexSource: string, fragmentSource: string, useFunction: Function);
}
export default Shader;
