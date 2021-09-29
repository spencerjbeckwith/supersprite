/** The access point for all properties/methods directly related to the main shader itself */
interface MainShader {
    /** The main vertex shader */
    vertex: WebGLShader;

    /** The main fragment shader */
    fragment: WebGLShader;

    /** The main shader program used by supersprite */
    program: WebGLProgram;

    /** The main vertex array object used by supersprite, recording a unit quad for non-transformed sprites */
    vao: WebGLVertexArrayObject | null;

    /** Provides access to all attributes available on the main shader. Feel free to extend this to add more. */
    attributes: MainShaderAttributes,

    /** Provides access to all uniforms available on the main shader. Feel free to extend this to add more. */
    uniforms: MainShaderUniforms,
    
    /** Provides access to all buffers used by supersprite */
    buffers: MainShaderBuffers,

    /** Creates a new shader. */
    createShader: (type: number, source: string) => WebGLShader;

    /** Sets the drawing vertex positions for the next GL draw call. If no argument, will set the positions to the default, a unit quad.*/
    setPositions: (positions?: number[]) => void;

    /** Sets the UV texture positions for the next GL draw call. If no argument, will set the positions to the default, a unit quad. */
    setUVs: (positions?: number[]) => void;
}

/** Contains all attributes */
interface MainShaderAttributes {
    position: number;
    texture: number;
}

/** Contains all uniforms */
interface MainShaderUniforms {
    positionMatrix: WebGLUniformLocation;
    textureMatrix: WebGLUniformLocation;
    atlasSampler: WebGLUniformLocation;
    blend: WebGLUniformLocation;
    useTexture: WebGLUniformLocation;
}

/** Contains all buffers */
interface MainShaderBuffers {
    square: WebGLBuffer;
    position: WebGLBuffer;
    texture: WebGLBuffer;
}

/** Use this to substitute the main shader's source. Note you must have the same number of attributes/uniforms and their names must be present. */
interface MainShaderOptions {
    source: {
        vertex: string;
        fragment: string;
    }

    /** The names of each attribute, as they appear in the shader source */
    attributes: {
        position: string;
        texture: string;
    },

    /** The names of each uniform, as they appear in the shader source */
    uniforms: {
        positionMatrix: string;
        textureMatrix: string;
        atlas: string;
        blend: string;
        useTexture: string;
    }
}

const defaultShaderOptions: MainShaderOptions = {
    source: {
vertex: `#version 300 es
in vec2 a_position;
in vec2 a_texcoord;
out vec2 v_texcoord;
uniform mat3 u_positionMatrix;
uniform mat3 u_textureMatrix;

void main() {
    gl_Position = vec4( (u_positionMatrix * vec3(a_position, 1.0) ).xy, 0, 1);
    v_texcoord = ( u_textureMatrix * vec3(a_texcoord, 1.0) ).xy;
}`,
fragment: `#version 300 es
precision mediump float;
in vec2 v_texcoord;
out vec4 outputColor;
uniform sampler2D u_atlas;
uniform vec4 u_blend;

uniform int u_useTexture;

void main() {
    if (u_useTexture == 0) {
        outputColor = u_blend;
    } else {
        outputColor = texture(u_atlas, v_texcoord) * u_blend;
    }
}`,
},
    attributes: {
        position: 'a_position',
        texture: 'a_texcoord',
    },
    uniforms: {
        positionMatrix: 'u_positionMatrix',
        textureMatrix: 'u_textureMatrix',
        atlas: 'u_atlas',
        blend: 'u_blend',
        useTexture: 'u_useTexture',
    },
}

