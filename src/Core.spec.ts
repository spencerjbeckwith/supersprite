import { Core } from "./Core";
import sinon from "sinon";
import expect from "expect";

describe("Core", () => {
    before(() => {
        // @ts-ignore
        sinon.replace(window.HTMLCanvasElement.prototype, "getContext", (c: string) => {
            const gl = HTMLCanvasElement.prototype.getContext(c)!;
            if (c === "webgl2") {
                // Required for our "shader" to "compile"
                const g = gl as WebGL2RenderingContext;
                g.createShader = () => ({});
                g.createProgram = () => ({});
                g.createBuffer = () => ({});
                g.getUniformLocation = () => ({});
                g.createVertexArray = () => ({});
                g.createFramebuffer = () => ({});
                g.bindFramebuffer = sinon.stub();
            }
            return gl;
        });

        // Replace the Image constructor we can test the atlas loading
        // @ts-ignore
        sinon.replace(window, "Image", class StubImage {
            addEventListener(type: string, callback: () => void) {
                if (type === "load") {
                    callback();
                }
            }
        });
    });

    const opts = {
        presenter: {
            baseWidth: 200,
            baseHeight: 200,
        },
        atlasUrl: null,
    };

    it("loads the provided atlas URL", async () => {
        const core = new Core(opts);
        await new Promise((r) => setTimeout(r, 1));
        expect(core.atlas.image).not.toBeNull();
        expect(core.atlas.texture).not.toBeNull();
    });

    it("renders to the framebuffer after calling beginRender", () => {
        const core = new Core(opts);
        const stub = core.shader.gl.bindFramebuffer as sinon.SinonStub;
        stub.reset();
        core.beginRender();
        expect(stub.called).toBeTruthy();
        expect(stub.args[0][1]).toBeTruthy();
    });

    it("renders to the screen when calling endRender", () => {
        const core = new Core(opts);
        const stub = core.shader.gl.bindFramebuffer as sinon.SinonStub;
        stub.reset();
        core.endRender();
        expect(stub.called).toBeTruthy();
        expect(stub.args[0][1]).toBeNull();
    });

    it("updates the projection when the view size changes", () => {
        const core = new Core(opts);
        core.presenter.options.onResize(400, 600);
        expect(core.projection[0]).toBeCloseTo(2 / 400);
        expect(core.projection[1]).toBe(0);
        expect(core.projection[2]).toBe(0);

        expect(core.projection[3]).toBe(0);
        expect(core.projection[4]).toBeCloseTo(2 / 600);
        expect(core.projection[5]).toBe(0);

        expect(core.projection[6]).toBe(-1);
        expect(core.projection[7]).toBe(-1);
        expect(core.projection[8]).toBe(1);
    });
});