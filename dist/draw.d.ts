import Color from "./util/color.js";
import Matrix from "./util/matrix.js";
interface Sprite {
    name: string;
    width: number;
    height: number;
    originX: number;
    originY: number;
    images: {
        x: number;
        y: number;
        t: [number, number, number, number, number, number, number, number, number];
    }[];
}
declare type TransformerFn = (mat: Matrix) => Matrix;
interface drawTextOptions {
    hAlign?: CanvasTextAlign;
    vAlign?: CanvasTextBaseline;
    fontName?: string;
    fontSize?: number;
    color?: string | CanvasGradient | CanvasPattern;
    maxWidth?: number;
    drawShadow?: boolean;
    shadowOffsetX?: number;
    shadowOffsetY?: number;
    lineSeparation?: number;
    lineBreakCharacters?: RegExp;
}
declare function drawLine(x: number, y: number, x2: number, y2: number, col: Color): void;
declare function drawLine(x: number, y: number, x2: number, y2: number, r: number, g: number, b: number, a?: number): void;
declare function drawRect(x: number, y: number, x2: number, y2: number, col: Color): void;
declare function drawRect(x: number, y: number, x2: number, y2: number, r: number, g: number, b: number, a?: number): void;
declare function drawCircle(x: number, y: number, radius: number, segments: number, col: Color): void;
declare function drawCircle(x: number, y: number, radius: number, segments: number, r: number, g: number, b: number, a?: number): void;
declare function drawPrimitive(mode: number, positions: number[], col: Color): void;
declare function drawPrimitive(mode: number, positions: number[], r: number, g: number, b: number, a?: number): void;
declare function drawSprite(sprite: Sprite, image: number, x: number, y: number, transformFn?: TransformerFn, rcol?: Color | number, g?: number, b?: number, a?: number): void;
declare function drawSpriteSpeed(sprite: Sprite, speed: number, x: number, y: number, transformFn?: TransformerFn, rcol?: Color | number, g?: number, b?: number, a?: number): void;
declare function drawText(x: number, y: number, text: string, opt?: drawTextOptions): void;
declare function drawTextWrap(x: number, y: number, text: string, width: number, opt?: drawTextOptions): void;
declare const _default: {
    line: typeof drawLine;
    rect: typeof drawRect;
    circle: typeof drawCircle;
    primitive: typeof drawPrimitive;
    sprite: typeof drawSprite;
    spriteSpeed: typeof drawSpriteSpeed;
    text: typeof drawText;
    textWrap: typeof drawTextWrap;
};
export default _default;
