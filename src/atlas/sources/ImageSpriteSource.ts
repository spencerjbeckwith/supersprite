import { SpriteData } from "../../types";
import { FileSystemSpriteSource } from "./FileSystemSpriteSource";
import fs from "fs/promises";
import path from "path";

/** Loads individual image files as one-frame sprites */
export class ImageSpriteSource extends FileSystemSpriteSource {
    async read(): Promise<SpriteData> {
        return {
            name: path.basename(this.path).split(".")[0],
            images: [{
                data: await fs.readFile(this.path),
            }],
        };
    }
}