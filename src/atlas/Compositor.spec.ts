import { Compositor, CompositorError } from "./Compositor";
import expect from "expect";
import { Gatherer } from "./gatherers/Gatherer";
import { SpriteSource } from "./sources/SpriteSource";
import { SpriteData } from "../types";
import sinon from "sinon";
import path from "path";
import Jimp from "jimp";
import fs from "fs";

const temp = ".tmp-Compositor";
const cleanup = true; // Set to false if you want to view any output files after running tests

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
        if (!fs.existsSync(temp)) {  
            fs.mkdirSync(temp);
        }
    });

    afterEach(() => {
        logStub.reset();
    });

    after(() => {
        logStub.restore();
        if (cleanup) {
            fs.rmSync(temp, {
                force: true,
                recursive: true,
            });
        }
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

    it("determines column ranges for checking occupation", () => {
        const c = new Compositor();

        // null granularityX (defaults to using 1)
        let result = c.getOccupiedColumnRange(0, 20);
        expect(result.start).toBe(0);
        expect(result.end).toBe(19);

        result = c.getOccupiedColumnRange(8, 4);
        expect(result.start).toBe(8);
        expect(result.end).toBe(11);

        // set granularityX
        c.granularityX = 4;
        result = c.getOccupiedColumnRange(4, 16);
        expect(result.start).toBe(1);
        expect(result.end).toBe(4);

        result = c.getOccupiedColumnRange(6, 12);
        expect(result.start).toBe(1);
        expect(result.end).toBe(4);

        result = c.getOccupiedColumnRange(2, 2);
        expect(result.start).toBe(0);
        expect(result.end).toBe(0);
    });

    it("initializes columns when getting a column range", () => {
        const c = new Compositor();
        c.granularityX = 4;
        expect(c.occupied.length).toBe(0);
        const result = c.getOccupiedColumnRange(4, 16);
        expect(c.occupied.length).toBe(result.end);
        for (let i = 0; i < c.occupied.length; i++) {
            expect(c.occupied[i]).toBe(0);
        }
    });

    it("checks all relevant columns when checking occupation", () => {
        const c = new Compositor();
        c.granularityX = 4;
        c.occupied = [0, 8, 0];
        expect(c.isOccupied(0, 0, 12)).toBe(true);
        expect(c.isOccupied(0, 8, 12)).toBe(false);
    });

    it("updates all relevant columns when setting occupation", () => {
        const c = new Compositor();
        c.granularityX = 4;
        c.setOccupied(0, 12, 12, 12);
        expect(c.occupied[0]).toBe(24);
        expect(c.occupied[1]).toBe(24);
        expect(c.occupied[2]).toBe(24);
        expect(c.isOccupied(0, 24, 8)).toBe(false);
        expect(c.isOccupied(2, 20, 2)).toBe(true);
    });

    it("saves atlas image to the specified path", async () => {
        const c = new Compositor();
        const p = path.join(temp, "atlas.png");
        const j = new Jimp(4, 4, 0);
        await c.saveAtlas(p, j);
        expect (fs.existsSync(p)).toBe(true);
    });

    // ...
});