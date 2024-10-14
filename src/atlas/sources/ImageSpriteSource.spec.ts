import fs from "fs";
import path from "path";
import { ImageSpriteSource, ImageSpriteSourceError } from "./ImageSpriteSource";
import expect from "expect";
import Jimp from "jimp";

const temp = ".tmp-ImageSpriteSource";

describe("ImageSpriteSource", () => {

    const f1 = path.join(temp, "iss.png");
    const f2 = path.join(temp, "iss.2.png");
    const f3 = path.join(temp, "file.txt");

    before(async () => {
        if (!fs.existsSync(temp)) {  
            fs.mkdirSync(temp);
        }
        await Promise.all([
            new Jimp(1, 1, 0).writeAsync(f1),
            new Jimp(1, 1, 0).writeAsync(f2),
        ]);
        fs.writeFileSync(f3, Buffer.from("not an image"));
    });

    // Remove the test directory
    after(() => {
        fs.rmSync(temp, {
            force: true,
            recursive: true,
        });
    });

    it("sets the name to the name of the file, not including extension", async () => {
        const iss = new ImageSpriteSource(f1);
        const data = await iss.read();
        expect(data.name).toBe("iss");
    });

    it("only includes name until the first dot", async () => {
        const iss = new ImageSpriteSource(f2);
        const data = await iss.read();
        expect(data.name).toBe("iss");
    });

    it("sets the data", async () => {
        const iss = new ImageSpriteSource(f1);
        const data = await iss.read();
        expect(data.images.length).toBe(1);
        expect(data.images[0].data).toBeTruthy();
    });

    it("throws if the data is not an expected image format", async () => {
        const iss = new ImageSpriteSource(f3);
        await expect(iss.read()).rejects.toThrow(ImageSpriteSourceError);
    });
});