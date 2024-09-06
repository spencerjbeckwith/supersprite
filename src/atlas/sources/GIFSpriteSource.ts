import { SpriteData } from "../../types";
import { FileSystemSpriteSource } from "./FileSystemSpriteSource";
import { GifUtil } from "gifwrap";
import Jimp from "jimp";

/** Reads GIFs as sprites */
export class GIFSpriteSource extends FileSystemSpriteSource {
    // Arg possible here for dependency injection
    async read(): Promise<SpriteData> {
        const gif = await GifUtil.read(this.path);
        const images: Jimp[] = [];

        // Make a new jimp for each frame
        for (let f = 0; f < gif.frames.length; f++) {
            let lastImage = images.length > 0 ? images[images.length - 1].clone() : null;
            const frame = gif.frames[f];
            switch (frame.disposalMethod) {
                case (1): {
                    // Layer our changes sequentially, one frame onto the next
                    frame.reframe(-frame.xOffset, -frame.yOffset, gif.width, gif.height, 0);
                    const newImage = new Jimp(1, 1, 0);
                    newImage.bitmap = frame.bitmap;
                    if (!lastImage) {
                        // Begin on the first frame as just one image, with no compositing
                        images.push(newImage);
                    } else {
                        // For subsequent frames, composite each image on top of the preceeding image to "layer" changes in each frame
                        lastImage.composite(newImage, 0, 0);
                        images.push(lastImage);
                    }
                    break;
                }
                case (2): {
                    // Create new bitmaps for each new frame (no layering)
                    const newImage = new Jimp(1, 1, 0);
                    newImage.bitmap = frame.bitmap;
                    images.push(newImage);
                    break;
                }
                // Note that as this library is used with more varieties of gifs, it is entirely possible
                // that there are valid disposal methods that aren't addressed here
                default: {
                    throw new GIFSpriteSourceError(`Unexpected disposal method ${frame.disposalMethod} for frame ${f} of ${this.path}! If this is a valid GIF, please consider contributing to handle this disposal method.`);
                }
            }
        }

        // Return the buffer data from each frame
        const buffers = await Promise.all(images.map((jimp) => jimp.getBufferAsync("image/png")));
        return {
            name: this.name,
            images: buffers.map((buffer) => ({
                data: buffer,
            })),
        };
    }
}

/** Describes issues when loading a GIF as a sprite source */
export class GIFSpriteSourceError extends Error {};