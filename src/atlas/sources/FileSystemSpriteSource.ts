import { SpriteSource } from "./SpriteSource";

/** Parent class for all sprite sources based in the file system */
export abstract class FileSystemSpriteSource extends SpriteSource {

    /** Location of the sprite in the file system */
    path: string;

    constructor(path: string) {
        super();
        this.path = path;
    }
}