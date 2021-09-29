#!/usr/bin/env node

import fs from 'fs';
import jimp from 'jimp';
import { BitmapImage, GifUtil } from 'gifwrap';
import async from 'async';

/*
    NOTES FOR USING THIS SCRIPT
    (want to make this easier to read? VS code CTRL+Z turns on text wrap)

    This script will transform a directory of GIFs and PNGs into an image atlas and a chosen output of image locations in either JavaScript, TypeScript, or JSON.
    The only argument provided should be a config JSON file with the following fields:

        dir: The input directory. See below for more details.
        outputImage: The output image
        outputJS: If defined, output location data will be written as JavaScript to this file.
        outputTS: If defined, output location data will be written as annotated TypeScript to this file.
        outputJSON: If defined, output location data will be written as JSON to this file.
        atlasWidth: Width, in pixels, of the atlas. Should be a power of 2. Make sure it is large enough to contain all the images of all your gifs. If the atlas is too small, it will throw an error.
        atlasHeight: Height, in pixels, of the atlas. Ditto.
        separationW: Number of pixels to separate each sprite from one another. This is used to check which locations are occupied or not. This should be the same as the width of your smallest sprite to conserve the most space, but larger numbers compile faster. A number like 16 is usually good and won't take too long. Defaults to 16.
        separationH: Ditto. For best results, set it to the same as W. Defaults to 16.
        transparent: An object with "red" "green" and "blue" properties, set each to RGB values from 0 to 255. All colors in your gifs that match this become transparent when compiled in the atlas, and when they appear in your game. Defaults to black (0, 0, 0)

    If no argument, the script will default to using "./supersprite.json" as config. If not present, there will be an error.

    FILE INPUTS
    There are three ways you can input files, depending on their location in the main sprite folder.
    1. Every GIF file found in the root folder and immediate child folders is compiled into its own, individual sprite
    2. Every PNG file found in the root folder is compiled into a single-image sprite.
    3. Every immediate child folder with PNGs in it is compiled into a sprite, all using the name of the folder.
        - The images are read from the folder and placed in order in the sprite according to their order in the filesystem, e.g. alphabetically.
        - GIFs within folders still compile into their own sprites, even if there are PNGs present in that folder.
        - If no PNGs are in a folder, no sprite will be created for it.
    All other file types are ignored.

    Because gifs don't support transparency, all GIFs must have a "background color" as specified in the config file. This color has no effect on loading PNGs.
    Typically you want this to be black but any color would work. The specified color becomes transparent on all input images, and all inputs should have the same transparent color.

    Each sprite may also be given origin coordinates. At the end of the filename or PNG folder, place an underscore and a number to indicate both X and Y origin offsets when drawing.
        For example: "mySprite_12_16.png" would have an origin of X 12 and Y 16.
        Origins can be negative as well. Example: "anotherSprite_-8_0.png" has an origin of X -8 and Y 0.

    OUTPUTS
    The main output is your atlas image, obviously.
    You have three choices as for your other form of output: JavaScript, TypeScript, or JSON.
        JavaScript output is simply a .js file that exports an object containing all the image location data.
        TypeScript output (reccommended) is a .ts file that exports an object containing all the image location data, except it also defines all the properties (AND SPRITE NAMES!) so they can be used in autocomplete.
            Just make sure when using TypeScript to recompile your atlas frequently so all your sprites show up when you're writing code.
        JSON output is just a JSON file with the image location data, like JavaScript.

    SPRITE LOCATION DATA
    Regardless of our output format (JS, TS, or JSON) your output object will have keys for each sprite file compiled into the atlas. The name of each sprite's file (excluding origin coordinates if provided, and excluding the file extension) becomes the name of the sprite property used to refer to this sprite. This property is what must be provided by supersprite's draw functions. Each sprite has the following properties:
        width (of the image)
        height
        originX (as provided in the filename)
        originY (likewise)
        images: an array of sprite images, each with the following properties
            x: X coordinate of this image on the atlas
            y: Y coordinate of this imag eon the atlas
            t: a pre-calculated nine-index 3D texture matrix. This is stored with the sprite because it must be provided to the shader in order to slice out this image (and only this image) from the texture when it's to be drawn.
                Note: It's precalculated because it relies on matrix multiplication (which is a horrendous abomination in itself) which would be real slow to calculate at runtime, and this data (texture location) doesn't need to change except for when the atlas gets recompiled.
                You'll notice that if you recompile your atlas without also reloading your sprite data, every sprite will get all jumbled. This is because if your texture matrices don't match the images, you're effectively drawing random splotches from your atlas instead of specific images.

    Happy game-making! -Spencer
*/

