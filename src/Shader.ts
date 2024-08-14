import defaultVertexSource from "./shaders/vertex";
import defaultFragmentSource from "./shaders/fragment";

export const UNIT_QUAD = [
    // Triangle 1:
    0, 0,
    0, 1,
    1, 1,
    // Triangle 2:
    1, 1,
    1, 0,
    0, 0,
];

/** Primary WebGL initializer and controller, responsible for creating and interacting with the shader program through its attributes and uniforms */
export class Shader {

    /** Reference to the rendering context */
    gl: WebGL2RenderingContext;

    /** The compiled vertex shader */
    vertexShader: WebGLShader;
    /** The compiled fragment shader */
    fragmentShader: WebGLShader;
    /** The linked (vertex+fragment) shader program */
    program: WebGLProgram;

    /** Buffers used for feeding data into the shader program */
    buffers: {
        /** Always contains a unit quad (a square) */
        square: WebGLBuffer;
        /** Stores vertex information to be read by WebGL */
        position: WebGLBuffer;
        /** Stores texture information to be read by WebGL */
        texture: WebGLBuffer;
    }

    /** Attributes of our shader program */
    attributes: {
        /** Location of the position attribute, which determines where vertices should go */
        position: number;
        /** Location of the texture attribute, which determines where to slice up the atlas for individual sprites */
        texture: number;
    }

    /** Uniforms used to control the shader program */
    uniforms: {
        /** Uniform that transforms clipspace to window pixel coordinates */
        positionMatrix: WebGLUniformLocation;
        /** Uniform that selects sprites from the atlas */
        textureMatrix: WebGLUniformLocation;
        /** Uniform that references the atlas texture */
        atlas: WebGLUniformLocation;
        /** Uniform that can recolor a sprite */
        blend: WebGLUniformLocation;
        /** Uniform that determines if the atlas texture should be used or not */
        textured: WebGLUniformLocation;

        // TODO: expand this list when you revise the shader
        // You'll also probably want some convenient API methods that can easily set the uniforms, too
        // Don't forget to update your tests while you expand this class!
    }

    /** Vertex array containing a unit quad (a square) */
    vao: WebGLVertexArrayObject;

    constructor(gl: WebGL2RenderingContext) {
        this.gl = gl;

        this.vertexShader = this.createShader("vertex", defaultVertexSource);
        this.fragmentShader = this.createShader("fragment", defaultFragmentSource);
        this.program = this.createShaderProgram(this.vertexShader, this.fragmentShader);
        this.gl.useProgram(this.program);

        // Create our buffers
        const squareBuffer = gl.createBuffer();
        const positionBuffer = gl.createBuffer();
        const textureBuffer = gl.createBuffer();
        if (!squareBuffer || !positionBuffer || !textureBuffer) {
            throw new ShaderError(`Failed to create WebGL buffers!`);
        }
        this.buffers = {
            square: squareBuffer,
            position: positionBuffer,
            texture: textureBuffer,
        };

        // Locate our attributes
        this.attributes = {
            position: this.gl.getAttribLocation(this.program, "a_position"),
            texture: this.gl.getAttribLocation(this.program, "a_texture"),
        };

        // Locate our uniforms
        this.uniforms = {
            positionMatrix: this.getUniform("u_position_matrix"),
            textureMatrix: this.getUniform("u_texture_matrix"),
            atlas: this.getUniform("u_atlas"),
            blend: this.getUniform("u_blend"),
            textured: this.getUniform("u_textured"),
        }

        // Set up the VAO
        const vao = this.gl.createVertexArray();
        if (!vao) {
            throw new ShaderError(`Failed to create new vertex array!`);
        }
        this.vao = vao;
        this.gl.bindVertexArray(vao);

        // Load default unit quad into buffer
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.square);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(UNIT_QUAD), this.gl.STATIC_DRAW);

        // Enable position and texture attributes for this VAO, which will always use the square when bound
        this.gl.enableVertexAttribArray(this.attributes.position);
        this.gl.vertexAttribPointer(this.attributes.position, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(this.attributes.texture);
        this.gl.vertexAttribPointer(this.attributes.texture, 2, this.gl.FLOAT, false, 0, 0);
        
        // Unbind the VAO
        gl.bindVertexArray(null);
    }

    /** Creates a new shader of the specified type and GLSL source */
    createShader(type: "vertex" | "fragment", source: string): WebGLShader {
        const shader = this.gl.createShader(type === "vertex" ? this.gl.VERTEX_SHADER : this.gl.FRAGMENT_SHADER);
        if (!shader) {
            throw new ShaderError(`Failed to create ${type} shader!`);
        }
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            const err = this.gl.getShaderInfoLog(shader);
            this.gl.deleteShader(shader);
            throw new ShaderError(`Failed to compile ${type} shader: ${err}`);
        }
        return shader;
    }

    /** Creates and returns a new shader program provided compiled vertex and fragment shaders */
    createShaderProgram(vertex: WebGLShader, fragment: WebGLShader): WebGLProgram {
        const program = this.gl.createProgram();
        if (!program) {
            throw new ShaderError(`Failed to create shader program!`);
        }
        this.gl.attachShader(program, vertex);
        this.gl.attachShader(program, fragment);
        this.gl.linkProgram(program);
        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            const err = this.gl.getProgramInfoLog(program);
            this.gl.deleteProgram(program);
            throw new ShaderError(`Failed to link shader program: ${err}`);
        }
        return program;
    }

    /** Retrieves the location of the shader uniform with the provided name */
    getUniform(name: string): WebGLUniformLocation {
        const u = this.gl.getUniformLocation(this.program, name);
        if (!u) {
            throw new ShaderError(`Failed to locate shader uniform: ${name}`);
        }
        return u;
    }

    /** Sets the vertex positions for the next GL draw call. If no argument is provided the positions default to a unit quad (a square). */
    setPositions(positions = UNIT_QUAD) {
        this.gl.enableVertexAttribArray(this.attributes.position);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.position);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.DYNAMIC_DRAW);
        this.gl.vertexAttribPointer(this.attributes.position, 2, this.gl.FLOAT, false, 0, 0);
    }

    /** Sets the UV texture positions for the next GL draw call. If no argument is provided, the UVs default to a unit quad (a square). */
    setUVs(UVs = UNIT_QUAD) {
        this.gl.enableVertexAttribArray(this.attributes.texture);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.texture);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(UVs), this.gl.DYNAMIC_DRAW);
        this.gl.vertexAttribPointer(this.attributes.texture, 2, this.gl.FLOAT, false, 0, 0);
    }

}

/** Error class that describes problems with WebGL or shaders */
export class ShaderError extends Error {}