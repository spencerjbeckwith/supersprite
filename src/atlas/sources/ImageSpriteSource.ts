import { SpriteData } from "../../types";
import { FileSystemSpriteSource } from "./FileSystemSpriteSource";

/** Loads individual image files as one-frame sprites */
export class ImageSpriteSource extends FileSystemSpriteSource {
    // TODO design and implement PNGSpriteSource

    async read(): Promise<SpriteData> {
        throw new Error("Not implemented");
    }
}