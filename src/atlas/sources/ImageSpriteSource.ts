import { SpriteData } from "../../types";
import { FileSystemSpriteSource } from "./FileSystemSpriteSource";
import fs from "fs/promises";

/** Loads individual image files as one-frame sprites */
export class ImageSpriteSource extends FileSystemSpriteSource {
    async read(): Promise<SpriteData> {
        return {
            name: this.name,
            images: [{
                data: await fs.readFile(this.path),
            }],
        };
    }
}