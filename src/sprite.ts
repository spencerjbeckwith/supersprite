import Shader from "./shader";
import Matrix from "./util/matrix";

const imageShaderVertex = `attribute vec2 a_position;
attribute vec2 a_texcoord;
uniform mat3 u_positionMatrix;
uniform mat3 u_texcoordMatrix;
varying vec2 v_texcoord;
void main() {
    gl_Position = vec4((u_positionMatrix*vec3(a_position,1)).xy, 0, 1);
    v_texcoord = (u_texcoordMatrix*vec3(a_texcoord, 1.0)).xy;
}`;

const imageShaderFragment = `precision mediump float;
uniform sampler2D u_image;
uniform vec4 u_blend;
varying vec2 v_texcoord;
void main() {
    gl_FragColor = texture2D(u_image, v_texcoord)*u_blend;
}`;

const primitiveShaderVertex = `attribute vec2 a_position;
uniform mat3 u_positionMatrix;
void main() {
    gl_Position = vec4((u_positionMatrix*vec3(a_position,1)).xy, 0, 1);
}`;

const primitiveShaderFragment = `precision mediump float;
uniform vec4 u_blend;
void main() {
    gl_FragColor = u_blend;
}`;

import Color from "./util/color";

interface superspriteOptions {
    displayWidth?: number;
    displayHeight?: number;
    viewWidth?: number;
    viewHeight?: number;
    antialias?: boolean;
    responsive?: 'static' | 'stretch' | 'scale';
    maintainAspectRatio?: boolean;
    scalePerfectly?: boolean;
    contextImageSmoothing?: boolean;
}

interface ShaderLibrary {
    image: Shader | null;
    primitive: Shader | null;
    [ name: string ]: Shader | null;
}

interface supersprite {
    cv1: HTMLCanvasElement;
    cv2: HTMLCanvasElement;
    atlasImage: HTMLImageElement | null;
    gl: WebGLRenderingContext | null;
    ctx: CanvasRenderingContext2D | null;
    
    projection: Matrix;
    internalTimer: number;

    gameTexture: WebGLTexture | null;
    atlasTexture: WebGLTexture | null;
    frameBuffer: WebGLFramebuffer | null;

    viewWidth: number;
    viewHeight: number;
    displayWidth: number;
    displayHeight: number;

    responsive: 'static' | 'stretch' | 'scale';
    maintainAspectRatio: boolean;
    scalePerfectly: boolean;
    contextImageSmoothing: boolean;
    background: {
        red: number;
        blue: number;
        green: number;
    };
    blend: Color | [number, number, number, number];

    currentShader: Shader | null;
    shaders: ShaderLibrary;

    initialize: (options?: superspriteOptions) => void;
    resizeCanvas: () => void;
    setProjection: (viewWidth: number, viewHeight: number, displayWidth?: number, displayHeight?: number) => void;
    beginRender: () => void;
    endRender: () => void;
    loadTexture: (url: string) => Promise<AtlasTextureObject>;
    setAtlas: (atlasObject: AtlasTextureObject) => void;
}

const gameTexturePositionMatrix = [2,0,0, 0,-2,0, -1,1,1];
const gameTextureIdentityMatrix = [1,0,0, 0,-1,0, 0,1,1];
const spritePositions = new Float32Array([0,0, 0,1, 1,1, 1,1, 1,0, 0,0]);