const config = JSON.parse(fs.readFileSync(process.argv[2] || './supersprite.json'));
const sepW = config.separationW || 16;
const sepH = config.separationH || 16;
if (!config.outputJS && !config.outputTS && !config.outputJSON) {
    throw new Error(`You must define at least one of outputJS, outputTS, or outputJSON in your config file.`);
}

let startTime = Date.now();
/*fsWalk(path.resolve(config.dir),(err, entries) => {
    if (err) {
        throw err;
    }

    const tasks = [];
    for (let c = 0; c < entries.length; c++) {
        const file = entries[c];
        if (file.name.toLowerCase().endsWith('.png')) {
            // Load singular PNG as one sprite
            tasks.push((callback) => {
                jimp.read(file.path).then((image) => {
                    callback(null, {
                        spriteName: file.name.replace(/\.png/i,''),
                        width: image.getWidth(),
                        height: image.getHeight(),
                        images: [ image ],
                    });
                }).catch((err) => {
                    callback(err);
                });
            });
        } else if (file.name.toLowerCase().endsWith('.gif')) {
            // Load a GIF as an animated sprite
            tasks.push((callback) => {
                readGif(callback,file.path,file.name);
            });
        }
    }

    async.parallel(tasks,compileAtlas);
});*/

const tasks = [];
const directory = fs.opendirSync(config.dir);
let dirent = directory.readSync();
while (dirent !== null) {
    if (dirent.isDirectory()) {
        // Read inner directory
        const innerDirectory = fs.opendirSync(`${config.dir}\\${dirent.name}`);
        let innerDirent = innerDirectory.readSync();
        const filepaths = [];
        while (innerDirent !== null) {
            if (innerDirent.isFile()) {
                if (innerDirent.name.toLowerCase().endsWith('.gif')) {
                    // Read this GIF as its own sprite
                    let currentName = innerDirent.name, currentPath = `${config.dir}\\${dirent.name}\\${innerDirent.name}`;
                    tasks.push((callback) => {
                        readGif(callback,currentPath,currentName);
                    });
                } else if (innerDirent.name.toLowerCase().endsWith('.png')) {
                    // Read this PNG as one image of a sprite for this folder - add to our paths
                    filepaths.push(`${config.dir}\\${dirent.name}\\${innerDirent.name}`);
                }
            }
            innerDirent = innerDirectory.readSync();
        }
        innerDirectory.closeSync();

        // If we found PNGs from the inner directory, read them as a sprite
        if (filepaths.length > 0) {
            let currentName = dirent.name;
            tasks.push((callback) => {
                readPNGs(callback,filepaths,currentName);
            });
        }
    } else if (dirent.isFile()) {
        if (dirent.name.toLowerCase().endsWith('.gif')) {
            // Read this gif from top-level directory
            let currentName = dirent.name;
            tasks.push((callback) => {
                readGif(callback,`${config.dir}\\${currentName}`,currentName);
            });
        } else if (dirent.name.toLowerCase().endsWith('.png')) {
            // Read png for a single-image sprite
            let currentName = dirent.name;
            tasks.push((callback) => {
                readPNGs(callback,[`${config.dir}\\${currentName}`],currentName);
            });
        }
    }
    dirent = directory.readSync();
}
directory.closeSync();
async.parallel(tasks,compileAtlas);

