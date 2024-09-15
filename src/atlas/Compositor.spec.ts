import { Compositor, CompositorError } from "./Compositor";
import expect from "expect";
import { Gatherer } from "./gatherers/Gatherer";
import { SpriteSource } from "./sources/SpriteSource";
import { SpriteData } from "../types";
import sinon from "sinon";

/** Random integer between `min` and `max` */
function randomInt(min = 1, max = 10) {
    return Math.max(min, Math.floor(Math.random() * (max + 1)));
}

/** Used for Compositor tests */
class FakeSpriteSource extends SpriteSource {
    width: number;
    height: number;
    images: number;
    onRead?: Function;
    constructor(width = randomInt(), height = randomInt(), images = randomInt(), onRead?: Function) {
        super();
        this.width = width;
        this.height = height;
        this.images = images;
        this.onRead = onRead;
    }
    async read(): Promise<SpriteData> {
        if (this.onRead) {
            this.onRead();
        }
        return {
            name: `${this.width}x${this.height}`,
            width: this.width,
            height: this.height, 
            images: []
        }
    }
}

/** Used for Compositor tests */
class FakeGatherer extends Gatherer {
    sprites: SpriteSource[];
    constructor(sprites?: SpriteSource[]) {
        // Can initialize with a list of sources, if you want predefiend variables
        // Otherwise is set to a random list
        super({log: false});
        if (sprites) {
            this.sprites = sprites;
        } else {
            this.sprites = [];
            let count = randomInt();
            while (count > 0) {
                this.sprites.push(new FakeSpriteSource());
                count--;
            }
        }
    }
    async gather(): Promise<SpriteSource[]> {
        return this.sprites;
    }
}

describe("Compositor", () => {
    let logStub: sinon.SinonStub;
    before(() => {
        logStub = sinon.stub(console, "log");
    });

    afterEach(() => {
        logStub.reset();
    });

    after(() => {
        logStub.restore();
    });

    it("gathers and reads every sprite source", async () => {
        const stub = sinon.stub();
        const g = new FakeGatherer([
            new FakeSpriteSource(undefined, undefined, undefined, stub),
            new FakeSpriteSource(undefined, undefined, undefined, stub),
            new FakeSpriteSource(undefined, undefined, undefined, stub),
        ]);
        const c = new Compositor(g);
        await c.load();
        expect(stub.calledThrice).toBe(true);
    });

    it("throws if reading with no gatherer set", async () => {
        const c = new Compositor();
        await expect(c.load()).rejects.toThrow(CompositorError);
    });

    it("sets granularity to the smallest sprite width and height", async () => {
        const g = new FakeGatherer([
            new FakeSpriteSource(2, 10),
            new FakeSpriteSource(9, 3),
            new FakeSpriteSource(15, 15),
        ]);
        const c = new Compositor(g);
        c.setGranularity([{
            name: "",
            width: 2,
            height: 10,
            images: [],
        },{
            name: "",
            width: 9,
            height: 3,
            images: [],
        },{
            name: "",
            width: 15,
            height: 15,
            images: [],
        }]);
        expect(c.granularityX).toBe(2);
        expect(c.granularityY).toBe(3);
    });

    it("sorts sprites by area", () => {
        const c = new Compositor();
        const result = c.sort([{
            name: "9x9",
            width: 9,
            height: 9,
            images: [],
        },{
            name: "4x4",
            width: 4,
            height: 4,
            images: [],
        },{
            name: "12x12",
            width: 12,
            height: 12,
            images: [],
        },{
            name: "8x8",
            width: 8,
            height: 8,
            images: [],
        }]);
        expect(result[0].name).toBe("4x4");
        expect(result[1].name).toBe("8x8");
        expect(result[2].name).toBe("9x9");
        expect(result[3].name).toBe("12x12");
    });

    it("logs to the console if logging is enabled", async () => {
        const c = new Compositor(new FakeGatherer());
        await c.load();
        expect(logStub.called).toBe(true);
    });

    it("does not log to the console if logging is disabled", async () => {
        const c = new Compositor(new FakeGatherer(), false);
        await c.load();
        expect(logStub.called).toBe(false);
    });

    // ...
});