/** Used internally to initialize the main shader */
function prepareMainShader(gl: WebGL2RenderingContext, options?: MainShaderOptions) : MainShader {
    function createShader(type: number, source: string): WebGLShader {
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
    }

    const vertexShader = createShader(gl.VERTEX_SHADER, options ? options.source.vertex : defaultShaderOptions.source.vertex);
    const fragmentShader = createShader(gl.FRAGMENT_SHADER, options ? options.source.fragment : defaultShaderOptions.source.fragment);
    const shaderProgram = gl.createProgram();
    if (!shaderProgram) {
        throw new Error(`Failed to create WebGL program!`);
    }

    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        throw new Error(`Failed to link shader program: ${gl.getProgramInfoLog(shaderProgram)}`);
    }

    const squareBuffer = gl.createBuffer();
    const positionBuffer = gl.createBuffer();
    const textureBuffer = gl.createBuffer();
    if (!squareBuffer || !positionBuffer || !textureBuffer) { throw new Error(`Failed to create required WebGL buffers!`); }

    const positionAttribute = gl.getAttribLocation(shaderProgram, options ? options.attributes.position : defaultShaderOptions.attributes.position);
    const textureAttribute = gl.getAttribLocation(shaderProgram, options ? options.attributes.texture : defaultShaderOptions.attributes.texture);

    const positionMatrixUniform = gl.getUniformLocation(shaderProgram, options ? options.uniforms.positionMatrix : defaultShaderOptions.uniforms.positionMatrix);
    if (!positionMatrixUniform) { throw new Error(`Failed to find position matrix uniform!`);}

    const textureMatrixUniform = gl.getUniformLocation(shaderProgram, options ? options.uniforms.textureMatrix : defaultShaderOptions.uniforms.textureMatrix);
    if (!textureMatrixUniform) { throw new Error(`Failed to find texture matrix uniform!`);}

    const atlasSamplerUniform = gl.getUniformLocation(shaderProgram, options ? options.uniforms.atlas : defaultShaderOptions.uniforms.atlas);
    if (!atlasSamplerUniform) { throw new Error(`Failed to find atlas sampler uniform!`);}

    const blendUniform = gl.getUniformLocation(shaderProgram, options ? options.uniforms.blend : defaultShaderOptions.uniforms.blend);
    if (!blendUniform) { throw new Error(`Failed to find blend uniform!`);}

    const useTextureUniform = gl.getUniformLocation(shaderProgram, options ? options.uniforms.useTexture : defaultShaderOptions.uniforms.useTexture);
    if (!useTextureUniform) { throw new Error(`Failed to find useTexture uniform!`);}

    gl.useProgram(shaderProgram);

    // Set up our default VAO
    const vao = gl.createVertexArray();
    if (!vao) { throw new Error(`Failed to create new vertex array!`); }
    gl.bindVertexArray(vao);

    // Load default unit quad into buffer
    const unitQuad = [0,0, 0,1, 1,1, 1,1, 1,0, 0,0];
    gl.bindBuffer(gl.ARRAY_BUFFER, squareBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(unitQuad), gl.STATIC_DRAW);

    // Enable position and texture attributes for this VAO, which will use the square buffer
    gl.enableVertexAttribArray(positionAttribute);
    gl.vertexAttribPointer(positionAttribute, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(textureAttribute);
    gl.vertexAttribPointer(textureAttribute, 2, gl.FLOAT, false, 0, 0);

    gl.bindVertexArray(null);

    return {
        vertex: vertexShader,
        fragment: fragmentShader,
        program: shaderProgram,
        vao: vao,
        buffers: {
            square: squareBuffer,
            position: positionBuffer,
            texture: textureBuffer,
        },
        attributes: {
            position: positionAttribute,
            texture: textureAttribute,
        },
        uniforms: {
            positionMatrix: positionMatrixUniform,
            textureMatrix: textureMatrixUniform,
            atlasSampler: atlasSamplerUniform,
            blend: blendUniform,
            useTexture: useTextureUniform,
        },
        createShader: createShader,
        setPositions: function(positions = unitQuad) {
            gl.enableVertexAttribArray(positionAttribute);
            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.DYNAMIC_DRAW);
            gl.vertexAttribPointer(positionAttribute, 2, gl.FLOAT, false, 0, 0);
        },
        setUVs: function(positions = unitQuad) {
            gl.enableVertexAttribArray(textureAttribute);
            gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.DYNAMIC_DRAW);
            gl.vertexAttribPointer(textureAttribute, 2, gl.FLOAT, false, 0, 0);
        },
    }
}

export {
    MainShader,
    MainShaderAttributes,
    MainShaderBuffers,
    MainShaderUniforms,
    MainShaderOptions,
    prepareMainShader,    
}