const supersprite : supersprite = {
    cv1: document.createElement('canvas'),
    cv2: document.createElement('canvas'),
    atlasImage: null,
    gl: null,
    ctx: null,

    projection: Matrix.projection(400,240),
    internalTimer: 0,

    gameTexture: null,
    atlasTexture: null,
    frameBuffer: null,

    viewWidth: 400,
    viewHeight: 240,
    displayWidth: 400,
    displayHeight: 240,

    responsive: 'scale',
    maintainAspectRatio: true,
    scalePerfectly: true,
    contextImageSmoothing: false,
    background: {
        red: 0,
        blue: 0,
        green: 0,
    },
    blend: [1,1,1,1],

    currentShader: null,
    shaders: {
        image: null,
        primitive: null,
    },

    initialize: function(options?: superspriteOptions) {
        document.body.appendChild(this.cv1);
        document.body.appendChild(this.cv2);
        
        this.cv1.width = options?.displayWidth || options?.viewWidth || window.innerWidth;
        this.cv1.height = options?.displayHeight || options?.viewHeight || window.innerHeight;
        this.cv2.width = this.cv1.width;
        this.cv2.height = this.cv1.height;
        this.cv1.setAttribute('style','position: absolute; left: 50%; top: 50%; transform: translate(-50%,-50%); overflow: hidden;');
        this.cv2.setAttribute('style','position: absolute; left: 50%; top: 50%; transform: translate(-50%,-50%); overflow: hidden;');

        this.gl = this.cv1.getContext('webgl',{
            antialias: options?.antialias || false,
        });

        if (!this.gl) {
            throw new Error('Failed to initialize WebGL context!');
        }
        const gl = this.gl; // To save keystrokes for the rest of this function

        this.ctx = this.cv2.getContext('2d');

        if (!this.ctx) {
            throw new Error('Failed to initialize 2D canvas context!');
        }

        // Set our options
        if (options?.responsive) { this.responsive = options.responsive; }
        if (options?.maintainAspectRatio) { this.maintainAspectRatio = options.maintainAspectRatio; }
        if (options?.scalePerfectly) { this.scalePerfectly = options.scalePerfectly; }
        if (options?.contextImageSmoothing) { this.contextImageSmoothing = options.contextImageSmoothing; }

        // Prepare default shaders with their attributes, uniforms, etc.
        this.shaders.image = new Shader(this,imageShaderVertex,imageShaderFragment,function(this: Shader) {
            // IMAGE USE FUNCTION
            gl.bindBuffer(gl.ARRAY_BUFFER,this.positionBuffer);
            gl.bufferData(gl.ARRAY_BUFFER,spritePositions,gl.STATIC_DRAW);
            gl.vertexAttribPointer(this.attributes.position,2,gl.FLOAT,false,0,0);
        });
        this.shaders.image.attributes.position = gl.getAttribLocation(this.shaders.image.program,'a_position');
        this.shaders.image.attributes.texture = gl.getAttribLocation(this.shaders.image.program,'a_texcoord');
        let tempUniform : WebGLUniformLocation | null = gl.getUniformLocation(this.shaders.image.program,'u_positionMatrix');
        if (tempUniform) { this.shaders.image.uniforms.positionMatrix = tempUniform; }
        tempUniform = gl.getUniformLocation(this.shaders.image.program,'u_texcoordMatrix');
        if (tempUniform) { this.shaders.image.uniforms.textureMatrix = tempUniform; }
        tempUniform = gl.getUniformLocation(this.shaders.image.program,'u_blend');
        if (tempUniform) { this.shaders.image.uniforms.blend = tempUniform; }
        tempUniform = gl.getUniformLocation(this.shaders.image.program,'u_image');
        if (tempUniform) { this.shaders.image.uniforms.image = tempUniform; }

        // We put the same position order into both position and texture, to begin
        gl.bindBuffer(gl.ARRAY_BUFFER,this.shaders.image.positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([0,0, 0,1, 1,1, 1,1, 1,0, 0,0]),gl.STATIC_DRAW);

        gl.enableVertexAttribArray(this.shaders.image.attributes.position);
        gl.vertexAttribPointer(this.shaders.image.attributes.position,2,gl.FLOAT,false,0,0);

        gl.enableVertexAttribArray(this.shaders.image.attributes.texture);
        gl.vertexAttribPointer(this.shaders.image.attributes.texture,2,gl.FLOAT,false,0,0);

        // Now do the same for the primitive shader - except for the texture options
        this.shaders.primitive = new Shader(this,primitiveShaderVertex,primitiveShaderFragment,function(this: Shader, positions: Float32Array) {
            // PRIMITIVE USE FUNCTION
            if (positions) {
                gl.bindBuffer(gl.ARRAY_BUFFER,this.positionBuffer);
                gl.bufferData(gl.ARRAY_BUFFER,positions,gl.STATIC_DRAW);
                gl.vertexAttribPointer(this.attributes.position,2,gl.FLOAT,false,0,0);
            }
        });
        this.shaders.primitive.attributes.position = gl.getAttribLocation(this.shaders.primitive.program,'a_position');
        tempUniform = gl.getUniformLocation(this.shaders.primitive.program,'u_positionMatrix');
        if (tempUniform) { this.shaders.primitive.uniforms.positionMatrix = tempUniform; }
        tempUniform = gl.getUniformLocation(this.shaders.primitive.program,'u_blend');
        if (tempUniform) { this.shaders.primitive.uniforms.blend = tempUniform; }

        gl.bindBuffer(gl.ARRAY_BUFFER,this.shaders.primitive.positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([0,0, 0.5,0.5]),gl.DYNAMIC_DRAW);

        gl.enableVertexAttribArray(this.shaders.primitive.attributes.position);
        gl.vertexAttribPointer(this.shaders.primitive.attributes.position,2,gl.FLOAT,false,0,0);

        // Setup GL
        this.ctx.imageSmoothingEnabled = this.contextImageSmoothing;
        gl.clearColor(0,0,0,1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.disable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);

        // Setup game texture
        this.gameTexture = gl.createTexture();
        this.setProjection(this.viewWidth,this.viewHeight,this.displayWidth,this.displayHeight); // This also binds the texture
        gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);

        // Setup framebuffer
        this.frameBuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER,this.frameBuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,this.gameTexture,0);

        // Prepare the canvas (this must come after setting up gameTexture)
        window.addEventListener('resize',this.resizeCanvas.bind(this));
        window.addEventListener('orientation',this.resizeCanvas.bind(this));
        this.resizeCanvas();
    },

    resizeCanvas: function() {
        switch (this.responsive) {
            case ('stretch'): {
                if (this.maintainAspectRatio) {
                    const ratio = this.viewWidth / this.viewHeight;
                    let newWidth = this.viewWidth, newHeight = this.viewHeight;

                    if (window.innerWidth > window.innerHeight) {
                        newWidth = newHeight * ratio;
                        newHeight = window.innerHeight;
                    } else {
                        newWidth = window.innerWidth;
                        newHeight = newWidth / ratio;
                    }

                    this.setProjection(newWidth,newHeight);
                } else {
                    this.setProjection(window.innerWidth,window.innerHeight);
                }
                
                break;
            }

            case ('scale'): {
                if (this.maintainAspectRatio) {
                    let scale = 1;
                    if (window.innerWidth > window.innerHeight) {
                        scale = window.innerHeight / this.viewHeight;
                    } else {
                        scale = window.innerWidth / this.viewWidth;
                    }

                    scale = Math.max(scale,1);
                    if (this.scalePerfectly) {
                        scale = Math.floor(scale);
                    }

                    this.setProjection(this.viewWidth,this.viewHeight,this.viewWidth * scale, this.viewHeight * scale);
                } else {
                    this.setProjection(this.viewWidth,this.viewHeight,window.innerWidth,window.innerHeight);
                }

                break;
            }

            // Do nothing on static
            default: { break; }
        }
    },

    setProjection: function(viewWidth: number, viewHeight: number, displayWidth?: number, displayHeight?: number) {
        // Call anytime the view or display changes size
        
        const gl = this.gl;
        const ctx = this.ctx;
        if (!gl || !ctx) {
            throw new Error('WebGL and context not initialized!');
        }

        this.viewWidth = viewWidth;
        this.viewHeight = viewHeight;
        this.displayWidth = displayWidth || viewWidth;
        this.displayHeight = displayHeight || viewHeight;
        this.projection = Matrix.projection(this.viewWidth,this.viewHeight);

        // Load projection into primitive shader
        if (this.shaders.primitive) {
            this.shaders.primitive.use();
            gl.uniformMatrix3fv(this.shaders.primitive.uniforms.positionMatrix,false,this.projection.values);
        }

        // Resize canvases
        this.cv1.width = displayWidth || viewWidth;
        this.cv1.height = displayHeight || viewHeight;
        this.cv2.width = this.cv1.width;
        this.cv2.height = this.cv1.height;

        // Resize game texture
        gl.bindTexture(gl.TEXTURE_2D,this.gameTexture);
        gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,this.viewWidth,this.viewHeight,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
       
        // Fix content
        ctx.imageSmoothingEnabled = this.contextImageSmoothing;
        ctx.setTransform(1,0,0,1,0,0);
        ctx.scale(this.displayWidth/this.viewWidth, this.displayHeight/this.viewHeight);
    },

    beginRender: function() {
        // Call at the start of each frame

        const gl = this.gl;
        const ctx = this.ctx;
        if (!gl || !ctx) {
            throw new Error('WebGL and context not initialized!');
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER,this.frameBuffer);
        gl.viewport(0,0,this.viewWidth,this.viewHeight);
        gl.clearColor(this.background.red,this.background.green,this.background.blue,1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        ctx.clearRect(0,0,this.viewWidth,this.viewHeight);

        if (this.atlasTexture) { gl.bindTexture(gl.TEXTURE_2D,this.atlasTexture); }
        if (this.shaders.image) {
            this.shaders.image.use();
            gl.uniform4f(this.shaders.image.uniforms.blend,1,1,1,1); 
        }

        this.internalTimer++;
        if (this.internalTimer > 4096) { this.internalTimer = 0; }
    },

    endRender: function(eject = false) {
        // Call at the end of each frame

        // Switch to correct framebuffer and texture
        const gl = this.gl;
        const ctx = this.ctx;
        if (!gl || !ctx) {
            throw new Error('WebGL and context not initialized!');
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER,null);
        gl.viewport(0,0,this.displayWidth,this.displayHeight);
        gl.clearColor(0,0,0,1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.bindTexture(gl.TEXTURE_2D,this.gameTexture);

        if (!eject && this.shaders.image) {
            this.shaders.image.use();

            gl.bindBuffer(gl.ARRAY_BUFFER,this.shaders.image.positionBuffer);
            gl.enableVertexAttribArray(this.shaders.image.attributes.position);
            gl.vertexAttribPointer(this.shaders.image.attributes.position,2,gl.FLOAT,false,0,0);

            // Set image uniforms
            gl.uniformMatrix3fv(this.shaders.image.uniforms.positionMatrix,false,gameTexturePositionMatrix);
            if (this.shaders.image.uniforms.textureMatrix) {
                gl.uniformMatrix3fv(this.shaders.image.uniforms.textureMatrix,false,gameTextureIdentityMatrix);
            }
            if (this.blend instanceof Color) {
                gl.uniform4fv(this.shaders.image.uniforms.blend,[this.blend.red,this.blend.green,this.blend.blue,this.blend.alpha || 1]);
            } else {
                gl.uniform4fv(this.shaders.image.uniforms.blend,this.blend);
            }

            gl.drawArrays(gl.TRIANGLES,0,6);
        }
    },

    loadTexture: function(url: string): Promise<AtlasTextureObject> {
        const gl = this.gl;
        if (!gl) {
            throw new Error('WebGL and context not initialized!');
        }
        return new Promise((resolve, reject) => {
            const tex = gl.createTexture();
            if (!tex) {
                throw new Error(`Failed to create atlas WebGLTexture!`);
            }
            gl.bindTexture(gl.TEXTURE_2D,tex);
            gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    
            const image = new Image();
            image.src = url;
            image.addEventListener('load',() => {
                gl.bindTexture(gl.TEXTURE_2D,tex);
                gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);
                resolve({
                    image: image,
                    texture: tex,
                });
            });
            image.addEventListener('error',reject);
            image.addEventListener('abort',reject);
        });
    },

    setAtlas: function(atlasObject: AtlasTextureObject) {
        this.atlasTexture = atlasObject.texture;
        this.atlasImage = atlasObject.image;
    },
}

export default supersprite;