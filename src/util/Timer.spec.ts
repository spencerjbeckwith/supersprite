import { Timer } from "./Timer";
import expect from "expect";
import sinon from "sinon";

describe("Timer", () => {

    let s: sinon.SinonStub;
    before(() => {
        s = sinon.stub(Date, "now");
    });
    after(() => {
        s.restore();
    });

    it("increments current value by 60 points per second", () => {
        const t = new Timer();
        t.last = 0;
        s.returns(1000);
        t.increment();
        expect(t.current).toBe(60);
    });

    it("rounds the current value to the nearest integer", () => {
        const t = new Timer();
        t.last = 0;
        s.returns(210)
        t.increment();
        expect(t.current).toBe(13);
    });

    it("returns the correct value for a wave with a given period", () => {
        const t = new Timer();
        t.last = 0;
        s.returns(2000);
        // Increments by 2 seconds (of an 8-second period) to advance our wave (and as long as we reset t.last each call)
        expect(t.wave(8)).toBeCloseTo(0);
        t.increment();
        expect(t.wave(8)).toBeCloseTo(1);
        t.last = 0;
        t.increment();
        expect(t.wave(8)).toBeCloseTo(0);
        t.last = 0;
        t.increment();
        expect(t.wave(8)).toBeCloseTo(-1);
        t.last = 0;
        t.increment();
        expect(t.wave(8)).toBeCloseTo(0);
        t.last = 0;
        t.increment();
        expect(t.wave(8)).toBeCloseTo(1);
    });

    it("uses wave period of 2 seconds by default", () => {
        const t = new Timer();
        t.last = 0;
        s.returns(500);
        t.increment();
        expect(t.wave()).toBeCloseTo(1);
        t.last = 0;
        t.increment();
        expect(t.wave()).toBeCloseTo(0);
    });

    it("sets first time stamp according to current time", () => {
        s.returns(123456);
        const t = new Timer();
        expect(t.first).toBe(123456);
    });
});