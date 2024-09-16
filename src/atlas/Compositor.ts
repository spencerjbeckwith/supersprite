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

    /** 
     * Indicates which areas of the atlas which are already occupied.
     * 
     * Each column of `granularityX` width is represented by each index of the array.
     * The value of the array indicates the number below which *that column* is occupied by sprites.
     * Therefore, any Y pixel value greater than or equal to the value at that index is unoccupied.
     * Note that that just refers to one column - if placing a sprite greater than `granularityX` width,
     * multiple columns must be checked.
     * 
     * For convenience, use the `setOccupied` and `isOccupied` functions of this class.
     * 
     * Atlas width is determined by the length of this array times `granularityX`,
     * while atlas height is determined by the maximum value of any index in the array.
     * 
     * This array is expected to expand while mapping image positions in the atlas.
     */
    occupied: number[];

    constructor(gatherer?: Gatherer, logEnabled = true) {
        this.gatherer = gatherer;
        this.granularityX = null;
        this.granularityY = null;
        this.logEnabled = logEnabled;
        this.occupied = [];
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

    /** Returns the start and end column indices, inclusive, that should be checked for placing a sprite with the given pixel width at the given pixel X position. */
    getOccupiedColumnRange(x: number, width: number): { start: number, end: number } {
        const gx = this.granularityX ?? 1;
        const result = {
            start: Math.floor(x / gx),
            end: Math.floor((x + width - 1) / gx),
        };
        // If we go outside our current range, extend the occupied array
        if (result.end > this.occupied.length) {
            const padding = new Array(result.end - this.occupied.length);
            padding.fill(0);
            this.occupied.push(...padding);
        }
        return result;
    }

    /** Returns if a rectangle of the provided size may be mapped into the atlas at the given pixel location */
    isOccupied(x: number, y: number, width: number): boolean {
        const { start, end } = this.getOccupiedColumnRange(x, width);
        for (let i = start; i <= end; i++) {
            if (this.occupied[i] > y) {
                return true;
            }
        }
        return false;
    }

    /** Sets the atlas status for a region to be occupied at a pixel location and prevent other images being placed on top */
    setOccupied(x: number, y: number, width: number, height: number) {
        const { start, end } = this.getOccupiedColumnRange(x, width);
        for (let i = start; i <= end; i++) {
            this.occupied[i] = y + height;
        }
    }

    /** Determine where in the atlas to place sprites, according to their sizes */
    map(sprites: SpriteData[]): AtlasMap {
        if (this.granularityX === null || this.granularityY === null) {
            this.setGranularity(sprites);
        }
    
        // cx/cy: current X and Y in our atlas. gx/gy: granularity (smallest pixel distance between sprites)
        let cx = 0;
        let cy = 0;
        const gx = this.granularityX;
        const gy = this.granularityY;

        // Empty our array from the front
        const remaining = [...sprites];
        while (remaining.length > 0) {
            const place = remaining.shift();

            // What'll be the best way to lay out our sprites?
            // We can go an arbitrary distance vertically before we move along horizontally,
            // so what is the end goal? Do we want a square-ish atlas?
            // Why not just make the atlas very long and thin?
            // Maybe we should set an arbitary max-height and just go from there

            // ...
        }

        throw new CompositorError("Not implemented");
    }

    /** Composite loaded sprite data into a new atlas image */
    async composite(map: AtlasMap): Promise<Jimp> {
        // TODO
        throw new CompositorError("Not implemented");
    }

    /** Writes a composed atlas to an image file */
    async saveAtlas(path: string, atlas: Jimp) {
        await atlas.writeAsync(path);
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