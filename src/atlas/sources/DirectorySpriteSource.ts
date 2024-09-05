import { SpriteData } from "../../types";
import { FileSystemSpriteSource } from "./FileSystemSpriteSource";

/** Reads image files, alphabetically, from a nested directory and forms a sprite with each image representing a frame */
export class DirectorySpriteSource extends FileSystemSpriteSource {
    // TODO design and implement DirectorySpriteSource

    async read(): Promise<SpriteData> {
        throw new Error("Not implemented");
    }
}