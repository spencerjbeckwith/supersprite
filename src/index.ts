import Color from './util/color.js';
import Matrix from './util/matrix.js';
import Shader from './shader.js';
import draw from './draw.js';

interface superspriteOptions {
    /** Your animation frame function. Be sure to call requestAnimationFrame at the end. This will be invoked by supersprite automatically once the atlas texture has loaded. */
    mainLoop: () => void;

    /** A URL to the atlas texture output by supersprite. Note that in order to test locally, you must host a local webserver to serve this resource. */
    atlasURL?: string,

    /** Determines supersprite's behavior according to the window size. 'static' maintains a constant view and display size, 'stretch' matches the view and display size to the window, and 'scale' keeps the view size constant while stretching the display to the window size. */
    responsive?: 'static' | 'stretch' | 'scale';

    /** If true, supersprite will leave bars on screen to ensure no canvas contents are distorted. */
    maintainAspectRatio?: boolean;
    /** If true and 'responsive' is set to 'scale', only whole numbers will be scaled to. Ideal for pixel-perfect situations. */
    scalePerfectly?: boolean;

    /** Determines what color will appear behind all drawing. */
    backgroundColor?: {
        red: number,
        green: number,
        blue: number,
    },

    /** Controls GL's antialiasing. Should be false for pixel-art games, true otherwise. Defaults to false. */
    glAntialias?: boolean,

    /** Controls the 2D context's antialiasing. Should be false for pixel-art games, true otherwise. Defaults to false. */
    contextImageSmoothing?: boolean,

    /** The initial width of the view. May change if the responsive option is set to 'stretch'. */
    viewWidth?: number,
    /** The initial height of the view. May change if the responsive option is set to 'stretch'. */
    viewHeight?: number,
    /** The initial width of the canvas. May change if the responsive option is not set to 'static'. */
    displayWidth?: number,
    /** The initial height of the canvas. May change if the responsive option is not set to 'static'.*/
    displayHeight?: number,

    /** Options to override the default image shader with your own. */
    imageShader?: ShaderOptions;
    /** Options to override the default primitive shader with your own. */
    primitiveShader?: ShaderOptions;
    /** An optional override to the default arrangement of vertex positions when drawing an image. */
    positionOrder?: Float32Array;
    /** An optional override to the default arrangement of triangle positions when drawing primitives. */
    triangleOrder?: Float32Array;
}

/** Initialize supersprite by creating the canvases, setting up the GL and 2D contexts, and loading the atlas texture. */
function initialize(options: superspriteOptions) {
    // Create and style our canvases
    const cv1 = document.createElement('canvas');
    const cv2 = document.createElement('canvas');
    document.body.appendChild(cv1);
    document.body.appendChild(cv2);
    cv1.width = options.displayWidth || options.viewWidth || window.innerWidth;
    cv1.height = options.displayHeight || options.viewHeight || window.innerHeight;
    cv2.width = cv1.width;
    cv2.height = cv1.height;
    cv1.setAttribute('style','position: absolute; left: 50%; top: 50%; transform: translate(-50%,-50%); overflow: hidden;');
    cv2.setAttribute('style','position: absolute; left: 50%; top: 50%; transform: translate(-50%,-50%); overflow: hidden;');

    // Get our contexts
    const gl = cv1.getContext('webgl',{
        antialias: options.glAntialias || false,
    });
    if (!gl) {
        throw new Error('Failed to initialize WebGL context!');
    }

    const ctx = cv2.getContext('2d');
    if (!ctx) {
        throw new Error('Failed to initialize 2D canvas context!');
    }

    // Initialize Shader:
    // Draw options
    Shader.cv1 = cv1;
    Shader.cv2 = cv2;
    if (options.backgroundColor) {
        Shader.setBackgroundColor(options.backgroundColor.red,options.backgroundColor.green,options.backgroundColor.blue);
    } else {
        Shader.setBackgroundColor(0,0,0);
    }

    Shader.responsive = options.responsive || 'static';
    Shader.maintainAspectRatio = options.maintainAspectRatio;
    Shader.scalePerfectly = options.scalePerfectly;
    Shader.contextImageSmoothing = options.contextImageSmoothing || false;

    // GL
    Shader.init(gl, ctx, options.viewWidth || window.innerWidth, options.viewHeight || window.innerHeight, options.displayWidth, options.displayHeight,options.imageShader,options.primitiveShader,options.positionOrder,options.triangleOrder);
    window.addEventListener('resize',resizeCanvas);
    window.addEventListener('orientationchange',resizeCanvas);
    resizeCanvas();

    if (options.atlasURL) {
        // Texture
        Shader.loadAtlasTexture(options.atlasURL).then((tex) => {
            Shader.atlasTexture = tex;
            options.mainLoop();
        }).catch((err) => {
            console.error('Failed to load atlas texture!');
            console.error(err);
        });
    } else {
        // No textures
        options.mainLoop();
    }
}

/** Refreshes the size of the canvas according to the current size of the window and supersprite's responsive, maintainAspectRatio, and scalePerfectly options. */
function resizeCanvas() {
    switch (Shader.responsive) {
        case ('stretch'): {
            if (Shader.maintainAspectRatio) {
                const ratio = Shader.viewWidth/Shader.viewHeight;
                let newWidth = Shader.viewWidth, newHeight = Shader.viewHeight;

                if (window.innerWidth > window.innerHeight) {
                    newHeight = window.innerHeight;
                    newWidth = newHeight*ratio;
                } else {
                    newWidth = window.innerWidth;
                    newHeight = newWidth/ratio;
                }

                Shader.setProjection(newWidth,newHeight);
            } else {
                Shader.setProjection(window.innerWidth,window.innerHeight);
            }
            break;
        }
        case ('scale'): {
            if (Shader.maintainAspectRatio) {
                let scale = 1;
                if (window.innerHeight > window.innerWidth) {
                    scale = window.innerWidth/Shader.viewWidth;
                } else {
                    scale = window.innerHeight/Shader.viewHeight;
                }

                scale = Math.max(scale,1);
                if (Shader.scalePerfectly) {
                    scale = Math.floor(scale);
                }

                Shader.setProjection(Shader.viewWidth,Shader.viewHeight,Shader.viewWidth*scale,Shader.viewHeight*scale);
            } else {
                Shader.setProjection(Shader.viewWidth,Shader.viewHeight,window.innerWidth,window.innerHeight);
            }
            break;
        }
        // Do nothing on static
        default: {break;}
    }
}

export {
    Color,
    Matrix,
    Shader,
    initialize,
    resizeCanvas,
    draw,
}
