import { Sprite, SpriteData } from "../types";
import { Gatherer } from "./gatherers/Gatherer";
import Jimp from "jimp";

/** Mapped location on the atlas, used to composite the final image. Does not include any sprite data. */
export interface AtlasLocation {
    /** X-location of this image within the atlas */
    x: number;

    /** Y-location of this image within the atlas */
    y: number;

    /** Image bitmap data */
    image: Buffer;
}

/** Information about a compiled Atlas, ready to be output */
export interface AtlasMap {
    /** List of all sprites that will be saved in the atlas. There is one entry per sprite. */
    sprites: ({
        /** Gatherer-specified name of each sprite, which will be used to identify it in code */
        name: string;
    } & Sprite)[];

    /** Width of the atlas, in pixels */
    width: number;

    /** Height of the atlas, in pixels */
    height: number;

    /** All images to be composited. There is one entry per image of each sprite. */
    locations: AtlasLocation[];
}

/** Responsible for determining where to place sprites on the atlas */
export class Compositor {

    /** Gathers sprites that must be loaded and composited into an atlas */
    gatherer?: Gatherer;

    /** Lowest horizontal distance between sprites on the atlas */
    granularityX: number | null;

    /** Lowest vertical distance between sprites on the atlas */
    granularityY: number | null;

    /** If this Compositor may print to the console with `Compositor.log()`. Defaults to true. */
    logEnabled: boolean;

    constructor(gatherer?: Gatherer, logEnabled = true) {
        this.gatherer = gatherer;
        this.granularityX = null;
        this.granularityY = null;
        this.logEnabled = logEnabled;
    }

    /** Load all sprite data from the Gatherer */
    async load(): Promise<SpriteData[]> {
        if (!this.gatherer) {
            throw new CompositorError("Unable to load sprite data with no Gatherer. Either specify one in the constructor or set `Compositor.gatherer` manually.");
        }
        const sources = await this.gatherer.gather();
        const start = Date.now();
        const data = await Promise.all(sources.map((source) => source.read()));
        this.log(`loaded ${sources.length} sources in ${Date.now()-start}ms`);
        return data;
    }

    /** 
     * Sets the granularity of this compositor, which determines the number of pixels used to separate sprites on the atlas.
     * 
     * Lower values use space more efficiently, while higher values compile the atlas quicker.
     * 
     * Defaults to the smallest width and smallest height of the sprites.
     */
    setGranularity(sprites: SpriteData[]) {
        this.granularityX = Math.min(...sprites.map((s) => s.width));
        this.granularityY = Math.min(...sprites.map((s) => s.height));
    }

    /** Re-orders an array of SpriteData, placing the largest sprites (in pixel area) first. This ensures the atlas is optimally laid-out. */
    sort(sprites: SpriteData[]): SpriteData[] {
        return [...sprites].sort((s1, s2) => (s1.width * s1.height) - (s2.width * s2.height));
    }

    /** Returns if a rectangle of the provided size may be mapped into the atlas at the given location */
    isOccupied(x: number, y: number, width: number, height: number): boolean {
        // TODO
        throw new CompositorError("Not implemented");
    }

    /** Sets the atlas status for a region to be occupied and prevent other images being placed on top */
    setOccupied(x: number, y: number, width: number, height: number) {
        // TODO
        throw new CompositorError("Not implemented");
    }

    /** Determine where in the atlas to place sprites, according to their sizes */
    map(sprites: SpriteData[]): AtlasMap {
        if (this.granularityX === null|| this.granularityY === null) {
            this.setGranularity(sprites);
        }
        // TODO
        throw new CompositorError("Not implemented");
    }

    /** Composite loaded sprite data into a new atlas image */
    async composite(map: AtlasMap): Promise<Jimp> {
        // TODO
        throw new CompositorError("Not implemented");
    }

    /** Writes a composed atlas to an image file */
    async saveAtlas(path: string, atlas: Jimp) {
        // TODO
        throw new CompositorError("Not implemented");
    }

    /** Writes the atlas map (of sprite data and precomputed texture matrices) to a file */
    async saveMap(path: string, atlas: AtlasMap) {
        // TODO
        throw new CompositorError("Not implemented");
    }

    /** Prints a log message about this Compositor, if logging is enabled. Useful to debug subclasses. */
    log(message: any) {
        if (this.logEnabled) {
            console.log(message);
        }
    }
}

/** Describes issues compositing a texture atlas */
export class CompositorError extends Error {};