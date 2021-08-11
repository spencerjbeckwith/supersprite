import Color from "./util/color.js";
import Matrix from "./util/matrix.js";
/** A class for shader programs used by supersprite, which contains a lot of static properties and methods to control supersprite's drawing behavior. */
class Shader {
    /** Creates a new Shader instance with a new shader program. */
    constructor(opt) {
        const gl = Shader.gl;
        const vertexShader = Shader.createShader(gl.VERTEX_SHADER, opt.vertexSource);
        const fragmentShader = Shader.createShader(gl.FRAGMENT_SHADER, opt.fragmentSource);
        const program = gl.createProgram();
        if (!program) {
            throw new ShaderError('Failed to create program!');
        }
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            const err = gl.getProgramInfoLog(program);
            gl.deleteProgram(program);
            throw new ShaderError(`Failed to link shader program: ${err}`);
        }
        // Link success, now get attributes and uniforms
        this.program = program;
        let tempAttribute = gl.getAttribLocation(program, opt.names.positionAttribute);
        if (tempAttribute === -1) {
            throw new ShaderError(`Position attribute "${opt.names.positionAttribute}" not found in shader program.`);
        }
        this.positionAttribute = tempAttribute;
        let tempUniform = gl.getUniformLocation(program, opt.names.positionUniform);
        if (!tempUniform) {
            throw new ShaderError(`Position matrix uniform "${opt.names.positionUniform}" not found in shader program.`);
        }
        this.positionMatrix = tempUniform;
        tempUniform = gl.getUniformLocation(program, opt.names.blendUniform);
        if (!tempUniform) {
            throw new ShaderError(`Blend uniform "${opt.names.blendUniform}" not found in shader program.`);
        }
        this.blendUniform = tempUniform;
        // Only set up texture stuff for image shaders
        if (opt.useTexture) {
            tempAttribute = gl.getAttribLocation(program, opt.names.textureAttribute || '');
            if (tempAttribute === -1) {
                throw new ShaderError(`Texture attribute "${opt.names.textureAttribute}" not found in shader program.`);
            }
            this.textureAttribute = tempAttribute;
            tempUniform = gl.getUniformLocation(program, opt.names.textureUniform || '');
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
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        if (opt.useTexture) {
            gl.bufferData(gl.ARRAY_BUFFER, Shader.positionOrder, gl.STATIC_DRAW);
        }
        else {
            gl.bufferData(gl.ARRAY_BUFFER, Shader.triangleOrder, gl.DYNAMIC_DRAW);
        }
        gl.enableVertexAttribArray(this.positionAttribute);
        gl.vertexAttribPointer(this.positionAttribute, 2, gl.FLOAT, false, 0, 0);
        if (this.textureAttribute) {
            gl.enableVertexAttribArray(this.textureAttribute);
            gl.vertexAttribPointer(this.textureAttribute, 2, gl.FLOAT, false, 0, 0);
        }
    }
    /** Sets this current Shader instance as the current program to use when drawing. */
    use(positions = Shader.positionOrder) {
        // Set our position attribute to whatever is provided (primitives) or default positions (images)
        const gl = Shader.gl;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
        gl.vertexAttribPointer(this.positionAttribute, 2, gl.FLOAT, false, 0, 0);
        // Update used program
        if (Shader.currentProgram !== this) {
            Shader.currentProgram = this;
            gl.useProgram(this.program);
        }
    }
}
Shader.createShader = function (type, source) {
    // Don't call - this is called by the Shader constructor when you init
    const gl = Shader.gl;
    const shader = gl.createShader(type);
    if (!shader) {
        throw new ShaderError(`Failed to create shader!`);
    }
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const err = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new ShaderError(`Failed to compile shader: ${err}`);
    }
    // Success!
    return shader;
};
Shader.init = function (gl, ctx, viewWidth, viewHeight, displayWidth, displayHeight, imageOptions, primitiveOptions, positionOrder = new Float32Array([0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0,]), triangleOrder = new Float32Array([0, 0, 0.5, 0.5])) {
    // Call before your animation loop begins
    this.positionOrder = positionOrder;
    this.triangleOrder = triangleOrder;
    this.currentProgram = null;
    this.internalTimer = 0;
    this.gl = gl;
    this.ctx = ctx;
    this.imageShader = new Shader(imageOptions || {
        // Default image shader
        vertexSource: 'attribute vec2 a_position;\n' +
            'attribute vec2 a_texcoord;\n' +
            'uniform mat3 u_positionMatrix;\n' +
            'uniform mat3 u_texcoordMatrix;\n' +
            'varying vec2 v_texcoord;\n' +
            'void main() {\n' +
            '    gl_Position = vec4((u_positionMatrix*vec3(a_position,1)).xy,0,1);\n' +
            '    v_texcoord = (u_texcoordMatrix*vec3(a_texcoord,1.0)).xy;\n' +
            '}',
        fragmentSource: 'precision mediump float;\n' +
            'uniform sampler2D u_image;\n' +
            'uniform vec4 u_blend;\n' +
            'varying vec2 v_texcoord;\n' +
            'void main() {\n' +
            '    gl_FragColor = texture2D(u_image,v_texcoord)*u_blend;\n' +
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
        vertexSource: 'attribute vec2 a_position;\n' +
            'uniform mat3 u_positionMatrix;\n' +
            'void main() {\n' +
            '    gl_Position = vec4((u_positionMatrix*vec3(a_position,1)).xy,0,1);\n' +
            '}',
        fragmentSource: 'precision mediump float;\n' +
            'uniform vec4 u_blend;\n' +
            'void main() {\n' +
            '    gl_FragColor = u_blend;\n' +
            '}',
        useTexture: false,
        names: {
            positionAttribute: 'a_position',
            positionUniform: 'u_positionMatrix',
            blendUniform: 'u_blend',
            textureAttribute: 'a_texcoord',
        }
    });
    // Init gl
    ctx.imageSmoothingEnabled = this.contextImageSmoothing || false;
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    // Set up game texture
    const tex = gl.createTexture();
    if (!tex) {
        throw new ShaderError(`Failed to create rendering target WebGLTexture!`);
    }
    this.gameTexture = tex;
    this.setProjection(viewWidth, viewHeight, displayWidth, displayHeight); // also binds game texture
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    this.gameTexturePositionMatrix = [2, 0, 0, 0, -2, 0, -1, 1, 1];
    this.gameTextureIdentityMatrix = [1, 0, 0, 0, -1, 0, 0, 1, 1];
    this.gameTextureBlend = new Color(1, 1, 1);
    const fb = gl.createFramebuffer();
    if (!fb) {
        throw new ShaderError(`Failed to create FrameBuffer!`);
    }
    this.frameBuffer = fb;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.gameTexture, 0);
};
Shader.beginRender = function () {
    // Call at the start of each frame
    const gl = this.gl;
    const ctx = this.ctx;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer);
    gl.viewport(0, 0, this.viewWidth, this.viewHeight);
    gl.clearColor(this.backgroundColor.red, this.backgroundColor.green, this.backgroundColor.blue, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    ctx.clearRect(0, 0, this.viewWidth, this.viewHeight);
    ctx.save();
    gl.bindTexture(gl.TEXTURE_2D, this.atlasTexture);
    this.imageShader.use();
    gl.uniform4f(this.imageShader.blendUniform, 1, 1, 1, 1);
    this.internalTimer++;
    if (this.internalTimer > 4096) {
        this.internalTimer = 0;
    }
};
Shader.render = function () {
    // Call at the end of each frame
    // Switch to right framebuffer and texture
    const gl = this.gl;
    const ctx = this.ctx;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.displayWidth, this.displayHeight);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindTexture(gl.TEXTURE_2D, this.gameTexture);
    // the view width/height is the game surface
    // the display width/height is the canvas
    // the view will be stretched to fill the display. If they arent the same size, the view will be stretched to fit.
    // Update bound buffer to correct type
    this.imageShader.use();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.imageShader.buffer);
    gl.enableVertexAttribArray(this.imageShader.positionAttribute);
    gl.vertexAttribPointer(this.imageShader.positionAttribute, 2, gl.FLOAT, false, 0, 0);
    // Update uniforms w/ precalculated display matrices, and finally draw
    gl.uniformMatrix3fv(this.imageShader.positionMatrix, false, this.gameTexturePositionMatrix);
    if (this.imageShader.textureMatrix) {
        gl.uniformMatrix3fv(this.imageShader.textureMatrix, false, this.gameTextureIdentityMatrix);
    }
    let cols = [];
    if (this.gameTextureBlend instanceof Color) {
        cols = [this.gameTextureBlend.red, this.gameTextureBlend.green, this.gameTextureBlend.blue, this.gameTextureBlend.alpha];
    }
    else {
        cols = this.gameTextureBlend;
    }
    gl.uniform4fv(this.imageShader.blendUniform, cols);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    ctx.restore();
};
Shader.loadAtlasTexture = function (url) {
    const gl = this.gl;
    return new Promise((resolve, reject) => {
        const tex = gl.createTexture();
        if (!tex) {
            throw new ShaderError(`Failed to create atlas WebGLTexture!`);
        }
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        const image = new Image();
        image.src = url;
        image.addEventListener('load', () => {
            Shader.atlasImage = image;
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            resolve(tex);
        });
        image.addEventListener('error', reject);
        image.addEventListener('abort', reject);
    });
};
Shader.setProjection = function (viewWidth, viewHeight, displayWidth, displayHeight) {
    const gl = this.gl;
    this.viewWidth = viewWidth;
    this.viewHeight = viewHeight;
    this.displayWidth = displayWidth || viewWidth;
    this.displayHeight = displayHeight || viewHeight;
    this.projection = Matrix.projection(this.viewWidth, this.viewHeight);
    // Initialize primitive shader w/ new position uniforms.
    this.primitiveShader.use();
    gl.uniformMatrix3fv(this.primitiveShader.positionMatrix, false, this.projection.values);
    // Resize canvases
    this.cv1.width = displayWidth || viewWidth;
    this.cv1.height = displayHeight || viewHeight;
    this.cv2.width = this.cv1.width;
    this.cv2.height = this.cv1.height;
    // Resize texture
    gl.bindTexture(gl.TEXTURE_2D, this.gameTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.viewWidth, this.viewHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    // Fix context
    this.ctx.imageSmoothingEnabled = this.contextImageSmoothing;
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(this.displayWidth / this.viewWidth, this.displayHeight / this.viewHeight);
};
Shader.setBackgroundColor = function (red, green, blue) {
    this.backgroundColor = {
        red: red,
        green: green,
        blue: blue,
    };
};
class ShaderError extends Error {
    constructor(message) {
        super(message);
    }
}
export default Shader;
