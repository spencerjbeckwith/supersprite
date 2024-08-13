import { Presenter, PresenterError } from "./Presenter";
import expect from "expect";
import sinon from "sinon";

describe("Presenter", () => {

    const e = new window.Event("resize");

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

    it("throws if unable to initialize GL or 2d contexts", () => {
        const c1 = document.createElement("canvas");
        c1.getContext = () => null;
        expect(() => {
            new Presenter({
                glCanvas: c1,
                ctxCanvas: null,
            });
        }).toThrow(PresenterError);
        const c2 = document.createElement("canvas");
        c2.getContext = () => null;
        expect(() => {
            new Presenter({
                glCanvas: document.createElement("canvas"),
                ctxCanvas: c2,
            });
        }).toThrow(PresenterError);
    });

    it("creates and adds canvases to the document", () => {
        const s = sinon.spy(document, "appendChild");
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
        window.dispatchEvent(e);
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
        window.dispatchEvent(e);
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
        window.dispatchEvent(e);
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
        window.dispatchEvent(e);
        expect(p.currentWidth).toBe(200);
        expect(p.currentHeight).toBe(100);
    });
});