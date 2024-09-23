import { AtlasMap, Compositor, CompositorError } from "./Compositor";
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

/** Generates image buffer array for use in tests that need multiple images set */
function genImages(count: number): ({ data: Buffer })[] {
    const r: { data: Buffer }[] = [];
    for (let i = 0; i < count; i++) {
        r.push({
            data: Buffer.from(""),
        });
    }
    return r;
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

    describe(".getOccupiedRange()", () => {
        let result: ReturnType<Compositor["getOccupiedRange"]>;

        it("uses 1 for a null granularity", () => {
            const c = new Compositor();
            c.granularityX = null;
            c.granularityY = null;
            result = c.getOccupiedRange(0, 0, 20, 20);
            expect(result.startX).toBe(0);
            expect(result.startY).toBe(0);
            expect(result.endX).toBe(19);
            expect(result.endY).toBe(19);
        });

        it("determines separate ranges for X and Y", () => {
            const c = new Compositor();
            c.granularityX = null;
            c.granularityY = null;
            result = c.getOccupiedRange(8, 12, 4, 6);
            expect(result.startX).toBe(8);
            expect(result.startY).toBe(12);
            expect(result.endX).toBe(11);
            expect(result.endY).toBe(17);
        });

        it("uses a set granularity", () => {
            const c = new Compositor();
            c.granularityX = 4;
            c.granularityY = 4;
            result = c.getOccupiedRange(4, 12, 16, 16);
            expect(result.startX).toBe(1);
            expect(result.startY).toBe(3);
            expect(result.endX).toBe(4);
            expect(result.endY).toBe(6);
        });

        it("rounds when on levels less than the granularity", () => {
            const c = new Compositor();
            c.granularityX = 4;
            c.granularityY = 4;
            result = c.getOccupiedRange(6, 7, 12, 11);
            expect(result.startX).toBe(1);
            expect(result.startY).toBe(1);
            expect(result.endX).toBe(4);
            expect(result.endY).toBe(4);
        });

        it("can handle start and end being the same value", () => {
            const c = new Compositor();
            c.granularityX = 4;
            c.granularityY = 4;
            result = c.getOccupiedRange(6, 5, 1, 2);
            expect(result.startX).toBe(1);
            expect(result.startY).toBe(1);
            expect(result.endX).toBe(1);
            expect(result.endY).toBe(1);
        });

        it("can handle different X/Y granularities", () => {
            const c = new Compositor();
            c.granularityX = 4;
            c.granularityY = 8;
            result = c.getOccupiedRange(4, 8, 5, 9);
            expect(result.startX).toBe(1);
            expect(result.endX).toBe(2)
            expect(result.startY).toBe(1);
            expect(result.endY).toBe(2);
        });

        it("expands occupied arrays", () => {
            const c = new Compositor();
            c.granularityX = 2;
            c.granularityY = 2;
            c.getOccupiedRange(0, 0, 20, 18);
            expect(c.occupied.length).toBe(10);
            for (const column of c.occupied) {
                expect(column.length).toBe(9);
            }
            // Expand it
            c.getOccupiedRange(0, 0, 40, 30);
            expect(c.occupied.length).toBe(20);
            for (const column of c.occupied) {
                expect(column.length).toBe(15);
            }
        });

        it("fills in empty spots in the range", () => {
            const c = new Compositor();
            c.occupied = [
                [], // column 1
                [false, true], // column 2
                [], // column 3
            ];
            c.getOccupiedRange(0, 0, 3, 3);
            
            // column 1
            expect(c.occupied[0].length).toBe(3);
            expect(c.occupied[0][0]).toBe(false);
            expect(c.occupied[0][1]).toBe(false);
            expect(c.occupied[0][2]).toBe(false);

            // column 2
            expect(c.occupied[1].length).toBe(3);
            expect(c.occupied[1][0]).toBe(false);
            expect(c.occupied[1][1]).toBe(true);
            expect(c.occupied[1][2]).toBe(false);

            // column 3
            expect(c.occupied[2].length).toBe(3);
            expect(c.occupied[2][0]).toBe(false);
            expect(c.occupied[2][1]).toBe(false);
            expect(c.occupied[2][2]).toBe(false);
        });
    });

    describe(".isOccupied()", () => {
        it("returns true if any spot in the range is occupied", () => {
            const c = new Compositor();
            c.getOccupiedRange(0, 0, 20, 20); // Initialize a range before updating a spot
            c.occupied[4][4] = true;
            expect(c.isOccupied(1, 1, 16, 16)).toBe(true);
        });

        it("returns false if all spots in the range are not occupied", () => {
            const c = new Compositor();
            expect(c.isOccupied(1, 1, 16, 16)).toBe(false);
        });
    });

    describe(".setOccupied()", () => {
        it("updates single spots", () => {
            const c = new Compositor();
            c.setOccupied(1, 1, 1, 1);
            
            // Column 1
            expect(c.occupied[0]).toBeTruthy();
            expect(c.occupied[0].length).toBe(0);

            // Column 2
            expect(c.occupied[1][0]).toBe(false);
            expect(c.occupied[1][1]).toBe(true);
            expect(c.occupied[1][2]).toBeUndefined();

            // Column 3
            expect(c.occupied[2]).toBeUndefined();
        });

        it("updates ranges", () => {
            const c = new Compositor();
            c.setOccupied(1, 1, 2, 2);

            // Column 1
            expect(c.occupied[0]).toBeTruthy();
            expect(c.occupied[0].length).toBe(0);

            // Column 2
            expect(c.occupied[1][0]).toBe(false);
            expect(c.occupied[1][1]).toBe(true);
            expect(c.occupied[1][2]).toBe(true);

            // Column 3
            expect(c.occupied[2][0]).toBe(false);
            expect(c.occupied[2][1]).toBe(true);
            expect(c.occupied[2][2]).toBe(true);
        });
    });

    it("saves atlas image to the specified path", async () => {
        const c = new Compositor();
        const p = path.join(temp, "atlas.png");
        const j = new Jimp(4, 4, 0);
        await c.saveAtlas(p, j);
        expect (fs.existsSync(p)).toBe(true);
    });

    it("sets texture matrices correctly", async () => {
        const width = 256;
        const height = 256;
        const c = new Compositor();
        const a: AtlasMap = {
            // Using 2 sprites, 3 images total
            sprites: [{
                name: "sprite1",
                width: 16,
                height: 16,
                images: [{
                    x: 8,
                    y: 8,
                    t: [1, 0, 0, 0, 1, 0, 0, 0, 1],
                },{
                    x: 20,
                    y: 10,
                    t: [1, 0, 0, 0, 1, 0, 0, 0, 1],
                }],
            },{
                name: "sprite2",
                width: 8,
                height: 8,
                images: [{
                    x: 13,
                    y: 40,
                    t: [1, 0, 0, 0, 1, 0, 0, 0, 1],
                }],
            }],
            width,
            height,
            locations: [],
        };
        c.setMatrices(a);

        const m1 = a.sprites[0].images[0].t;
        expect(m1[0]).toBeCloseTo(16 / width); // w
        expect(m1[4]).toBeCloseTo(16 / height); // h
        expect(m1[6]).toBeCloseTo(8 / width); // x
        expect(m1[7]).toBeCloseTo(8 / height); // y

        const m2 = a.sprites[0].images[1].t;
        expect(m2[0]).toBeCloseTo(16 / width); // w
        expect(m2[4]).toBeCloseTo(16 / height); // h
        expect(m2[6]).toBeCloseTo(20 / width); // x
        expect(m2[7]).toBeCloseTo(10 / height); // y

        const m3 = a.sprites[1].images[0].t;
        expect(m3[0]).toBeCloseTo(8 / width); // w
        expect(m3[4]).toBeCloseTo(8 / height); // h
        expect(m3[6]).toBeCloseTo(13 / width); // x
        expect(m3[7]).toBeCloseTo(40 / height); // y
    });

    it("determines atlas width and height", () => {
        const c = new Compositor(undefined, undefined, 16);
        const map = c.map([{
            name: "1",
            width: 8,
            height: 8,
            images: genImages(3),
        },{
            name: "2",
            width: 12,
            height: 4,
            images: genImages(4),
        },{
            name: "3",
            width: 4,
            height: 4,
            images: genImages(1),
        }]);
        expect(map.width).toBe(28);
        expect(map.height).toBe(16);
    });

    it("maps sprites into the atlas", () => {
        const c = new Compositor(undefined, undefined, 16);
        c.granularityX = 4;
        c.granularityY = 4;
        const map = c.map([{
            name: "1",
            width: 8,
            height: 8,
            images: genImages(3),
        },{
            name: "2",
            width: 12,
            height: 4,
            images: genImages(4),
        },{
            name: "3",
            width: 3,
            height: 3,
            images: genImages(3),
        }]);

        // Placement of 3 8x8s
        expect(map.sprites[0].images[0].x).toBe(0);
        expect(map.sprites[0].images[0].y).toBe(0);
        expect(map.sprites[0].images[1].x).toBe(0);
        expect(map.sprites[0].images[1].y).toBe(8);
        expect(map.sprites[0].images[2].x).toBe(8);
        expect(map.sprites[0].images[2].y).toBe(0);

        // Placement of 4 12x4s
        expect(map.sprites[1].images[0].x).toBe(8);
        expect(map.sprites[1].images[0].y).toBe(8);
        expect(map.sprites[1].images[1].x).toBe(8);
        expect(map.sprites[1].images[1].y).toBe(12);
        expect(map.sprites[1].images[2].x).toBe(16);
        expect(map.sprites[1].images[2].y).toBe(0);
        expect(map.sprites[1].images[3].x).toBe(16);
        expect(map.sprites[1].images[3].y).toBe(4);

        // Placement of 3 3x3s
        expect(map.sprites[2].images[0].x).toBe(20);
        expect(map.sprites[2].images[0].y).toBe(8);
        expect(map.sprites[2].images[1].x).toBe(20);
        expect(map.sprites[2].images[1].y).toBe(12);
        expect(map.sprites[2].images[2].x).toBe(24);
        expect(map.sprites[2].images[2].y).toBe(8);
    });

    it("maps sprite images that are larger than targetHeight into the atlas", () => {
        const c = new Compositor(undefined, undefined, 20);
        const map = c.map([{
            name: "1",
            width: 32,
            height: 32,
            images: genImages(1),
        }]);
        expect(map.width).toBe(32);
        expect(map.height).toBe(32);
        expect(map.sprites[0].images[0].x).toBe(0);
        expect(map.sprites[0].images[0].y).toBe(0);
    });

    it("determines target height based on total area", () => {
        const c = new Compositor();
        const t = c.determineTargetHeight([{
            name: "1",
            width: 12,
            height: 4,
            images: genImages(2),
        },{
            name: "2",
            width: 24,
            height: 24,
            images: genImages(1),
        },{
            name: "3",
            width: 4,
            height: 10,
            images: genImages(3),
        }]);
        expect(t).toBeCloseTo(29);
    });

    it("determines a target height while mapping", () => {
        const c = new Compositor();
        const m = [{
            name: "1",
            width: 8,
            height: 8,
            images: genImages(4),
        }];
        const map = c.map(m);
        expect(c.targetHeight).toBe(16);
        expect(map.width).toBe(16);
        expect(map.height).toBe(16);
    });
});