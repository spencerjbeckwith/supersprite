import { Sprite, SpriteData, SpriteImage } from "../types";
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
     * The required height of an atlas column before the atlas expands horizontally.
     * 
     * If not set, a value will be selected which should keep the atlas as relatively square as possible.
     * This value is selected based on the total anticipated area of all loaded images.
     * 
     * Note that this is not a hard limit - images taller than `targetHeight` will still be placed, taking up a full column on their own,
     * and expanding the new target height to utilize the new, albeit unintentional, real estate.
     */
    targetHeight: number | null;

    /** 
     * Indicates which areas of the atlas which are already occupied.
     * 
     * Each column of `granularityX` width is represented by each index of the array,
     * and each slot of `granularityY` height is held within a list at each index.
     * 
     * In other words, top-level array stores all rows and each nested array is the column, going down.
     * 
     * For convenience, use the `setOccupied` and `isOccupied` functions of this class.
     * 
     * Atlas width is determined by the length of this array times `granularityX`,
     * while atlas height is determined by the maximum length times `granularityY` of any sub-array.
     * 
     * This array is expected to expand while mapping image positions in the atlas.
     */
    occupied: boolean[][];

    constructor(gatherer?: Gatherer, logEnabled = true, targetHeight: number | null = null) {
        this.gatherer = gatherer;
        this.granularityX = null;
        this.granularityY = null;
        this.logEnabled = logEnabled;
        this.targetHeight = targetHeight;
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

    /** Returns the start and end indices, inclusive, that should be checked for placing a sprite. */
    getOccupiedRange(x: number, y: number, width: number, height: number): { startX: number, endX: number, startY: number, endY: number } {
        const gx = this.granularityX ?? 1;
        const gy = this.granularityY ?? 1;
        const result = {
            startX: Math.floor(x / gx),
            endX: Math.floor((x + width - 1) / gx),
            startY: Math.floor(y / gy),
            endY: Math.floor((y + height - 1)/ gy),
        };

        // If we go outside our current range, extend the occupied arrays to ensure we don't wind up with out-of-range errors
        // First, ensure we have every column
        if (result.endX >= this.occupied.length) {
            // Add 1 to end result here (and below) because we are returning the index number, not the length
            while (this.occupied.length < result.endX + 1) {
                this.occupied.push([]);
            }
        }

        // Now iterate over the ranges for each column
        for (let x = result.startX; x <= result.endX; x++) {
            const column = this.occupied[x];
            if (result.endY >= column.length) {
                while (column.length < result.endY + 1) {
                    column.push(false);
                }
            }
        }

        return result;
    }

    /** Returns if a rectangle of the provided size may be mapped into the atlas at the given pixel location */
    isOccupied(x: number, y: number, width: number, height: number): boolean {
        const { startX, endX, startY, endY } = this.getOccupiedRange(x, y, width, height);
        for (let x = startX; x <= endX; x++) {
            for (let y = startY; y <= endY; y++) {
                if (this.occupied[x][y]) {
                    return true;
                }
            }
        }
        return false;
    }
    
    /** Sets the atlas status for a region to be occupied at a pixel location and prevent other images being placed on top */
    setOccupied(x: number, y: number, width: number, height: number) {
        const { startX, endX, startY, endY } = this.getOccupiedRange(x, y, width, height);
        for (let x = startX; x <= endX; x++) {
            for (let y = startY; y <= endY; y++) {
                this.occupied[x][y] = true;
            }
        }
    }

    /** Determines a target height to use for the atlas, using the total area of all images, which should keep the resulting atlas relatively square */
    determineTargetHeight(sprites: SpriteData[]): number {
        // This should be the square root of the total area taken by all images
        // This should get real close most of the time, except in situations where some images are significantly taller than others
        // But that's not the end of the world - the atlas may just be more rectangular in that case, but at least its space is used as efficiently as possible
        // (without being an incredibly demanding operation to generate)
        return Math.ceil(
            Math.sqrt(
                sprites.reduce((totalArea, current) => {
                    return totalArea + (current.width * current.height * current.images.length);
                }, 0)
            )
        );
    }

    /** Determine where in the atlas to place sprites, according to their sizes */
    map(sprites: SpriteData[]): AtlasMap {
        if (this.granularityX === null || this.granularityY === null) {
            this.setGranularity(sprites);
        }
        const start = Date.now();
    
        // gx/gy: granularity (smallest pixel distance between sprites)
        const gx = this.granularityX!;
        const gy = this.granularityY!;
        const atlasMap: AtlasMap = {
            sprites: [],
            locations: [],
            width: 0,
            height: 0,
        };

        // Empty our array from the front
        const remaining = [...sprites];

        // Determine our target height, if one wasn't set
        if (this.targetHeight == null) {
            this.targetHeight = this.determineTargetHeight(sprites);
        }

        // For every sprite in our list...
        while (remaining.length > 0) {
            // Because every image of each sprite is the same size, no need to re-order them - sprite images are placed in sequential order
            const place = remaining.shift()!;
            const images = [...place.images];
            const imageData: SpriteImage[] = [];

            // For every image in our sprite...
            while (images.length > 0) {
                const image = images.shift()!;
                // Iterate over every position via granularity until we find a valid spot
                // (There's probably a lot of room for optimization here...)
                let cx = 0;
                let cy = 0;
                while (this.isOccupied(cx, cy, place.width, place.height)) {
                    cy += gy;
                    // targetHeight is arbitrary, but should help your atlas be more square
                    if (cy + place.height > this.targetHeight) {
                        cx += gx;
                        cy = 0;
                    }
                }
    
                // By now, cx and cy are set to a valid spot for this sprite
                this.setOccupied(cx, cy, place.width, place.height);

                // We have two things to track per sprite image:
                // 1: the image data - what is the matrix we need to select this sprite? This is used by the engine.
                // 2: the location data - what buffer is placed at what X/Y coord in the atlas? This is only used to make the atlas.
                imageData.push({
                    x: cx,
                    y: cy,
                    t: [
                        // Without knowing our atlas size yet, we cannot set our X coord yet
                        // We have to come back to this after every image has been placed and we know our atlas width and height
                        1, 0, 0,
                        0, 1, 0,
                        0, 0, 1
                    ],
                });
                atlasMap.locations.push({
                    image: image.data,
                    x: cx,
                    y: cy,
                });
            }

            // Add our sprite to the map
            atlasMap.sprites.push({
                name: place.name,
                width: place.width,
                height: place.height,
                images: imageData,
            });
        }

        // Update our map with our new width/height
        atlasMap.width = this.occupied.length * gx;
        atlasMap.height = Math.max(...this.occupied.map((column) => column.length * gy));

        // Now update our sprite data matrices accounting for atlas width and height
        this.setMatrices(atlasMap);

        this.log(`mapped out ${atlasMap.locations.length} images in ${Date.now() - start}ms`);
        return atlasMap;
    }

    /**
     * Updates the sprite data of the AtlasMap to properly set the location of each image within the atlas.
     * 
     * This should be called after the atlas size has been determined (meaning `width` and `height` are set, and image locations found (`x` and `y` set on each sprite image).
     * Note that this *mutates* the AtlasMap.
     */
    setMatrices(atlasMap: AtlasMap) {
        atlasMap.sprites.forEach((s) => {
            const sw = s.width / atlasMap.width;
            const sh = s.height / atlasMap.height;
            s.images.forEach((i) => {
                i.t = [ // This is the result of short-handed matrix multiplication - a translation then scale
                    sw, 0, 0,
                    0, sh, 0,
                    i.x / atlasMap.width, i.y / atlasMap.height, 1,
                ];
            });
        });
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