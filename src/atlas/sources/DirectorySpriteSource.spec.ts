import expect from "expect";
import { DirectorySpriteSource, DirectorySpriteSourceError } from "./DirectorySpriteSource";
import fs from "fs";
import path from "path";
import Jimp from "jimp";
import { ImageSpriteSourceError } from "./ImageSpriteSource";

const temp = ".tmp-DirectorySpriteSource";
const s1 = "sprite";
const s2 = "sprite2";
const s3 = "empty";
const cleanup = true; // Set to false if you want to view the generated GIFs after running tests

describe("DirectorySpriteSource", () => {

    // Write our frame files
    before(async () => {
        // But first, make the three nested directories
        if (!fs.existsSync(temp)) {  
            fs.mkdirSync(temp);
        }
        if (!fs.existsSync(path.join(temp, s1))) {
            fs.mkdirSync(path.join(temp, s1));
        }
        if (!fs.existsSync(path.join(temp, s2))) {
            fs.mkdirSync(path.join(temp, s2));
        }
        if (!fs.existsSync(path.join(temp, s3))) {
            fs.mkdirSync(path.join(temp, s3));
        }

        const frame1 = new Jimp(2, 2, 0xff0000ff);
        const frame2 = new Jimp(2, 2, 0x00ff00ff);
        const frame3 = new Jimp(2, 2, 0x0000ffff);
        // Write these to filesystem out of order to ensure we load them alphabetically
        await frame3.writeAsync(path.join(temp, s1, "3.png"));
        await frame1.writeAsync(path.join(temp, s1, "1.png"));
        await frame2.writeAsync(path.join(temp, s1, "2.png"));
        fs.writeFileSync(path.join(temp, s2, "file.txt"), "not an image");
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

    it("takes the name of the directory", () => {
        const d = new DirectorySpriteSource(path.join(temp, s1));
        expect(d.name).toBe("sprite");
    });

    it("reads all files in the directory in correct order", async () => {
        const d = new DirectorySpriteSource(path.join(temp, s1));
        const data = await d.read();
        // Check color of each frame
        // Frame 1: red
        const frame1 = await Jimp.read(data.images[0].data);
        expect(frame1.bitmap.data.at(0)).toBe(0xff);
        expect(frame1.bitmap.data.at(1)).toBe(0x00);
        expect(frame1.bitmap.data.at(2)).toBe(0x00);
        // Frame 2: green
        const frame2 = await Jimp.read(data.images[1].data);
        expect(frame2.bitmap.data.at(0)).toBe(0x00);
        expect(frame2.bitmap.data.at(1)).toBe(0xff);
        expect(frame2.bitmap.data.at(2)).toBe(0x00);
        // Frame 3: blue
        const frame3 = await Jimp.read(data.images[2].data);
        expect(frame3.bitmap.data.at(0)).toBe(0x00);
        expect(frame3.bitmap.data.at(1)).toBe(0x00);
        expect(frame3.bitmap.data.at(2)).toBe(0xff);
    });

    it("throws when loading non-image files", async () => {
        const d = new DirectorySpriteSource(path.join(temp, s2));
        await expect(d.read()).rejects.toThrow(ImageSpriteSourceError);
    });

    it("throws if the directory is empty", async () => {
        const d = new DirectorySpriteSource(path.join(temp, s3));
        await expect(d.read()).rejects.toThrow(DirectorySpriteSourceError);
    });
});