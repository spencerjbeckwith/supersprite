# supersprite

supersprite is a sprite drawing engine for 2D browser games meant to simplify the process of setting up WebGL2. supersprite provides a fast, powerful, and intuitive drawing system that is made possible by WebGL, while still keeping the simplicity of singular and abstracted draw calls.

```javascript
import { Core } from 'supersprite';
import spr from "./map.json";

const core = new Core({
    atlas: {
        url: "./atlas.png",
    },
    presenter: {
        baseWidth: 300,
        baseHeight: 200,
    },
});

function main() {
    core.beginRender();

    core.draw.sprite(spr.helloWorld, 0, 0, 0);
    // ...or one of many other draw methods

    core.endRender();
    requestAnimationFrame(main);
}

main();
```

## Capabilities 

supersprite can:

- Draw sprites as still images or animations
- Draw primitive shapes such as lines, rectangles, or circles
- Draw sprites and text to a 2D canvas context
- Blend sprites to different colors
- Transform sprites by applying scaling, rotation, translation, or all of the above
- Contort sprites by changing vertex/texture coordinates dynamically
- Compile a variety of image formats into a texture atlas via `npx supersprite`
- Be bundled for web browsers or for Electron

supersprite itself is not a game engine - it doesn't handle any game objects, sounds, input, or networking.

## Usage

