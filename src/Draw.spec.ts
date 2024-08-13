import { Draw, DrawError } from "./Draw";
import expect from "expect";
import { Shader } from "./Shader";

/** To help us track GL/ctx state in our tests */
class Spy {
    gl: WebGL2RenderingContext;
    ctx: CanvasRenderingContext2D;
    constructor() {
        const c1 = new HTMLCanvasElement();
        this.gl = c1.getContext("webgl2")!;

        // TODO: override all relevant draw methods so we can spy on data passed to them
        // and then make assertions on the properties of this class
        // Will need to override: attributes, uniforms, positions

        const c2 = new HTMLCanvasElement();
        this.ctx = c2.getContext("2d")!;

        // TODO: same as above, override relevant ctx functions
        // Or: maybe at least provide sinon stubs for them?
        // This is different from GL in that our arguments are very clear,
        // wheras GL is more about controlling an internal state
    }

    reset() {
        // TODO: undo our local state (from last draw call)
    }
}

describe("Draw", () => {

    const spy = new Spy();
    const draw = new Draw({
        vao: {},
        attributes: {
            position: 0,
            texture: 1,
        },
        uniforms: {
            // Substitute the name for each uniform so we can track it more easily in our spy
            positionMatrix: "positionMatrix" as WebGLUniformLocation,
            textureMatrix: "textureMatrix" as WebGLUniformLocation,
            atlas: "atlas" as WebGLUniformLocation,
            blend: "blend" as WebGLUniformLocation,
            textured: "textured" as WebGLUniformLocation,
            // TODO: expand this list when there are more uniforms configured by our draw calls
        },
    } as Shader, spy.gl, spy.ctx);

    afterEach(() => {
        spy.reset();
    });

    describe("line()", () => {
        // TODO test draw.line()
    });

    describe("rect()", () => {
        // TODO test draw.rect()
    });

    describe("circle()", () => {
        // TODO test draw.circle()
    });

    describe("primitive()", () => {
        // TODO test draw.primitive()
    });

    describe("sprite()", () => {
        // TODO test draw.sprite()
    });

    describe("spriteAnim()", () => {
        // TODO test draw.spriteAnim()
    });

    describe("spriteSpecial()", () => {
        // TODO test draw.spriteSpecial()
    });

    describe("spriteSpecialAnim()", () => {
        // TODO test draw.spriteSpecialAnim()
    });

    describe("spriteCtx()", () => {
        // TODO test draw.spriteCtx()
    });

    describe("spriteCtxAnim()", () => {
        // TODO test draw.spriteCtxAnim()
    });

    describe("text()", () => {
        // TODO test draw.text()
    });

    describe("textWrap()", () => {
        // TODO test draw.textWrap()
    });
});