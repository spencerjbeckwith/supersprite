import { SpriteSource } from "./SpriteSource";
import path from "path";

/** Parent class for all sprite sources based in the file system */
export abstract class FileSystemSpriteSource extends SpriteSource {

    /** Name to identify the sprite, based on the filename */
    name: string;

    /** Location of the sprite in the file system */
    path: string;

    constructor(filepath: string) {
        super();
        this.path = filepath;
        this.name = path.basename(this.path).split(".")[0];
    }
}