In order to use supersprite you must also be using a tool such as [rollup](https://rollupjs.org/guide/en/) or [webpack](https://v4.webpack.js.org/) that can pull in code from node dependencies and run it in the browser. See the `examples` directory for example configurations.

> ```npm install supersprite```

In order to get started, you must instantiate a `Core` instance. To use it, all you have to do is call `beginRender()` and `endRender()` as seen in the example above. All draw calls must be placed between those two functions.

### Options

```javascript
const core = new Core({
    atlas: {
        // Where to load the atlas from
        // Typically this should be the image output from the atlas CLI tool (-a option)
        url: "..."
        paramters: {
            // Can set parameters to affect the WebGL texture for the atlas
        }
    },
    // Atlas may also be set to null to disable sprites.
    // In this case, only primitives and text may be drawn.

    // Controls how the game gets presented to the screen
    presenter: {
        baseWidth: 600,
        baseHeight: 240,
        responsive: "stretch",
        scalePerfecty: true,
    },
    
    drawDefaults: {
        hAlign: "left",
        fontSize: 20,
        // ... many  more options available
    }
});
```

When drawing sprites, you must import the atlas map. This JSON file is created when compiling a texture atlas, and contains information about where each image of every sprite is located. This file is indicated by the CLI's `-m` option.

Note that extra configuration is necessary to load JSON files depending on your bundler. The `resolveJsonModule` tsconfig option must also be set if using TypeScript.

```json
{
    "guy": {
        "width": 16,
        "height": 16,
        "images": [
            {
                "x": 0,
                "y": 0,
                "t": [ /* pre-computed texture matrix */ ],
            }
        ]
    },
    // More sprites here
}
```

```javascript
import spr from "./map.json"; // You can name this import, as well as the map JSON, anything you want.

// Initialize core here...

function main() {
    core.beginRender();

    core.draw.sprite(spr.guy, 0, 0, 0);

    core.endRender();
    requestAnimationFrame(main);
}

main();
```

The names of each sprite are determined by their *file* or *folder* name when the atlas is compiled. This is meant to be more useful for Intellisense/autocomplete versus using the map as an `any` type.

### Presenter Options

The `Presenter` is a supersprite class that manages the HTML canvases and their rendering contexts. The `presenter` options must be defined within the `Core` configuration object.

Normally, supersprite will create its own canvases of `baseWidth` and `baseHeight` size and style them directly on top of one another. Specific canvas objects may be provided in the `Presenter` options to override this.

Because supersprite is intended for low-res pixel games, the `responsiveness` and `scalePerfectly` options control the behavior of the game area within the provided window space.

### Draw Defaults

The `drawDefaults` option can be used to set default behavior for draw methods. It can be very tedious to define the same options many times on draw methods, so `drawDefaults` may override supersprite's own defaults in one convenient, "global" way.

## Drawing Methods

- `core.draw.line`: Draws a line between two points.
- `core.draw.rect`: Draws a filled rectangle between two points.
- `core.draw.circle`: Draws a circle at a position.
- `core.draw.primitive`: Draws a shape with custom vertices.
- `core.draw.sprite`: Draw an image from a sprite. May blended or transformed.
- `core.draw.spriteAnim`: Draws an animated sprite. May be blended or transformed.
- `core.draw.spriteSpecial`: Draws an image from a sprite using custom vertices and texture coordinates.
- `core.draw.spriteSpecialAnim`: Draws an animated sprite using custom vertices and texture coordinates.
- `core.draw.spriteCtx`: Draws an image from a sprite on the 2D context. May only be scaled, not blended or otherwise transformed.
- `core.draw.spriteCtxAnim`: Draws an animated sprite on the 2D context. May only be scaled, not blended or otherwise transformed.
- `core.draw.text`: Draws text on the 2D context.
- `core.draw.textWrap`: Draws text on the 2D context, wrapping if the text is too long.

All draw methods have type hints/Intellisense documentation.

## Compiling an Atlas

Running `npx supersprite` will crawl a directory for image files to compile into the atlas, obeying the following rules:

- All PNG and JPG images are processed as one-frame sprites.
- All GIF images are processed with one frame per GIF frame. Note that GIF timing is not followed.
- All PNG and JPG images ending with a `.sheet.png`, `.sheet.jpg`, or `.sheet.jpeg` extension are read as *sprite sheets*. In order for this to function, *all sprite sheets must have an accompanying .json file containing information about how the sheet is laid out.*
- All directories are read, at the first level, for any PNG and JPG images. If any are found, each file is read *in alphabetical order* forming a multi-frame sprite.
- Sprite names are set according to the filename, or for directories, the directory name.

All found images will then be added to the atlas. The result is two output files:

1. The atlas image. This image must be loaded by your game to draw textures - typically this would be done by setting `atlas.url` config option.

2. The JSON map. This file can be either loaded or bundled with your game, but it is essential to locate sprites within the atlas.

For more command-line options, run `npx supersprite -h`.

### Sprite Sheet Config

All images ending with `.sheet.png`, `.sheet.jpg`, or `.sheet.jpeg` in the atlas directory are read as sprite sheets. An accompanying JSON file with the same name (except ending with `.json`) must be within the directory as well. This file must contain instructions on how to read the sprite.

```typescript
{
    // Minimum required for each sprite:
    frameWidth: number;
    frameHeight: number;
    rows: number;
    columns: number;

    // Total number of frames to read. Defaults to rows * columns
    frames?: number;

    // Top-left pixel where the sheet begins, defaults to 0, 0
    offsetX?: number;
    offsetY?: number;

    // Separation between images within the sheet. Defaults to 0
    separationX?: number
    separationY?: number;

    // If images should be read going down first, and then across,
    // or if they should be read going across, then down
    vertical?: boolean;
}
```

### Custom atlas compilation

The classes comprising the CLI may be subclassed for custom functionality.

- The `Gatherer` class is responsible for determing which sprites should be read. The default, `FileSystemGatherer`, crawls a local directory to find sprites. `FileSystemGatherer` also accepts a `sources` option, to which new file extensions will be read as a provided `SpriteSource`.
- The `SpriteSource` class indicates a sprite that should be loaded, and should return the sprite's data when `read()` is called.
- The `Compositor` class is responsible for placing all the located sprites into the atlas.

These classes may also be imported to run atlas compilation programatically, as opposed to part of a build step.

## What's new in V3

- Massive restructure/refactor, aimed to improve maintainability, readability, and performance
- Offloaded all transformation matrices into GLSL
- Simplified interfaces and functions
- Overhaul atlas tool to improve developer experience and extensibility
- Atlas tool can now read sprite sheets
- Atlas tool dynamically sizes atlas and no longer requires a config file