function readGif(callback,filepath,name) {
    GifUtil.read(filepath).then((gif) => {
        const tasks = [];
        let lastFrame = null;

        // Make a new jimp for each frame
        for (let f = 0; f < gif.frames.length; f++) {
            tasks.push((callback) => {
                const frame = gif.frames[f];
                if (frame.disposalMethod !== 1) {
                    console.warn(`Unexpected disposal method ${frame.disposalMethod} in frame ${f} of ${name}!`);
                }

                frame.reframe(-frame.xOffset, -frame.yOffset, gif.width, gif.height, 0x000000);

                const jimpImage = new jimp(1,1,0);
                jimpImage.bitmap = frame.bitmap;
                if (!lastFrame) {
                    // Begin on our first frame as just one image, no compositing
                    lastFrame = new jimp(1,1,0);
                    lastFrame.bitmap = (new BitmapImage(frame)).bitmap;
                    callback(null, jimpImage);
                } else {
                    // Composite each image after the first, on top of the preceeding image - so the changes stack properly between gif frames
                    lastFrame.composite(jimpImage,0,0);
                    callback(null, lastFrame.clone()); // Clone image, so async isn't returning pointers to the same image every iteration
                }
            });
        }

        // I think this has to be in series. Doing parallel seemed to work but I don't see why it would always be in order that way... hm.
        async.series(tasks,(err, imageArray) => {
            if (err) {
                console.error(`Failed to load all images of sprite ${name}!`);
                callback(err);
            } else {
                for (let i = 0; i < imageArray.length; i++) {
                    imageArray[i].scan(0,0,gif.width,gif.height,function(x, y, idx) {
                        // Make colors matching our remove color transparent, as gifs don't support transparency
                        if (this.bitmap.data[idx] === (config.transparent.red || 0)
                         && this.bitmap.data[idx+1] === (config.transparent.green || 0)
                         && this.bitmap.data[idx+2] === (config.transparent.blue || 0)) {
                            this.bitmap.data[idx+3] = 0;    
                        }
                    }.bind(imageArray[i]));
                }

                callback(null, {
                    spriteName: name.replace(/\.gif/i,''),
                    width: gif.width,
                    height: gif.height,
                    images: imageArray,
                });
            }
        });
    }).catch(callback);
}

function readPNGs(callback,filepaths,name) {
    const tasks = [];
    let spriteWidth = 0, spriteHeight = 0;
    for (let f = 0; f < filepaths.length; f++) {
        const filepath = filepaths[f];
        // Load a new jimp for each frame
        tasks.push((callback) => {
            jimp.read(filepath,(err, image) => {
                if (err) {
                    console.error(`Failed to read image ${f} of sprite ${name}!`);
                    callback(err);
                } else {
                    if (image.getWidth() > spriteWidth) {
                        spriteWidth = image.getWidth();
                    }
                    if (image.getHeight() > spriteHeight) {
                        spriteHeight = image.getHeight();
                    }
                    callback(null,image);
                }
            });
        });
    }

    // Loads images in order
    async.series(tasks,(err, imageArray) => {
        if (err) {
            console.error(`Failed to load all images of sprite ${name}!`);
            callback(err);
        } else {
            callback(null, {
                spriteName: name.replace(/\.png/i,''),
                width: spriteWidth,
                height: spriteHeight,
                images: imageArray,
            });
        }
    });
}

