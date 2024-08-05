import { expect } from "expect";
import { Color, ColorError } from "./Color";

describe("Color", () => {
    it("can be constructed with RGBA values from 0 to 1", () => {
        const c = new Color(0.4, 0.5, 0.6, 0.7);
        expect(c.red).toBe(0.4);
        expect(c.green).toBe(0.5);
        expect(c.blue).toBe(0.6);
        expect(c.alpha).toBe(0.7);
    });

    it("can be constructed with RGBA values from 0 to 255", () => {
        const c = new Color(200, 220, 240, 250);
        expect(c.red).toBeCloseTo(0.78);
        expect(c.green).toBeCloseTo(0.86);
        expect(c.blue).toBeCloseTo(0.94);
        expect(c.alpha).toBeCloseTo(0.98)
    });

    it("can be constructed from a hex code in uppercase", () => {
        const c = new Color("C8DCF0");
        expect(c.red).toBeCloseTo(0.78);
        expect(c.green).toBeCloseTo(0.86);
        expect(c.blue).toBeCloseTo(0.94);
    });

    it("can be constructed from a hex code in lowercase", () => {
        const c = new Color("c8dcf0");
        expect(c.red).toBeCloseTo(0.78);
        expect(c.green).toBeCloseTo(0.86);
        expect(c.blue).toBeCloseTo(0.94);
    });

    it("can be constructed from a hex code including the #", () => {
        const c = new Color("#C8DCF0");
        expect(c.red).toBeCloseTo(0.78);
        expect(c.green).toBeCloseTo(0.86);
        expect(c.blue).toBeCloseTo(0.94);
    });

    it("throws an error if constructed from an invalid hex code", () => {
        expect(() => {
            new Color("yeet");
        }).toThrow(ColorError);
    });

    it("throws an error if constructed with invalid hex characters", () => {
        expect(() => {
            new Color("a0bcki");
        }).toThrow(ColorError);
    });

    it("throws an error if any color channel is out of range", () => {
        expect(() => {
            new Color(300, 200, 200);
        }).toThrow(ColorError);
        expect(() => {
            new Color(200, 300, 200);
        }).toThrow(ColorError);
        expect(() => {
            new Color(200, 200, 300);
        }).toThrow(ColorError);
    });
    
    it("throws an error if alpha channel is out of range", () => {
        expect(() => {
            new Color("000000", 4);
        }).toThrow(ColorError);
    });

    it("defaults alpha to 1", () => {
        const c = new Color("a0b0c0");
        expect(c.alpha).toBe(1);
    });

    it("can be inverted", () => {
        const c = new Color(0.75, 0.75, 0.75);
        const c2 = c.invert();
        expect(c2.red).toBe(0.25);
        expect(c2.green).toBe(0.25);
        expect(c2.blue).toBe(0.25);
    });

    it("can be converted to a hex code", () => {
        const c = new Color(0.78, 0.86, 0.94);
        expect(c.toHex()).toBe("#c8dcf0");
    });
});