import { SpriteData } from "../../types";
import { FileSystemSpriteSource } from "./FileSystemSpriteSource";
import fs from "fs/promises";
import { ImageSpriteSource } from "./ImageSpriteSource";
import path from "path";

/**
 * Reads image files, alphabetically, from a nested directory within the gatherer's base folder and forms a sprite with each image representing a frame.
 * 
 * Files within the directory that are *not* images will cause this to throw when loaded. The source will also throw if there are no files within the directory.
 */
export class DirectorySpriteSource extends FileSystemSpriteSource {
    async read(): Promise<SpriteData> {
        const frames: ImageSpriteSource[] = [];

        // Read all files from the directory
        const dir = await fs.opendir(this.path);
        let entry = await dir.read();
        while (entry) {
            frames.push(new ImageSpriteSource(path.join(this.path, entry.name)));
            entry = await dir.read();
        }
        if (frames.length === 0) {
            throw new DirectorySpriteSourceError(`No images found for DirectorySpriteSource with path ${this.path}!`);
        }

        // Put them in alphabetical order
        frames.sort((a, b) => {
            return (a.name < b.name) ? -1 : 1;
        });

        // Load all images asynchronously
        const imageData = await Promise.all(frames.map((source) => source.read()));

        // Return sprite data
        return {
            name: this.name,
            width: imageData[0].width,
            height: imageData[0].height,
            images: imageData.map((dat) => ({
                data: dat.images[0].data,
            })),
        };
    }
}

/** Describes issues loading sprite images from a directory */
export class DirectorySpriteSourceError extends Error {};