function compileAtlas(err, spriteArray) {
    if (err) { throw err; }
    console.log(`Found ${spriteArray.length} sprites in ${Date.now()-startTime}ms.`);
    startTime = Date.now();

    spriteArray.sort((spr1, spr2) => { // Sort largest to smallest, so largest sprites get placed first
        return ((spr2.width * spr2.height) - (spr1.width * spr1.height));
    });

    new jimp(config.atlasWidth, config.atlasHeight, (err, image) => {
        if (err) { throw err; }

        // Find an open place for each image of each sprite
        let placeX = 0, placeY = 0;
        const outputArray = [];

        // Grid of separation determines open or full spaces
        const occupied = new Array(Math.ceil(config.atlasWidth/sepW));
        for (let o = 0; o < occupied.length; o++) {
            occupied[o] = new Array(Math.ceil(config.atlasHeight/sepH));
            occupied[o].fill(false);
        }

        // For each sprite...
        for (let s = 0; s < spriteArray.length; s++) {
            // Get origin X and Y from sprtie's name
            let originX = 0, originY = 0;
            const matches = spriteArray[s].spriteName.match(/_-?[0-9]+/g);
            if (matches !== null && matches.length === 2) {
                originX = Number(matches[0].slice(1));
                originY = Number(matches[1].slice(1));
                if (isNaN(originX) || isNaN(originY)) {
                    throw new Error(`Sprite "${spriteArray[s].spriteName}" has invalid origin coordinates!`);
                } else {
                    // Cut the matches off our regular sprite name
                    spriteArray[s].spriteName = spriteArray[s].spriteName.slice(0, spriteArray[s].spriteName.length - matches[0].length - matches[1].length);
                }
            }

            // Prepare our output object
            const spriteOutput = {
                n: spriteArray[s].spriteName,
                w: spriteArray[s].width,
                h: spriteArray[s].height,
                x: originX,
                y: originY,
                i: [],
            }

            // For each image...
            for (let i = 0; i < spriteArray[s].images.length; i++) {
                // Cycle positions
                while (checkOccupied(occupied,spriteOutput,placeX,placeY)) {
                    placeX += sepW;
                    if (placeX >= config.atlasWidth) {
                        // On to the next row
                        placeX = 0;
                        placeY += sepH;
                        if (placeY >= config.atlasHeight) {
                            // Overflow!
                            throw new Error(`Atlas overflow! Increase the size of the atlas and try again.`);
                        }
                    }
                }

                // If we got here, placeX and placeY are set to an open location
                const img = spriteArray[s].images[i];
                image.composite(img,placeX,placeY);
                setOccupied(occupied,spriteOutput,placeX,placeY);

                // Generate texture matrix for this image
                let matrix = [ 1, 0, 0, 0, 1, 0, 0, 0, 1];
                matrix = multiplyMatrices(matrix, [1, 0, 0, 0, 1, 0, placeX/config.atlasWidth, placeY/config.atlasHeight, 1]); // translation
                matrix = multiplyMatrices(matrix, [spriteArray[s].width/config.atlasWidth, 0, 0, 0, spriteArray[s].height/config.atlasHeight, 0, 0, 0, 1]); // scaling
                spriteOutput.i.push({
                    x: placeX, y: placeY, t: matrix
                });

                // And, onto the next image
            }

            // Done with the images of this sprite, record it
            outputArray.push(spriteOutput);
        }

        // Done with all sprites!

        image.write(config.outputImage);
        console.log(`Atlas compiled in ${Date.now()-startTime}ms`);
        if (config.outputJS) {
            outputJavaScript(outputArray);
        }
        if (config.outputTS) {
            outputTypeScript(outputArray);
        }
        if (config.outputJSON) {
            outputJSON(outputArray);
        }
    });
}

function checkOccupied(occupied,spr,x,y) {
    if (spr.w <= sepW && spr.h <= sepH) {
        // Smaller than a cell, so just return this one cell
        return (occupied[x/sepW][y/sepH]);
    }

    if ((x + spr.w) > config.atlasWidth || (y + spr.h) > config.atlasHeight) {
        // Image overflows the atlas size!
        return true;
    }

    // Otherwise, check every space we'd occupy based on our size
    for (let xx = x/sepW; xx < (x+spr.w)/sepW; xx++) {
        for (let yy = y/sepH; yy < (y+spr.h)/sepH; yy++) {
            if (occupied[xx][yy]) {
                return (true);
            }
        }
    }

    // If we got here, means current space is open
    return (false);
}

function setOccupied(occupied,spr,x,y) {
    if (spr.w <= sepW && spr.h <= sepH) {
        // Smaller than a cell, so just set this one cell
        occupied[x/sepW][y/sepH] = true;
    } else {
        // Otherwise, fill every spot we occupy
        for (let xx = x/sepW; xx < (x+spr.w)/sepW; xx++) {
            for (let yy = y/sepH; yy < (y+spr.h)/sepH; yy++) {
                occupied[xx][yy] = true;
            }
        }
    }
}

