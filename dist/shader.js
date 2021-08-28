class Shader {
    /** Creates a new Shader instance with a new shader program. */
    constructor(s, vertexSource, fragmentSource, useFunction) {
        const gl = s.gl;
        if (!gl) {
            throw new Error('WebGL and context not initialized before compiling a shader!');
        }
        const vertexShader = Shader.createShader(gl, gl.VERTEX_SHADER, vertexSource);
        const fragmentShader = Shader.createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
        const program = gl.createProgram();
        if (!program) {
            throw new Error('Failed to create program!');
        }
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
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
        this.use = function (...args) {
            useFunction.bind(this)(...args);
            if (s.currentShader !== this) {
                s.currentShader = this;
                gl.useProgram(this.program);
            }
        };
    }
}
Shader.createShader = function (gl, type, source) {
    // Don't call - this is called by the Shader constructor when you init
    const shader = gl.createShader(type);
    if (!shader) {
        throw new Error(`Failed to create shader!`);
    }
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const err = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error(`Failed to compile shader: ${err}`);
    }
    // Success!
    return shader;
};
export default Shader;
