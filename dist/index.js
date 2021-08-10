import Color from './util/color.js';
import Matrix from './util/matrix.js';
import Shader from './shader.js';
import draw from './draw.js';
/** Initialize supersprite by creating the canvases, setting up the GL and 2D contexts, and loading the atlas texture. */
function initialize(options) {
    // Create and style our canvases
    const cv1 = document.createElement('canvas');
    const cv2 = document.createElement('canvas');
    document.body.appendChild(cv1);
    document.body.appendChild(cv2);
    cv1.width = options.displayWidth || options.viewWidth || window.innerWidth;
    cv1.height = options.displayHeight || options.viewHeight || window.innerHeight;
    cv2.width = cv1.width;
    cv2.height = cv1.height;
    cv1.setAttribute('style', 'position: absolute; left: 50%; top: 50%; transform: translate(-50%,-50%); overflow: hidden;');
    cv2.setAttribute('style', 'position: absolute; left: 50%; top: 50%; transform: translate(-50%,-50%); overflow: hidden;');
    // Get our contexts
    const gl = cv1.getContext('webgl', {
        antialias: options.glAntialias || true,
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
        Shader.setBackgroundColor(options.backgroundColor.red, options.backgroundColor.green, options.backgroundColor.blue);
    }
    else {
        Shader.setBackgroundColor(0, 0, 0);
    }
    Shader.responsive = options.responsive || 'static';
    Shader.maintainAspectRatio = options.maintainAspectRatio;
    Shader.scalePerfectly = options.scalePerfectly;
    // GL
    Shader.init(gl, ctx, options.viewWidth || window.innerWidth, options.viewHeight || window.innerHeight, options.displayWidth, options.displayHeight);
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('orientationchange', resizeCanvas);
    resizeCanvas();
    // Texture
    Shader.loadAtlasTexture(options.atlasURL).then((tex) => {
        Shader.atlasTexture = tex;
        options.mainLoop();
    }).catch((err) => {
        console.error('Failed to load atlas texture!');
        console.error(err);
    });
}
/** Refreshes the size of the canvas according to the current size of the window and supersprite's responsive, maintainAspectRatio, and scalePerfectly options. */
function resizeCanvas() {
    switch (Shader.responsive) {
        case ('stretch'): {
            if (Shader.maintainAspectRatio) {
                const ratio = Shader.viewWidth / Shader.viewHeight;
                let newWidth = Shader.viewWidth, newHeight = Shader.viewHeight;
                if (window.innerWidth > window.innerHeight) {
                    newHeight = window.innerHeight;
                    newWidth = newHeight * ratio;
                }
                else {
                    newWidth = window.innerWidth;
                    newHeight = newWidth / ratio;
                }
                Shader.setProjection(newWidth, newHeight);
            }
            else {
                Shader.setProjection(window.innerWidth, window.innerHeight);
            }
            break;
        }
        case ('scale'): {
            if (Shader.maintainAspectRatio) {
                let scale = 1;
                if (window.innerHeight > window.innerWidth) {
                    scale = window.innerWidth / Shader.viewWidth;
                }
                else {
                    scale = window.innerHeight / Shader.viewHeight;
                }
                scale = Math.max(scale, 1);
                if (Shader.scalePerfectly) {
                    scale = Math.floor(scale);
                }
                Shader.setProjection(Shader.viewWidth, Shader.viewHeight, Shader.viewWidth * scale, Shader.viewHeight * scale);
            }
            else {
                Shader.setProjection(Shader.viewWidth, Shader.viewHeight, window.innerWidth, window.innerHeight);
            }
            break;
        }
        // Do nothing on static
        default: {
            break;
        }
    }
}
export { Color, Matrix, Shader, initialize, resizeCanvas, draw, };
