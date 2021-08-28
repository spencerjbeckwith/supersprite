import supersprite from "./sprite";

class Shader {
    program: WebGLProgram;
    attributes: {[ name: string]: number;} | ShaderAttributes;
    uniforms: {[ name: string]: WebGLUniformLocation;} | ShaderUniforms;
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
    constructor(s: supersprite, vertexSource: string, fragmentSource: string, useFunction: Function) {
        const gl = s.gl;
        if (!gl) {
            throw new Error('WebGL and context not initialized before compiling a shader!');
        }
        const vertexShader = Shader.createShader(gl,gl.VERTEX_SHADER,vertexSource);
        const fragmentShader = Shader.createShader(gl,gl.FRAGMENT_SHADER,fragmentSource);

        const program = gl.createProgram();
        if (!program) {
            throw new Error('Failed to create program!');
        }

        gl.attachShader(program,vertexShader);
        gl.attachShader(program,fragmentShader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program,gl.LINK_STATUS)) {
            const err = gl.getProgramInfoLog(program);
            gl.deleteProgram(program);
            throw new Error(`Failed to link shader program: ${err}`);
        }

        let buffer = gl.createBuffer();
        if (!buffer) {
            throw new Error('Failed to create WebGL buffer!');
        }
        this.positionBuffer = buffer;
        buffer = gl.createBuffer();
        if (!buffer) {
            throw new Error('Failed to create WebGL buffer!');
        }
        this.textureBuffer = buffer;

        // Link success
        this.attributes = {};
        this.uniforms = {};
        this.program = program;
        this.use = useFunction.bind(this);
        this.use = function(...args: any[]) {
            useFunction.bind(this)(...args);
            if (s.currentShader !== this) {
                s.currentShader = this;
                gl.useProgram(this.program);
            }
        }
    }
}

Shader.createShader = function(gl: WebGLRenderingContext, type: number, source: string): WebGLShader {
    // Don't call - this is called by the Shader constructor when you init
    const shader = gl.createShader(type);
    if (!shader) {
        throw new Error(`Failed to create shader!`);
    }
    gl.shaderSource(shader,source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader,gl.COMPILE_STATUS)) {
        const err = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error(`Failed to compile shader: ${err}`);
    }

    // Success!
    return shader;
}

export default Shader;