function multiplyMatrices(a, b) { // 3x3 for webgl
    // yuck I hate this
    const a00 = a[0 * 3 + 0];
    const a01 = a[0 * 3 + 1];
    const a02 = a[0 * 3 + 2];
    const a10 = a[1 * 3 + 0];
    const a11 = a[1 * 3 + 1];
    const a12 = a[1 * 3 + 2];
    const a20 = a[2 * 3 + 0];
    const a21 = a[2 * 3 + 1];
    const a22 = a[2 * 3 + 2];

    const b00 = b[0 * 3 + 0];
    const b01 = b[0 * 3 + 1];
    const b02 = b[0 * 3 + 2];
    const b10 = b[1 * 3 + 0];
    const b11 = b[1 * 3 + 1];
    const b12 = b[1 * 3 + 2];
    const b20 = b[2 * 3 + 0];
    const b21 = b[2 * 3 + 1];
    const b22 = b[2 * 3 + 2];
 
    return [
      b00 * a00 + b01 * a10 + b02 * a20,
      b00 * a01 + b01 * a11 + b02 * a21,
      b00 * a02 + b01 * a12 + b02 * a22,
      b10 * a00 + b11 * a10 + b12 * a20,
      b10 * a01 + b11 * a11 + b12 * a21,
      b10 * a02 + b11 * a12 + b12 * a22,
      b20 * a00 + b21 * a10 + b22 * a20,
      b20 * a01 + b21 * a11 + b22 * a21,
      b20 * a02 + b21 * a12 + b22 * a22,
    ];
}

function convertOutput(outputArray) {
    const obj = {};
    for (let o = 0; o < outputArray.length; o++) {
        const s = outputArray[o];
        obj[s.n] = {
            width: s.w,
            height: s.h,
            originX: s.x,
            originY: s.y,
            images: s.i,
        }
    }
    return obj;
}

function outputJavaScript(outputArray) {
    fs.writeFileSync(config.outputJS,`export default ${JSON.stringify(convertOutput(outputArray))};`);
    console.log(`Output JavaScript to ${config.outputJS}`);
}

function outputTypeScript(outputArray) {
    // I'm so sorry you're reading this
    let names = '', entries = '';
    for (let o = 0; o < outputArray.length; o++) {
        names += `  ${outputArray[o].n} : Sprite;\n`;
        let imageEntries = '[';
        for (let i = 0; i < outputArray[o].i.length; i++) {
            imageEntries += `{ x: ${outputArray[o].i[i].x}, y: ${outputArray[o].i[i].y}, t: [${outputArray[o].i[i].t}] }, `;
        }
        imageEntries += ']';
        entries += `  ${outputArray[o].n}: { width: ${outputArray[o].w}, height: ${outputArray[o].h}, originX: ${outputArray[o].x}, originY: ${outputArray[o].y}, images: ${imageEntries}},\n`;
    }
    const code = `// Generated by supersprite ${(new Date()).toLocaleString()} - script/atlas.js
// These Sprite and SpriteImage types identical to those exported by supersprite
const spr : {\n${names}} = {\n${entries}};
interface Sprite {
    width: number;
    height: number;
    originX: number;
    originY: number;
    images: SpriteImage[];
}

interface SpriteImage {
    x: number;
    y: number;
    /** A precomputed 3x3 matrix, used to slice this sprite image out of the texture atlas. */
    t: [number, number, number, number, number, number, number, number, number];
}
export default spr;`;
    fs.writeFileSync(config.outputTS,code);
    console.log(`Output TypeScript to ${config.outputTS}`);
}

function outputJSON(outputArray) {
    fs.writeFileSync(config.outputJSON,JSON.stringify(convertOutput(outputArray)));
    console.log(`Output JSON to ${config.outputJSON}`);
}