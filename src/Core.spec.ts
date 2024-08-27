import { Core, CoreError } from "./Core";
import sinon from "sinon";
import expect from "expect";

describe("Core", () => {
    
    let createTexture: sinon.SinonStub;
    let bindTexture: sinon.SinonStub;
    let createFramebuffer: sinon.SinonStub;
    let bindFramebuffer: sinon.SinonStub;

    before(() => {
        // Prepare our stubs
        createTexture = sinon.stub();
        createTexture.returns({});
        bindTexture = sinon.stub();

        createFramebuffer = sinon.stub();
        createFramebuffer.returns({});
        bindFramebuffer = sinon.stub();

        // Need to replace methods on the contexts, so intercept getContext
        // @ts-ignore
        sinon.replace(window.HTMLCanvasElement.prototype, "getContext", (c: string) => {
            if (c === "webgl2") {
                // Required for our "shader" to "compile"
                const gl = HTMLCanvasElement.prototype.getContext(c)!;
                const g = gl as WebGL2RenderingContext;
                g.createShader = () => ({});
                g.createProgram = () => ({});
                g.createBuffer = () => ({});
                g.getUniformLocation = () => ({});
                g.createVertexArray = () => ({});
                // We'll do assertions against these ones
                g.createTexture = createTexture;
                g.bindTexture = bindTexture;
                g.createFramebuffer = createFramebuffer;
                g.bindFramebuffer = bindFramebuffer;
                return gl;
            } else {
                const ctx = HTMLCanvasElement.prototype.getContext(c) as any;
                ctx.clearRect = () => {};
                ctx.setTransform = () => {};
                ctx.scale = () => {};
                return ctx;
            }
        });

        // Replace the Image constructor we can test the atlas loading
        class StubImage {
            addEventListener(type: string, callback: () => void) {
                if (type === "load") {
                    callback();
                }
            }
        };
        // @ts-ignore
        window.Image = StubImage;
    });

    afterEach(() => {
        createTexture.reset();
        createTexture.returns({});
        bindTexture.reset();
        createFramebuffer.reset();
        createFramebuffer.returns({});
        bindFramebuffer.reset();
    });

    // Core options re-used in the tests
    const opts = {
        presenter: {
            baseWidth: 200,
            baseHeight: 200,
        },
        atlas: null,
    };

    it("loads the provided atlas URL", () => {
        const core = new Core({
            ...opts,
            atlas: {
                url: "...",
            },
        });
        expect(core.atlas.image).not.toBeNull();
        expect(core.atlas.texture).not.toBeNull();
    });

    it("renders to the framebuffer after calling beginRender", () => {
        const core = new Core(opts);
        core.beginRender();
        expect(bindFramebuffer.called).toBeTruthy();
        expect(bindFramebuffer.args[0][1]).toBeTruthy();
    });

    it("renders to the screen when calling endRender", () => {
        // Make sure bindFramebuffer was most recently called with null
        const core = new Core(opts);
        bindFramebuffer.reset();
        core.endRender();
        expect(bindFramebuffer.called).toBeTruthy();
        expect(bindFramebuffer.args[0][1]).toBeNull();
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

    it("calls manually specified onResize when the view size changes", () => {
        const stub = sinon.stub();
        const core = new Core({
            ...opts,
            presenter: {
                ...opts.presenter,
                onResize: stub,
            },
        });
        core.presenter.options.onResize(400, 600);
        expect(stub.called).toBeTruthy();
        // The function will technically be called twice by now: once on init, once on resize
        // So assert on call no. 1 instead of no. 0
        expect(stub.args[1][0]).toBe(400);
        expect(stub.args[1][1]).toBe(600);
    });

    it("throws if the atlas texture cannot be created", () => {
        createTexture.returns(null);
        expect(() => {
            new Core({
                ...opts,
                atlas: {
                    url: "...", // needed to go down this branch
                },
            });
        }).toThrow(CoreError);
    });

    it("throws if the game texture cannot be created", () => {
        createTexture.returns(null);
        expect(() => {
            new Core(opts); // w/ null atlas
        }).toThrow(CoreError);
    });

    // it throws if the framebuffer cannot be created
    it("throws if the framebuffer cannot be created", () => {
        createFramebuffer.returns(null);
        expect(() => {
            new Core(opts);
        }).toThrow(CoreError);
    });

    it("binds the atlas texture before rendering", () => {
        const core = new Core({
            ...opts,
            atlas: {
                url: "...",
            },
        });
        bindTexture.reset();
        core.atlas.texture = "texture";
        core.beginRender();
        expect(bindTexture.called).toBeTruthy();
        expect(bindTexture.args[0][1]).toBe("texture"); // normally this would be the texture object
    });
});