import { Presenter, PresenterError } from "./Presenter";
import expect from "expect";
import sinon from "sinon";

describe("Presenter", () => {
    let s: sinon.SinonStub;
    before(() => {
        s = sinon.stub(window.HTMLCanvasElement.prototype, "getContext");
        s.returns({});
    });

    after(() => {
        s.restore();
    });

    it("throws if neither dimensions nor canvases are provided", () => {
        expect(() => {
            new Presenter({});
        }).toThrow(PresenterError);
    });

    it("throws if canvases are the same", () => {
        const c = document.createElement("canvas");
        expect(() => {
            new Presenter({
                glCanvas: c,
                ctxCanvas: c,
            });
        }).toThrow(PresenterError);
    });

    it("throws if canvas sizes are ambiguous", () => {
        expect(() => {
            new Presenter({
                baseWidth: 10,
            });
        }).toThrow(PresenterError);
    });

    it("throws if unable to initialize WebGL2 context", () => {
        const c = document.createElement("canvas");
        c.getContext = () => null;
        expect(() => {
            new Presenter({
                glCanvas: c,
                ctxCanvas: null,
            });
        }).toThrow(PresenterError);
    });

    it("throws if unable to initialize 2D context", () => {
        const c = document.createElement("canvas");
        c.getContext = () => null;
        expect(() => {
            new Presenter({
                glCanvas: document.createElement("canvas"),
                ctxCanvas: c,
            });
        }).toThrow(PresenterError);
    });

    it("creates and adds canvases to the document", () => {
        const s = sinon.spy(document.body, "appendChild");
        new Presenter({
            baseWidth: 320,
            baseHeight: 240,
        });
        expect(s.callCount).toBe(2);
        s.restore();
    });

    it("can scale when resizing", () => {
        const p = new Presenter({
            baseWidth: 100,
            baseHeight: 100,
        });
        window.innerWidth = 250;
        window.innerHeight = 250;
        p.resize();
        expect(p.currentWidth).toBe(200);
        expect(p.currentHeight).toBe(200);
    });

    it("can be configured to allow fractional scaling", () => {
        const p = new Presenter({
            baseWidth: 200,
            baseHeight: 100,
            scalePerfectly: false,
        });
        window.innerWidth = 500;
        window.innerHeight = 800;
        p.resize();
        expect(p.currentWidth).toBe(500);
        expect(p.currentHeight).toBe(250);
    });

    it("can stretch when resizing", () => {
        const p = new Presenter({
            baseWidth: 200,
            baseHeight: 100,
            responsiveness: "stretch",
        });
        window.innerWidth = 600;
        window.innerHeight = 500;
        p.resize();
        expect(p.currentWidth).toBe(600);
        expect(p.currentHeight).toBe(500);
    });

    it("will not resize if responsiveness is static", () => {
        const p = new Presenter({
            baseWidth: 200,
            baseHeight: 100,
            responsiveness: "static",
        });
        window.innerWidth = 400;
        window.innerHeight = 400;
        p.resize();
        expect(p.currentWidth).toBe(200);
        expect(p.currentHeight).toBe(100);
    });

    it("calls onResize when resized", () => {
        const fake = sinon.fake();
        const p = new Presenter({
            baseWidth: 100,
            baseHeight: 100,
            onResize: fake,
        });
        window.innerWidth = 300;
        window.innerHeight = 300;
        p.resize();
        expect(fake.called).toBe(true);
        
        // We want to check the second call, since resize() is called when the object is first created
        expect(fake.getCalls()[1].firstArg).toBe(300);
        expect(fake.getCalls()[1].lastArg).toBe(300);
    });
});