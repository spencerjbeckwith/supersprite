import fs from "fs";
import path from "path";
import { ImageSpriteSource } from "./ImageSpriteSource";
import expect from "expect";

const temp = ".tmp-ImageSpriteSource";

describe("ImageSpriteSource", () => {

    const f1 = path.join(temp, "iss.png");
    const f2 = path.join(temp, "iss.2.png");

    before(() => {
        if (!fs.existsSync(temp)) {  
            fs.mkdirSync(temp);
        }
        fs.writeFileSync(f1, Buffer.from("1234"));
        fs.writeFileSync(f2, Buffer.from("5678"));
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

    it("sets the data to the buffer from the filesystem", async () => {
        const iss = new ImageSpriteSource(f1);
        const data = await iss.read();
        expect(data.images.length).toBe(1);
        expect(data.images[0].data[0]).toBe(0x31);
        expect(data.images[0].data[1]).toBe(0x32);
        expect(data.images[0].data[2]).toBe(0x33);
        expect(data.images[0].data[3]).toBe(0x34);
    });
});