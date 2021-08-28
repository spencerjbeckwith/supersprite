import Shader from "./shader";
import Matrix from "./util/matrix";
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
    [name: string]: Shader | null;
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
declare const supersprite: supersprite;
export default supersprite;
