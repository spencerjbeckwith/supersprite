import fs from "fs";
import path from "path";
import { FileSystemGatherer } from "./FileSystemGatherer";
import { expect } from "expect";
import { ImageSpriteSource } from "../sources/ImageSpriteSource";
import { ImageSheetSpriteSource } from "../sources/ImageSheetSpriteSource";
import { GIFSpriteSource } from "../sources/GIFSpriteSource";
import { DirectorySpriteSource } from "../sources/DirectorySpriteSource";
import sinon from "sinon";

const temp = ".tmp";

function createFile(filename: string) {
    fs.writeFileSync(path.join(temp, filename), "");
}

function createDir(name: string) {
    fs.mkdirSync(path.join(temp, name));
}

describe("FileSystemGatherer", () => {
    // Create test directory anew
    beforeEach(() => {
        if (fs.existsSync(temp)) {
            fs.rmSync(temp, {
                force: true,
                recursive: true,
            });    
        }
        fs.mkdirSync(temp);
    });

    // Remove the test directory
    afterEach(() => {
        fs.rmSync(temp, {
            force: true,
            recursive: true,
        });
    });

    it("instantiates a list of sources from the directory structure", async () => {
        createFile("1.png");
        createFile("2.sheet.png");
        createFile("3.gif");
        const fsg = new FileSystemGatherer({
            directory: temp,
        });
        const s = await fsg.gather();
        expect(s.length).toBe(3);
        expect(s[0]).toBeInstanceOf(ImageSpriteSource);
        expect(s[1]).toBeInstanceOf(ImageSheetSpriteSource);
        expect(s[2]).toBeInstanceOf(GIFSpriteSource);
    });

    it("identifies directory entries", async () => {
        createDir("1");
        const fsg = new FileSystemGatherer({
            directory: temp,
        });
        const s = await fsg.gather();
        expect(s.length).toBe(1);
        expect(s[0]).toBeInstanceOf(DirectorySpriteSource);
    });

    it("identifies sources from custom extensions", async () => {
        createFile("1.xyz");
        const fsg = new FileSystemGatherer({
            directory: temp,
            sources: {
                xyz: DirectorySpriteSource,
            },
        });
        const s = await fsg.gather();
        expect(s.length).toBe(1);
        expect(s[0]).toBeInstanceOf(DirectorySpriteSource);
    });

    it("honors extension overrides over defaults", async () => {
        createFile("1.gif");
        const fsg = new FileSystemGatherer({
            directory: temp,
            sources: {
                gif: ImageSpriteSource,
            },
        });
        const s = await fsg.gather();
        expect(s.length).toBe(1);
        expect(s[0]).toBeInstanceOf(ImageSpriteSource);
    });

    it("ignores extensions that are set to null", async () => {
        createFile("1.gif");
        const fsg = new FileSystemGatherer({
            directory: temp,
            sources: {
                gif: null,
            },
        });
        const s = await fsg.gather();
        expect(s.length).toBe(0);
    });

    it("logs warnings if there are unhandled file extensions in the directory", async () => {
        const spy = sinon.spy(console, "log");
        createFile("1.asdf");
        const fsg = new FileSystemGatherer({
            directory: temp,
            log: true,
        });
        await fsg.gather();
        expect(spy.called).toBe(true);
        expect(spy.args[0][0]).toMatch(/warn/gi);
        spy.restore();
    });
});