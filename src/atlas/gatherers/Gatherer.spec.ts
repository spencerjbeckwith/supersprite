import expect from "expect";
import sinon from "sinon";
import { Gatherer } from "./Gatherer";

class G extends Gatherer {
    async gather() {
        return []
    };
};

describe("Gatherer", () => {

    let s: sinon.SinonStub;
    before(() => {
        s = sinon.stub(console, "log");
    });

    afterEach(() => {
        s.reset();
    });

    after(() => {
        s.restore();
    });

    it("logs when configured", () => {
        const g = new G({
            log: true,
        });
        g.log("hello");
        expect(s.called).toBe(true);
        expect(s.args[0][0]).toBe("hello");
    });

    it("does not log if not configured", () => {
        const g = new G({});
        g.log("hello");
        expect(s.called).toBe(false);
    });
});