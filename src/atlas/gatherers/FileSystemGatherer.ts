import { FileSystemSpriteSource } from "../sources/FileSystemSpriteSource";
import { GIFSpriteSource } from "../sources/GIFSpriteSource";
import { ImageSpriteSource } from "../sources/ImageSpriteSource";
import { ImageSheetSpriteSource } from "../sources/ImageSheetSpriteSource";
import { DirectorySpriteSource } from "../sources/DirectorySpriteSource";
import { Gatherer, GathererConfig } from "./Gatherer";

/** Gatherer that reads sprites from the local filesystem */
export interface FileSystemGathererConfig {
    /** Directory from which to crawl to locate files */
    directory: string;

    /**
     * List of optional custom SpriteSource constructors to use for different file extensions.
     * 
     * If a source extension matches a default, it will be overridden.
     * 
     * Using a dot "." will use a provided constructor for *directory entries*, potentially allowing nested crawling.
     */
    sources?: {
        [extension: string]: null | { new (path: string): FileSystemSpriteSource };
    }
}

/** List of defaults for the file system. May be overridden by the config. */
const defaultFileSystemSources: FileSystemGathererConfig["sources"] = {
    "png": ImageSpriteSource,
    "jpg": ImageSpriteSource,
    "jpeg": ImageSpriteSource,
    "sheet.png": ImageSheetSpriteSource,
    "sheet.jpg": ImageSheetSpriteSource,
    "sheet.jpeg": ImageSheetSpriteSource,
    "gif": GIFSpriteSource,
    ".": DirectorySpriteSource,
};

/** Gatherer subclass that crawls a directory in the filesystem and uses  */
export class FileSystemGatherer extends Gatherer<FileSystemGathererConfig> {

    constructor(config: GathererConfig & FileSystemGathererConfig) {
        super(config);
        this.config.sources = {
            ...defaultFileSystemSources,
            ...this.config.sources,
        }
    }

    async gather(): Promise<FileSystemSpriteSource[]> {
        throw new Error("Not implemented");
    }
}