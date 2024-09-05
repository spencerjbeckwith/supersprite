import { FileSystemSpriteSource } from "../sources/FileSystemSpriteSource";
import { GIFSpriteSource } from "../sources/GIFSpriteSource";
import { ImageSpriteSource } from "../sources/ImageSpriteSource";
import { ImageSheetSpriteSource } from "../sources/ImageSheetSpriteSource";
import { DirectorySpriteSource } from "../sources/DirectorySpriteSource";
import { Gatherer } from "./Gatherer";
import fs from "fs/promises";
import path from "path";

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

    async gather(): Promise<FileSystemSpriteSource[]> {
        const start = Date.now();
        const list: FileSystemSpriteSource[] = [];
        const sources = {
            ...defaultFileSystemSources,
            ...this.config.sources,
        };

        const dir = await fs.opendir(this.config.directory);
        let entry = await dir.read();
        while (entry) {
            // Handle directories and files
            let extn: string | null = null;
            if (entry.isDirectory()) {
                extn = ".";
            }
            if (entry.isFile()) {
                const split = entry.name.split(".");
                split.shift(); // Remove first part of the filename, but keep everything after the first dot
                extn = split.join(".");
            }

            // Locate our constructor and add it to the list
            if (extn) {
                // Note that because of this, we can't add anything else in-between dots in the filename
                // If you want to add extra data into a sprite using only the filesystem, it'll have to be done with either
                // a change here, or using a different delineating character than dots.
                const c = sources[extn];
                if (c) {
                    const filepath = path.join(this.config.directory, entry.name);
                    list.push(new c(filepath));
                    this.log(`found: ${filepath}`);
                } else {
                    this.log(`no source registered for extension: "${extn}"`);
                }
            }

            // Read next entry
            entry = await dir.read();
        }

        this.log(`found ${list.length} entries in ${Date.now() - start}ms`);
        return list;
    }
}