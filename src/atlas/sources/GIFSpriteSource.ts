import { SpriteData } from "../../types";
import { FileSystemSpriteSource } from "./FileSystemSpriteSource";

/** Reads GIFs as sprites */
export class GIFSpriteSource extends FileSystemSpriteSource {
    // TODO design and implement GIFSpriteSource

    async read(): Promise<SpriteData> {
        throw new Error("Not implemented");
    }
}