import { GifFrame, GifUtil } from "gifwrap";
import expect from "expect";
import { GIFSpriteSource, GIFSpriteSourceError } from "./GIFSpriteSource";
import fs from "fs";
import path from "path";
import Jimp from "jimp";

const temp = ".tmp-GifSpriteSource";
const cleanup = true; // Set to false if you want to view the generated GIFs after running tests

const g1 = path.join(temp, "1.gif");
const g2 = path.join(temp, "2.gif");
const g3 = path.join(temp, "3.gif");

describe("GIFSpriteSource", () => {

    // Create sample gifs to test on
    before(async () => {
        if (!fs.existsSync(temp)) {  
            fs.mkdirSync(temp);
        }
        await Promise.all([
            // Disposal method 1: layer changes
            GifUtil.write(g1, [
                new GifFrame(2, 2, 0xff0000ff, { disposalMethod: 1 }),
                new GifFrame(2, 2, 0x00000000, { disposalMethod: 1 }),
                new GifFrame(2, 2, 0x0000ffff, { disposalMethod: 1 }),
            ]),
            // Disposal method 2: new bitmaps each frame
            GifUtil.write(g2, [
                new GifFrame(2, 2, 0xff0000ff, { disposalMethod: 2 }),
                new GifFrame(2, 2, 0x00000000, { disposalMethod: 2 }),
                new GifFrame(2, 2, 0x00ff00ff, { disposalMethod: 2 }),
            ]),
            // Unhandled disposal method
            GifUtil.write(g3, [
                new GifFrame(2, 2, 0xff0000ff, { disposalMethod: 3 }),
                new GifFrame(2, 2, 0x00000000, { disposalMethod: 3 }),
                new GifFrame(2, 2, 0x00ff00ff, { disposalMethod: 3 }),
            ]),
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

    it("handles layering disposal method (1)", async () => {
        const g = new GIFSpriteSource(g1);
        const data = await g.read();

        // Assert that frame 2 is red, as transparency was layered on frame 1
        const jimp = await Jimp.read(data.images[1].data);
        jimp.scan(0, 0, 2, 2, (x, y, idx) => {
            expect(jimp.bitmap.data[0 + idx]).toBe(0xff); // red
            expect(jimp.bitmap.data[1 + idx]).toBe(0x00); // green
            expect(jimp.bitmap.data[2 + idx]).toBe(0x00); // blue
            expect(jimp.bitmap.data[3 + idx]).toBe(0xff); // alpha
        });
    });

    it("handles non-layering disposal method (2)", async () => {
        const g = new GIFSpriteSource(g2);
        const data = await g.read();

        // Assert that frame 2 is fully transparent and independent of frame 1
        const jimp = await Jimp.read(data.images[1].data);
        jimp.scan(0, 0, 2, 2, (x, y, idx) => {
            expect(jimp.bitmap.data[0 + idx]).toBe(0x00); // red
            expect(jimp.bitmap.data[1 + idx]).toBe(0x00); // green
            expect(jimp.bitmap.data[2 + idx]).toBe(0x00); // blue
            expect(jimp.bitmap.data[3 + idx]).toBe(0x00); // alpha
        });
    });

    it("throws for unexpected disposal methods", async () => {
        const g = new GIFSpriteSource(g3);
        expect(async () => {
            await g.read();
        }).rejects.toBeInstanceOf(GIFSpriteSourceError);
    });
});