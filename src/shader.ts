import Matrix from "./util/matrix";

interface ShaderOptions {
    vertexSource: string;
    fragmentSource: string;
    useTexture: boolean;
    names: {
        positionAttribute: string,
        positionUniform: string,
        blendUniform: string,
        textureAttribute?: string,
        textureUniform?: string,
    }
}

class Shader {
    program: WebGLProgram;
    positionAttribute: number;
    positionMatrix: WebGLUniformLocation;
    blendUniform: WebGLUniformLocation;
    textureAttribute?: number;
    textureMatrix?: WebGLUniformLocation;
    buffer: WebGLBuffer;

    static gl: WebGLRenderingContext;
    static currentProgram: WebGLProgram;

    /** Determines the order of vertices drawn when drawing image squares. */
    static positionOrder: Float32Array;
    /** Determines the order of vertices drawn when drawing primitives. */
    static triangleOrder: Float32Array;

    static imageShader: Shader;
    static primitiveShader: Shader;
    static projection: Matrix;
    static createShader: (type: number, source: string) => WebGLShader;

    /** Must be called before any drawing can take place. */
    static init: (gl: WebGLRenderingContext, viewWidth: number, viewHeight: number, 
        imageOptions?: ShaderOptions, primitiveOptions?: ShaderOptions, 
        positionOrder?: Float32Array, triangleOrder?: Float32Array) => void;

    /** Must be called every time the view changes size. */
    static setProjection: (viewWidth: number, viewHeight: number) => void;

    constructor(opt: ShaderOptions) {
        const gl = Shader.gl;
        const vertexShader = Shader.createShader(gl.VERTEX_SHADER,opt.vertexSource);
        const fragmentShader = Shader.createShader(gl.FRAGMENT_SHADER,opt.fragmentSource);

        const program = gl.createProgram();
        if (!program) {
            throw new ShaderError('Failed to create program!');
        }

        gl.attachShader(program,vertexShader);
        gl.attachShader(program,fragmentShader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program,gl.LINK_STATUS)) {
            const err = gl.getProgramInfoLog(program);
            gl.deleteProgram(program);
            throw new ShaderError(`Failed to link shader program: ${err}`);
        }

        // Link success, now get attributes and uniforms
        this.program = program;

        let tempAttribute : number = gl.getAttribLocation(program,opt.names.positionAttribute);
        if (tempAttribute === -1) {
            throw new ShaderError(`Position attribute "${opt.names.positionAttribute}" not found in shader program.`);
        }
        this.positionAttribute = tempAttribute;

        let tempUniform : WebGLUniformLocation | null = gl.getUniformLocation(program,opt.names.positionUniform);
        if (!tempUniform) {
            throw new ShaderError(`Position matrix uniform "${opt.names.positionUniform}" not found in shader program.`);
        }
        this.positionMatrix = tempUniform;

        tempUniform = gl.getUniformLocation(program,opt.names.blendUniform);
        if (!tempUniform) {
            throw new ShaderError(`Blend uniform "${opt.names.blendUniform}" not found in shader program.`);
        }
        this.blendUniform = tempUniform;

        // Only set up texture stuff for image shaders
        if (opt.useTexture) {
            tempAttribute = gl.getAttribLocation(program,opt.names.textureAttribute || '');
            if (tempAttribute === -1) {
                throw new ShaderError(`Texture attribute "${opt.names.textureAttribute}" not found in shader program.`);
            }
            this.textureAttribute = tempAttribute;

            tempUniform = gl.getUniformLocation(program,opt.names.textureUniform || '');
            if (!tempUniform) {
                throw new ShaderError(`Texture matrix uniform "${opt.names.textureUniform}" not found in shader program.`);
            }
            this.textureMatrix = tempUniform;
        }

        // Found all our attributes/uniforms, now put data into each attribute
        const buffer = gl.createBuffer();
        if (!buffer) {
            throw new ShaderError(`Failed to create buffer.`);
        }
        this.buffer = buffer;

        gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer);
        if (opt.useTexture) {
            gl.bufferData(gl.ARRAY_BUFFER,Shader.positionOrder,gl.STATIC_DRAW);
        } else {
            gl.bufferData(gl.ARRAY_BUFFER,Shader.triangleOrder,gl.DYNAMIC_DRAW);
        }
        gl.enableVertexAttribArray(this.positionAttribute);
        gl.vertexAttribPointer(this.positionAttribute,2,gl.FLOAT,false,0,0);

        if (this.textureAttribute) {
            gl.enableVertexAttribArray(this.textureAttribute);
            gl.vertexAttribPointer(this.textureAttribute,2,gl.FLOAT,false,0,0);
        }
    }

    use(positions = Shader.positionOrder) {
        // Set our position attribute to whatever is provided (primitives) or default positions (images)
        const gl = Shader.gl;
        gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER,positions,gl.STATIC_DRAW);
        gl.vertexAttribPointer(this.positionAttribute,2,gl.FLOAT,false,0,0);

        // Update used program
        if (Shader.currentProgram !== this) {
            Shader.currentProgram = this;
            gl.useProgram(this.program);
        }
    }
}

Shader.createShader = function(type: number, source: string): WebGLShader {
    const gl = Shader.gl;
    const shader = gl.createShader(type);
    if (!shader) {
        throw new ShaderError(`Failed to create shader!`);
    }
    gl.shaderSource(shader,source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader,gl.COMPILE_STATUS)) {
        const err = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new ShaderError(`Failed to compile shader: ${err}`);
    }

    // Success!
    return shader;
}

Shader.init = function(gl: WebGLRenderingContext, viewWidth: number, viewHeight: number,
        imageOptions?: ShaderOptions, primitiveOptions?: ShaderOptions, 
        positionOrder = new Float32Array([0,0,0,1,1,1,1,1,1,0,0,0,]),
        triangleOrder = new Float32Array([0,0,0.5,0.5])) {
    this.positionOrder = positionOrder;
    this.triangleOrder = triangleOrder;
    this.gl = gl;
    this.imageShader = new Shader(imageOptions || {
        // Default image shader
        vertexSource:
            'attribute vec2 a_position;\n'+
            'attribute vec2 a_texcoord;\n'+
            'uniform mat3 u_positionMatrix;\n'+
            'uniform mat3 u_texcoordMatrix;\n'+
            'varying vec2 v_texcoord;\n'+
            'void main() {\n'+
            '    gl_Position = vec4((u_positionMatrix*vec3(a_position,1)).xy,0,1);\n'+
            '    v_texcoord = (u_texcoordMatrix*vec3(a_texcoord,1.0)).xy;\n'+
            '}',
        fragmentSource:
            'precision mediump float;\n'+
            'uniform sampler2D u_image;\n'+
            'uniform vec4 u_blend;\n'+
            'varying vec2 v_texcoord;\n'+
            'void main() {\n'+
            '    gl_FragColor = texture2D(u_image,v_texcoord)*u_blend;\n'+
            '}',
        useTexture: true,
        names: {
            positionAttribute: 'a_position',
            positionUniform: 'u_positionMatrix',
            blendUniform: 'u_blend',
            textureAttribute: 'a_texcoord',
            textureUniform: 'u_texcoordMatrix',
        }
    });
    this.primitiveShader = new Shader(primitiveOptions || {
        // Default primitive shader
        vertexSource:
            'attribute vec2 a_position;\n'+
            'uniform mat3 u_positionMatrix;\n'+
            'void main() {\n'+
            '    gl_Position = vec4((u_positionMatrix*vec3(a_position,1)).xy,0,1);\n'+
            '}',
        fragmentSource:
            'precision mediump float;\n'+
            'uniform vec4 u_blend;\n'+
            'void main() {\n'+
            '    gl_FragColor = u_blend;\n'+
            '}',
        useTexture: false,
        names: {
            positionAttribute: 'a_position',
            positionUniform: 'u_positionMatrix',
            blendUniform: 'u_blend',
            textureAttribute: 'a_texcoord',
        }
    });

    this.setProjection(viewWidth,viewHeight);
}

Shader.setProjection = function(viewWidth: number, viewHeight: number) {
    this.projection = Matrix.projection(viewWidth, viewHeight);

    // Initialize primitive shader w/ new position uniforms.
    this.primitiveShader.use();
    const p = this.projection.values;
    this.gl.uniformMatrix3fv(this.primitiveShader.positionMatrix,false,[ 
        p[0], p[1], p[2],
        p[3], p[4], p[5],
        p[6], p[7], p[8]
    ]);
}

class ShaderError extends Error {
    constructor(message?: string) {
        super(message);
    }
}

export default Shader;