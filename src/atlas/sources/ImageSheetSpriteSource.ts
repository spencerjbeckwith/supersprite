import { SpriteData } from "../../types";
import { FileSystemSpriteSource } from "./FileSystemSpriteSource";
import fs from "fs/promises";
import path from "path";
import { ImageSpriteSource } from "./ImageSpriteSource";
import Jimp from "jimp";

/** Describes how a static image should be broken up into an animated sprite */
export interface SpriteSheetInstructions {
    /** Top-left X pixel coordinate that starts the sprite sheet. Defaults to 0. */
    offsetX?: number;

    /** Top-left Y pixel coordinate that starts the sprite sheet. Defaults to 0. */
    offsetY?: number;

    /** Distance in pixels between columns of the sheet's images. Defaults to 0. */
    separationX?: number;

    /** Distance in pixels between rows of the sheet's images. Defaults to 0. */
    separationY?: number;

    /** Width of each frame, in pixels, within the sheet */
    frameWidth: number;

    /** Height of each frame, in pixels, within the sheet */
    frameHeight: number;

    /**
     * The number of frames to read out of the sprite sheet. If not specified, the entire sheet will be read by defaulting to `rows` times `columns`.
     * 
     * `frames` would be less than `rows` times `columns` in cases where there are fewer images and the sheet isn't completely fill.
     * In this case, setting `frames` will prevent presumably-empty space on the sheet from being read as undesired sprite images.
     * 
     */
    frames?: number;

    /** The number of rows of images to read out of the sprite sheet. */
    rows: number;

    /** The number of columns of images to read out of the sprite sheet */
    columns: number;
    
    /**
     * If the sheet should be read vertically or horizontally. Defaults to false.
     * 
     * If `vertical` is true, the next image in the sprite will be read going down each row before advancing to the next column.
     * 
     * If `vertical` is false, the next image in the sprite will be read across each column before advancing to the next row. 
     */
    vertical?: boolean;
}

const REQUIRED_INSTRUCTIONS: (keyof SpriteSheetInstructions)[] = [
    "frameWidth",
    "frameHeight",
    "rows",
    "columns",
];

/** 
 * Reads singular image files as a sprite sheet, cutting one static image into frames of an animated sprite.
 * 
 * This source is slightly different from others in that it expects there to be a `.sheet.json` file with the same name as the sprite sheet.
 * This JSON file should contain instructions on how the sheet is laid out, including frame sizes, offsets, number of frames, rows, columns, etc.
 */
export class ImageSheetSpriteSource extends FileSystemSpriteSource {
    async read(): Promise<SpriteData> {
        // Get our instructions
        const ins = this.setDefaults(await this.getInstructions());

        // Get our base sheet
        const image = new ImageSpriteSource(this.path);
        const sheet = await Jimp.read((await image.read()).images[0].data);
        
        // Slice out each frame from the sheet
        const frames: Jimp[] = [];
        for (let f = 0; f < ins.frames; f++) {
            const newFrame = sheet.clone();
            const loc = this.locate(f, ins);
            newFrame.crop(loc.x, loc.y, ins.frameWidth, ins.frameHeight);
            frames.push(newFrame);
        }

        // Return
        return {
            name: this.name,
            images: await Promise.all(frames.map(async (jimp) => {
                return {
                    data: await jimp.getBufferAsync(Jimp.MIME_PNG),
                }
            })),
        };
    }

    /** Returns the instructions for obtaining individual frames out of the full-scale image */
    async getInstructions(): Promise<SpriteSheetInstructions> {
        const jsonPath = path.join(path.dirname(this.path), this.name + ".sheet.json");
        const json = JSON.parse(
            (await fs.readFile(
                jsonPath
            )).toString()
        );

        // Ensure our required properties are present
        const missing: (keyof SpriteSheetInstructions)[] = [];
        for (const req of REQUIRED_INSTRUCTIONS) {
            if (!json[req]) {
                missing.push(req);
            }
        }
        if (missing.length > 0) {
            throw new ImageSheetSpriteSourceError(`Missing required configuration for sheet ${this.path}: required JSON properties (${missing.join(", ")}) are missing`);
        }

        return json;
    }

    /** Determines defaults for a provided instructions object */
    setDefaults(instructions: SpriteSheetInstructions): Required<SpriteSheetInstructions> {
        return {
            ...instructions,
            offsetX: instructions.offsetX ?? 0,
            offsetY: instructions.offsetY ?? 0,
            separationX: instructions.separationX ?? 0,
            separationY: instructions.separationY ?? 0,
            frames: instructions.frames ?? (instructions.rows * instructions.columns),
            vertical: instructions.vertical ?? false,
        };
    }

    /** Returns the X and Y coordinates of the specified frame number, according to the instructions */
    locate(frame: number, ins: Required<SpriteSheetInstructions>): { x: number, y: number } {
        // Horizontal locating: count every column before going down rows
        // Vertical locating: count every row before going across columns
        // Both must honor offset, frame sizes, and separation
        return {
            x: ins.offsetX + ((ins.frameWidth + ins.separationX) * (
                ins.vertical ?
                    Math.floor(frame / ins.rows) :
                    frame % ins.columns
            )),
            y: ins.offsetY + ((ins.frameHeight + ins.separationY) * (
                ins.vertical ? 
                    frame % ins.rows :
                    Math.floor(frame / ins.columns)
            )),
        };
    }
}

/** Describes errors creating sprites from sprite sheets, or obtaining instructions for them */
export class ImageSheetSpriteSourceError extends Error {};