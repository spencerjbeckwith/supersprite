import { SpriteData } from "../../types";
import { FileSystemSpriteSource } from "./FileSystemSpriteSource";
import fs from "fs/promises";
import Jimp from "jimp";

/**
 * Loads individual image files as one-frame sprites.
 * 
 * If the file is not an image (PNG, JPG, BMP, or TIFF), this will throw.
 */
export class ImageSpriteSource extends FileSystemSpriteSource {
    async read(): Promise<SpriteData> {
        const buffer = await fs.readFile(this.path);

        // Peek into the magic numbers for this file to ensure it is an image
        // https://en.wikipedia.org/wiki/List_of_file_signatures
        const validBytes: number[][] = [
            [0x89, 0x50, 0x4e, 0x47], // png
            [0xff, 0xd8, 0xff],       // jpg/jpeg
            [0x42, 0x4d],             // bmp
            [0x49, 0x49, 0x21, 0x00], // tiff, little-endian
            [0x4d, 0x4d, 0x00, 0x2a], // tiff, big-endian
        ];
        let validFormat = false;
        outer:
        for (const format of validBytes) {
            const check = buffer.subarray(0, format.length);
            for (let i = 0; i < format.length; i++) {
                if (check[i] !== format[i]) {
                    continue outer; // Not a match, try next combo
                }
            }
            // If we got here, we were a match
            validFormat = true;
            break outer;
        }

        if (!validFormat) {
            throw new ImageSpriteSourceError(`Sprite source ${this.path} is not a valid image!`);
        }

        const image = await Jimp.read(buffer);

        return {
            name: this.name,
            width: image.getWidth(),
            height: image.getHeight(),
            images: [{
                data: buffer,
            }],
        };
    }
}

/** Describes problems loading individual images */
export class ImageSpriteSourceError extends Error {};