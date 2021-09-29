import Matrix from './util/matrix';
import Color from './util/color';
import { MainShader, MainShaderOptions } from './shader';
import { Draw } from './draw';
/** Options object provided to supersprite's initialize() function. */
interface SuperspriteOptions {
    /** The initial width of the canvas. Default 400. */
    displayWidth?: number;
    /** The initial height of the canvas. Default 200. */
    displayHeight?: number;
    /** The initial width of the game view, which will stretch to fill the canvas if it does not match displayWidth. Default 400. */
    viewWidth?: number;
    /** The initial height of the game view, which will stretch to fill the canvas if it does not match displayHeight. Default 200. */
    viewHeight?: number;
    /** Options object for the WebGL context. No default provided. */
    glOptions?: WebGLContextAttributes;
    /** Options object for the 2D canvas context. No default provided. */
    ctxOptions?: CanvasRenderingContext2DSettings;
    /** How to respond to different screen sizes or changes in the screen size. "static" maintains the same size, "stretch" will fill the entire screen with the game view, and "scale" will stretch only the display and not the game view. Default "scale".*/
    responsive?: 'static' | 'stretch' | 'scale';
    /** If true, the view will maintain the same aspect ratio as set by the initial viewWidth and viewHeight. Default true.*/
    maintainAspectRatio?: boolean;
    /** If true, the view will not scale to any non-integer values even if it could. Default true. */
    scalePerfectly?: boolean;
    /** Controls whether or not the 2D canvas context should use antialiasing or not. Default false. */
    contextImageSmoothing?: boolean;
    /** If true, the HTML's background color will be matched to supersprite's background color. Default false. */
    matchPageToBackground?: boolean;
    /** If true, the canvas will resize responsively as the page changes size. Default true. */
    enableCanvasResize?: boolean;
    /** Options that can be passed during initialization to configure the shader. Can be used to replace the default source. */
    mainShaderOptions?: MainShaderOptions;
    /** Optional initial texture parameters to apply to the game texture, depending on the style of your game. */
    gameTextureParameters?: {
        textureMagFilter?: 'linear' | 'nearest';
        textureMinFilter?: 'linear' | 'nearest' | 'nearestMipmapNearest' | 'linearMipmapNearest' | 'nearestMipmapLinear' | 'linearMipmapLinear';
        textureWrapS?: 'repeat' | 'clampToEdge' | 'mirroredRepeat';
        textureWrapT?: 'repeat' | 'clampToEdge' | 'mirroredRepeat';
    };
}
/** Main access point to use supersprite. */
interface Supersprite {
    /** The WebGL canvas */
    cv1: HTMLCanvasElement;
    /** The 2D context canvas, overlaid above the first canvas. */
    cv2: HTMLCanvasElement;
    /** An image element of the atlas texture for sprite drawing. */
    atlasImage: HTMLImageElement | null;
    /** The WebGL context used by supersprite. */
    gl: WebGL2RenderingContext;
    /** The 2D context used by supersprite, overlaid above the first canvas. */
    ctx: CanvasRenderingContext2D;
    /** A matrix used by WebGL to convert pixels into clipspace coordinates. */
    projection: Matrix;
    /** A timer that increments on each frame, allowing for continual animation or other effects. */
    internalTimer: {
        current: number;
    };
    /** The texture that all rendering happens onto, which is then drawn to the screen at the end of each frame. */
    gameTexture: WebGLTexture;
    /** The texture from which all sprites should be drawn. */
    atlasTexture: WebGLTexture | null;
    /** The FrameBuffer used to draw the gameTexture before the end of the frame. */
    framebuffer: WebGLFramebuffer;
    /** The width of the game view, where drawing can occur. It may or may not match the displayWidth, depending on the "responsive" property. */
    viewWidth: number;
    /** The height of the game view, where drawing can occur. It may or may not match the displayHeight, depending on the "responsive" property. */
    viewHeight: number;
    /** The width of the canvases. It may or may not match the viewWidth, depending on the "responsive" property. */
    displayWidth: number;
    /** The height of the canvases. It may or may not match the viewHeight, depending on the "responsive" property.*/
    displayHeight: number;
    /** The background color to draw when nothing else is present. */
    background: {
        red: number;
        blue: number;
        green: number;
    };
    /** A color to blend the entire gameTexture by. */
    blend: Color | [number, number, number, number];
    /** Provides access to all properties/methods directly related to the shader */
    main: MainShader;
    /** Provides access to all drawing properties/methods */
    draw: Draw;
    /** Stored options, depending on how supersprite is initialized */
    options: {
        /** How to respond to different screen sizes or changes in the screen size. "static" maintains the same size, "stretch" will fill the entire screen with the game view, and "scale" will stretch only the display and not the game view. */
        responsive: 'static' | 'stretch' | 'scale';
        /** If true, the view will maintain the same aspect ratio as set by the initial viewWidth and viewHeight. */
        maintainAspectRatio: boolean;
        /** If true, the view will not scale to any non-integer values even if it could. */
        scalePerfectly: boolean;
        /** Controls whether or not the 2D canvas context should use antialiasing or not. */
        contextImageSmoothing: boolean;
        /** If true, the HTML's background color will be matched to supersprite's background color. */
        matchPageToBackground: boolean;
        /** If true, the canvas will resize responsively as the page changes size. Default true. */
        enableCanvasResize: boolean;
    };
    /** Called to make the canvas respond properly to different screen sizes. */
    resizeCanvas: () => void;
    /** Must be called each time the game view or the canvas display changes size in order to ensure the projection matrix remains correct. The displayWidth and displayHeight must only be provided if they are different from the view. Normally this is only called when the screen is resized. */
    setProjection: (viewWidth: number, viewHeight: number, displayWidth?: number, displayHeight?: number) => void;
    /** Must be called at the start of every frame. */
    beginRender: () => void;
    /** Must be called at the end of every frame. The optional transform, positions, and UVs arguments can apply transformations or contortions to the entire gameTexture as its drawn. */
    endRender: (transform?: (mat: Matrix) => Matrix, positions?: number[], UVs?: number[]) => void;
    /** Loads a new texture and image element from a provided URL. */
    loadTexture: (url: string, texParameters?: {
        textureMagFilter?: 'linear' | 'nearest';
        textureMinFilter?: 'linear' | 'nearest' | 'nearestMipmapNearest' | 'linearMipmapNearest' | 'nearestMipmapLinear' | 'linearMipmapLinear';
        textureWrapS?: 'repeat' | 'clampToEdge' | 'mirroredRepeat';
        textureWrapT?: 'repeat' | 'clampToEdge' | 'mirroredRepeat';
    }) => Promise<AtlasTextureObject>;
    /** Sets the atlasTexture and atlasImage, as returned from loadTexture. Must be called AFTER initializing supersprite, but BEFORE you start drawing. */
    setAtlas: (atlasObject: AtlasTextureObject) => void;
}
/** Holds all texture/image information required for supersprite to draw it, both in WebGL or on the 2D context. */
interface AtlasTextureObject {
    image: HTMLImageElement;
    texture: WebGLTexture;
    width: number;
    height: number;
}
/** Initializes supersprite. This must be called before loading textures or drawing anything. */
declare function initialize(options?: SuperspriteOptions): Supersprite;
export { Supersprite, SuperspriteOptions, initialize, };
