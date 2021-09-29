import { MainShader } from './shader.js';
import Color from './util/color.js';
import Matrix from './util/matrix.js';
/** A sprite instance, as exported by supersprite's compiler */
interface Sprite {
    width: number;
    height: number;
    originX: number;
    originY: number;
    images: SpriteImage[];
}
/** Contains data about a single image of a sprite */
interface SpriteImage {
    x: number;
    y: number;
    /** A precomputed 3x3 matrix, used to slice this sprite image out of the texture atlas. */
    t: [number, number, number, number, number, number, number, number, number];
}
/** An options object for drawing text on the 2D context. */
interface DrawTextOptions {
    /** Horizontal alignment of the text */
    hAlign?: CanvasTextAlign;
    /** Vertical alignment of the text */
    vAlign?: CanvasTextBaseline;
    /** The name of the CSS font to use */
    fontName?: string;
    /** The size (px) of the font to draw with. Note that if your canvas scales, the font will scale also, making small fonts appear large and readable if your view is normally small. */
    fontSize?: number;
    /** The color to use for the text */
    color?: string | CanvasGradient | CanvasPattern;
    /** A width which, if exceeded, the text will be crammed into. */
    maxWidth?: number;
    /** If true, a black shadow will appear under the text to help it pop. */
    drawShadow?: boolean;
    /** If drawShadow is true, this is the number of pixels to offset the shadow horizontally from the text */
    shadowOffsetX?: number;
    /** If drawShadow is true, this is the number of pixels to offset the shadow vertically from the text */
    shadowOffsetY?: number;
    /** The number of pixels to separate each line by, when drawing wrapping text */
    lineSeparation?: number;
    /** A pattern of character that the lines are allowed to break on - so that text breaks don't occur in the middle of words. By default is spaces, back and forward slashes, and hyphens. */
    lineBreakCharacters?: RegExp;
}
/** The main access point for all drawing methods */
interface Draw {
    /** Contains a reference to the loaded atlas WebGL texture as required by some drawing methods. Must be set via supersprite.setAtlas() */
    atlasTexture: WebGLTexture | null;
    /** Contains a reference to the loaded atlas HTML image as required by some drawing methods. Must be set via supersprite.setAtlas()*/
    atlasImage: HTMLImageElement | null;
    /** Contains a reference to the current view projection as set by supersprite.setProjection() */
    projection: Matrix;
    /** Draws a line from one point to another */
    line: (x: number, y: number, x2: number, y2: number, color: Color | number[]) => void;
    /** Draws a filled rectangle between two points */
    rect: (x: number, y: number, x2: number, y2: number, color: Color | number[]) => void;
    /** Draws a circle centered on a position, made of the specified number of segments */
    circle: (x: number, y: number, radius: number, segments: number, color: Color | number[]) => void;
    /** Draws any type of WebGL primitive, provided its mode and vertex positions */
    primitive: (mode: 'points' | 'lineStrip' | 'lineLoop' | 'lines' | 'triangleStrip' | 'triangleFan' | 'triangles', positions: number[], color: Color | number[]) => void;
    /** Draws an image from a sprite with optional transformations or blending */
    sprite: (sprite: Sprite, image: number, x: number, y: number, transform?: (mat: Matrix) => Matrix, color?: Color | number[]) => void;
    /** Draws an animated, looping sprite with optional transformations or blending*/
    spriteSpeed: (sprite: Sprite, speed: number, x: number, y: number, transform?: (mat: Matrix) => Matrix, color?: Color | number[]) => void;
    /** Draws a contorted image from a sprite with optional transformations or blending */
    spriteSpecial: (sprite: Sprite, image: number, x: number, y: number, positions: number[], UVs?: number[], transform?: (mat: Matrix) => Matrix, color?: Color | number[]) => void;
    /** Draws an contorted, animated sprite with optional transformations or blending */
    spriteSpeedSpecial: (sprite: Sprite, speed: number, x: number, y: number, positions: number[], UVs?: number[], transform?: (mat: Matrix) => Matrix, color?: Color | number[]) => void;
    /** Draws an image from a sprite onto the 2D context canvas */
    spriteCtx: (sprite: Sprite, image: number, x: number, y: number, scaleX?: number, scaleY?: number) => void;
    /** Draws an animated, looping sprite onto the 2D context canvas */
    spriteSpeedCtx: (sprite: Sprite, speed: number, x: number, y: number, scaleX?: number, scaleY?: number) => void;
    /** Draws a contorted texture with optional transformations or blending*/
    texture: (texture: WebGLTexture, x: number, y: number, width: number, height: number, positions: number[], UVs?: number[], transform?: (mat: Matrix) => Matrix, color?: Color | number[]) => void;
    /** Draws a line of text onto the 2D context canvas */
    text: (x: number, y: number, text: string, options?: DrawTextOptions) => void;
    /** Draws multiple lines of text onto the 2D context canvas */
    textWrap: (x: number, y: number, text: string, width: number, options?: DrawTextOptions) => void;
}
/** Sets up references and methods, to be used internally */
declare function prepareDrawing(gl: WebGL2RenderingContext, ctx: CanvasRenderingContext2D, main: MainShader, projection: Matrix, internalTimer: {
    current: number;
}): Draw;
export { Sprite, SpriteImage, Draw, DrawTextOptions, prepareDrawing, };
