import { MAX_TRANSFORMATIONS } from "../shaders/vertex";
import { Transform, TransformError } from "./Transform";
import expect from "expect";

describe("Transform", () => {
    it("can be merged with another transformation in order", () => {
        const t1 = new Transform();
        t1.translate(1, 1);
        const t2 = new Transform();
        t2.rotateDeg(10);
        t1.append(t2);
        expect(t1.list.length).toBe(2);
        expect(t1.list[0].type).toBe("translate");
        expect(t1.list[1].type).toBe("rotate");
    });

    it("translates", () => {
        const t = new Transform();
        t.translate(10, 20);
        expect(t.list[0].type).toBe("translate");
        expect(t.list[0].arg0).toBe(10);
        expect(t.list[0].arg1).toBe(20);
    });
    
    it("rotates via degrees", () => {
        const t = new Transform();
        t.rotateDeg(90);
        expect(t.list[0].type).toBe("rotate");
        expect(t.list[0].arg0).toBeCloseTo(Math.PI / 2);
    });

    it("rotates via radians", () => {
        const t = new Transform();
        t.rotateRad(Math.PI / 4);
        expect(t.list[0].type).toBe("rotate");
        expect(t.list[0].arg0).toBeCloseTo(Math.PI / 4);
    });
    
    it("scales", () => {
        const t = new Transform();
        t.scale(2, 3);
        expect(t.list[0].type).toBe("scale");
        expect(t.list[0].arg0).toBe(2);
        expect(t.list[0].arg1).toBe(3);
    });

    it("converts to an array", () => {
        const t = new Transform();
        t.translate(50, 60);
        t.rotateRad(Math.PI / 4);
        t.scale(-2, -2);
        const a = t.toArray();
        expect(a[0]).toBe(1); // translate
        expect(a[1]).toBe(50);
        expect(a[2]).toBe(60);
        expect(a[3]).toBe(2); // rotate
        expect(a[4]).toBeCloseTo(Math.PI / 4);
        expect(a[5]).toBe(0); // unused
        expect(a[6]).toBe(3); // scale
        expect(a[7]).toBe(-2);
        expect(a[8]).toBe(-2);
    });

    it("pads the end of the array with zeros, up to maximum transformations", () => {
        const t = new Transform();
        const a = t.toArray();
        expect(a.length).toBe(MAX_TRANSFORMATIONS * 3);
        for (let i = 0; i < a.length; i++) {
            expect(a[i]).toBe(0);
        }
    });

    it("throws a TransformError if too many transformations are applied", () => {
        const t = new Transform();
        expect(() => {
            for (let i = 0; i < MAX_TRANSFORMATIONS + 1; i++) {
                // Each transformation must be different so they don't merge or cancel each other out
                switch (i % 3) {
                    case (0): {
                        t.translate(1, 1);
                        break;
                    }
                    case (1): {
                        t.rotateRad(1);
                        break;
                    }
                    case (2): {
                        t.scale(2, 2);
                        break;
                    }
                }
            }
        }).toThrow(TransformError);
    });

    it("does not apply useless translations", () => {
        const t = new Transform();
        t.translate(0, 0);
        expect(t.list.length).toBe(0);
    });

    it("does not apply useless rotations", () => {
        const t = new Transform();
        t.rotateRad(0);
        expect(t.list.length).toBe(0);
    });

    it("does not apply useless scaling", () => {
        const t = new Transform();
        t.scale(1, 1);
        expect(t.list.length).toBe(0);
    });

    it("merges consecutive translations", () => {
        const t = new Transform();
        t.translate(10, 20);
        t.translate(20, 40);
        expect(t.list.length).toBe(1);
        expect(t.list[0].arg0).toBe(30);
        expect(t.list[0].arg1).toBe(60);
    });

    it("merges consecutive rotations", () => {
        const t = new Transform();
        t.rotateRad(Math.PI / 2);
        t.rotateRad(Math.PI / 2);
        expect(t.list.length).toBe(1);
        expect(t.list[0].arg0).toBeCloseTo(Math.PI);
    });

    it("merges consecutive scaling", () => {
        const t = new Transform();
        t.scale(2, 4);
        t.scale(-3, 5);
        expect(t.list.length).toBe(1);
        expect(t.list[0].arg0).toBe(-6);
        expect(t.list[0].arg1).toBe(20);
    });

    it("cancels contradictory translations", () => {
        const t = new Transform();
        t.translate(10, 0);
        t.translate(15, -20);
        t.translate(-25, 20);
        expect(t.list.length).toBe(0);
    });

    it("cancels contradictory rotations", () => {
        const t = new Transform();
        t.rotateRad(Math.PI / 2);
        t.rotateRad(Math.PI / 2);
        t.rotateRad(-Math.PI);
        expect(t.list.length).toBe(0);
    });

    it("cancels contradictory scaling", () => {
        const t = new Transform();
        t.scale(2, 4);
        t.scale(2, -25);
        t.scale(0.25, -0.01);
        expect(t.list.length).toBe(0);
    });
});