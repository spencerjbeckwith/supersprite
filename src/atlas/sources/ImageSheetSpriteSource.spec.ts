import { expect } from "expect";
import { ImageSheetSpriteSource, ImageSheetSpriteSourceError, SpriteSheetInstructions } from "./ImageSheetSpriteSource";
import Jimp from "jimp";
import path from "path";
import fs from "fs";
import { writeFile } from "fs/promises";
import { SpriteData } from "../../types";

describe("ImageSheetSpriteSource", () => {
    const temp = ".tmp-ImageSheetSpriteSource";
    const cleanup = true; // Set to false if you want to view the generated sheets after running tests
    
    const p1 = path.join(temp, "1.sheet.png"); // horizontal
    const j1 = path.join(temp, "1.sheet.json");
    const p2 = path.join(temp, "2.sheet.png"); // vertical
    const j2 = path.join(temp, "2.sheet.json");
    const p3 = path.join(temp, "3.sheet.png"); // offset/sep
    const j3 = path.join(temp, "3.sheet.json");
    const p4 = path.join(temp, "4.sheet.png"); // this one won't actually exist
    const j4 = path.join(temp, "4.sheet.json"); // Incomplete instructions
    
    // More robust location instructions for test
    const locationInstructions: Required<SpriteSheetInstructions> = {
        offsetX: 8,
        offsetY: 8,
        separationX: 4,
        separationY: 4,
        frames: 21,
        frameWidth: 20,
        frameHeight: 32,
        rows: 3,
        columns: 7,
        vertical: false,
    }

    // Create sample sheets
    before(async () => {
        if (!fs.existsSync(temp)) {  
            fs.mkdirSync(temp);
        }

        // sheet 1: no separation or offset
        const sheet1 = new Jimp(2, 2, 0);
        sheet1.setPixelColor(0xff0000ff, 0, 0); // top-left: red
        sheet1.setPixelColor(0x00ff00ff, 1, 0); // top-right: green
        sheet1.setPixelColor(0x0000ffff, 0, 1); // bottom-left: blue
        sheet1.setPixelColor(0xffffffff, 1, 1); // bottom-right: white
        // sheet 2 is the same as sheet 1

        // sheet 3: separation and offset
        const sheet3 = new Jimp(4, 4, 0);
        sheet3.setPixelColor(0xff0000ff, 1, 1); // top-left: red
        sheet3.setPixelColor(0x00ff00ff, 3, 1); // top-right: green
        sheet3.setPixelColor(0x0000ffff, 1, 3); // bottom-left: blue
        sheet3.setPixelColor(0xffffffff, 3, 3); // bottom-right: white

        await Promise.all([
            // sheet 1  + json
            sheet1.writeAsync(p1),
            writeFile(j1, JSON.stringify({
                frameWidth: 1,
                frameHeight: 1,
                rows: 2,
                columns: 2,
            })),
            // sheet "2" + json
            sheet1.writeAsync(p2),
            writeFile(j2, JSON.stringify({
                frameWidth: 1,
                frameHeight: 1,
                rows: 2,
                columns: 2,
                frames: 4,
                vertical: true,
            })),
            // sheet 3 + json
            sheet3.writeAsync(p3),
            writeFile(j3, JSON.stringify({
                offsetX: 1,
                offsetY: 1,
                separationX: 1,
                separationY: 1,
                frameWidth: 1,
                frameHeight: 1,
                rows: 2,
                columns: 2,
                frames: 4,
            })),
            // incomplete json
            writeFile(j4, JSON.stringify({})),
        ]);
    });

    // Remove the test directory
    after(() => {
        if (cleanup) {
            fs.rmSync(temp, {
                force: true,
                recursive: true,
            });
        }
    });

    // Utility for asserting pixel colors from sprite data, will make this test DRYer
    async function expectPixel(data: SpriteData, frameNumber: number, toMatchHex: number) {
        const frame = await Jimp.read(data.images[frameNumber].data);
        expect(frame.getPixelColor(0, 0)).toBe(toMatchHex);
    }

    it("throws if instructions cannot be located", async () => {
        const isss = new ImageSheetSpriteSource(path.join(temp, "none.png"));
        await expect(isss.getInstructions()).rejects.toThrow(Error);
    });

    it("reads instructions from the file system", async () => {
        const isss = new ImageSheetSpriteSource(p1);
        const ins = await isss.getInstructions();
        expect(ins.frameWidth).toBe(1);
        expect(ins.frameHeight).toBe(1);
        expect(ins.rows).toBe(2);
        expect(ins.columns).toBe(2);
    });

    it("throws if required instructions properties are missing", async () => {
        const isss = new ImageSheetSpriteSource(p4);
        await expect(isss.getInstructions()).rejects.toThrow(ImageSheetSpriteSourceError);
    });

    it("sets instructions defaults properly", async () => {
        const isss = new ImageSheetSpriteSource(p1);
        const ins = isss.setDefaults(await isss.getInstructions());
        expect(ins.offsetX).toBe(0);
        expect(ins.offsetY).toBe(0);
        expect(ins.separationX).toBe(0);
        expect(ins.separationY).toBe(0);
        expect(ins.frames).toBe(4);
        expect(ins.vertical).toBe(false);
    });

    it("can read a sprite horizontally", async () => {
        const data = await new ImageSheetSpriteSource(p1).read();
        expectPixel(data, 0, 0xff0000ff); // red
        expectPixel(data, 1, 0x00ff00ff); // green
        expectPixel(data, 2, 0x0000ffff); // blue
        expectPixel(data, 3, 0xffffffff); // white
    });

    it("can read a sheet vertically", async () => {
        const data = await new ImageSheetSpriteSource(p2).read();
        expectPixel(data, 0, 0xff0000ff); // red
        expectPixel(data, 1, 0x0000ffff); // blue
        expectPixel(data, 2, 0x00ff00ff); // green
        expectPixel(data, 3, 0xffffffff); // white
    });

    it("respects offset and separation", async () => {
        const data = await new ImageSheetSpriteSource(p3).read();
        expectPixel(data, 0, 0xff0000ff); // red
        expectPixel(data, 1, 0x00ff00ff); // green
        expectPixel(data, 2, 0x0000ffff); // blue
        expectPixel(data, 3, 0xffffffff); // white
    });

    // These next two tests ensure we can locate on a sheet with more realistic pixel values, instead of just tiny sheets
    // The frame locating is probably the most complex part of this class so it's important to dig a bit deeper here

    it("can locate an image horizontally", () => {
        const p = new ImageSheetSpriteSource(p4);
        const loc = p.locate(8, locationInstructions);
        expect(loc.x).toBe(32);
        expect(loc.y).toBe(44);
    });

    it("can locate images vertically", () => {
        const p = new ImageSheetSpriteSource(p4);
        const loc = p.locate(8, {
            ...locationInstructions,
            vertical: true,
        });
        expect(loc.x).toBe(56);
        expect(loc.y).toBe(80);
    });
});