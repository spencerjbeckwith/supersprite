import { SpriteData } from "../../types";
import { FileSystemSpriteSource } from "./FileSystemSpriteSource";

/** Reads singular image files as a sprite sheet, cutting one base image into frames using data from the filename */
export class ImageSheetSpriteSource extends FileSystemSpriteSource {
    // TODO design and implement ImageSheetSpriteSource

    async read(): Promise<SpriteData> {
        throw new Error("Not implemented");
    }
}