# supersprite

supersprite is a sprite drawing engine for 2D browser games compatible with both JavaScript and TypeScript. It greatly simplifies the process of setting up your WebGL2 context, loading textures, compiling shaders, etc. when all you want to do is get some images on screen. As opposed to just using a 2D context and its `drawImage` method, supersprite provides a fast, powerful, and intuitive drawing system that is made possible by WebGL, while still keeping the simplicity of singular, self-contained draw calls.

I made this because I like to make a lot of 2D low-res pixel-art games, and the canvas 2D context just wasn't really doing it for me. I set up so many different projects using the same methods I figure I may as well make it an npm package to make my life a bit easier, and hopefully others can find it useful.

## [Live Example](https://beckwithweb.com/supersprite) - [Example Source](https://github.com/spencerjbeckwith/supersprite-example)

supersprite itself is not a game engine - it doesn't handle any game objects, sounds, input, or networking. It fits seamlessly into your animation loop and is accessed through a variety of draw methods, so you can focus more on your gameplay instead of the many headaches that come with using WebGL. supersprite also provides an atlas compilation utility, which will crawl a directory for GIF and PNG resources, place them on an atlas, and provide you with the data necessary to utilize that atlas with supersprite.

# Usage

As of right now, in order to use supersprite you must also be using a tool such as [rollup](https://rollupjs.org/guide/en/) that can pull in code from node dependencies and run it in the browser. This needs the [node-resolve](https://github.com/rollup/plugins/tree/master/packages/node-resolve) rollup plugin to include supersprite in your bundled game. If you are using TypeScript, you will also need the [typescript](https://github.com/rollup/plugins/tree/master/packages/typescript) rollup plugin. These will also require you to make `rollup.config.js` and `tsconfig.json` config files and set up your environment so that you can build your game into a singular script. You should also use another plugin such as [terser](https://www.npmjs.com/package/rollup-plugin-terser) to minify and obfuscate your final game.

> ```npm install supersprite```

```javascript
import { init, supersprite, draw, shader } from 'supersprite';

// Basic animation loop
function main() {
    supersprite.beginRender();

    // All draw calls will go here!

    supersprite.endRender();
    requestAnimationFrame(main);
}

init({
    // Options go here!
});

// Once init is done, "draw" and "shader" are defined. If you try to use either before calling init, you will get an error.

supersprite.loadTexture('your-atlas.png').then((atlasObject) => {
    supersprite.setAtlas(atlasObject); // This must be called before drawing!
    main();
}).catch(err => console.error);
```

It's pretty simple to get started. You will need your main animation loop, which must begin with a call to ```beginRender``` and end with a call to ```endRender``` which actually renders your stuff to the screen.

Before you begin your main loop, **supersprite must be initialized via the ```init``` method!** This method takes a variety of different options that give you fine control over the behavior of your canvas, contexts, and textures.

Then you will load your texture atlas, and since this loads asynchronously, **you must also call ```setAtlas``` before beginning your animation loop.** When these things are all done, you're ready to go!

# Methods

You must use all of the following methods at one point or another:

- `init()` must be called before any drawing can take place
- `supersprite.loadTexture()` returns a promise that loads your atlas texture
- `supersprite.setAtlas()` must be called with `loadTexture()`'s resolved promise object, in order to configure proper drawing, before any drawing can happen
- `supersprite.beginRender()` must be called at the start of your animation loop, in order to set up the framebuffer
- `supersprite.endRender()` must be called at the end of your animation loop, when you wish to render to the screen. This can also take arguments to transform or contort *the entire screen*.

# Sprites

Using sprites (from textures) adds a bit more complexity than just using primitives. First off, using textures requires you to **compile an atlas** of your textures. See below for more details. You technically can use supersprite without any textures, but that sort of defeats the purpose.

## Transformations

To transform a sprite when drawing, you must provide a **callback transformation function** which provides you a 2D matrix and expects you to return that same matrix with your transformations applied. For more details about 2D matrices I recommend checking out the awesome walkthrough at [WebGL Fundamentals](https://webglfundamentals.org/webgl/lessons/webgl-2d-matrices.html).

```javascript
function main() {
    supersprite.beginRender();

    draw.sprite(spr.example, 0, 100, 100,(matrix) => {
        return matrix.translate(1, 0); // Will translate the sprite one sprite-width to the right. (Note that translate is not by pixels, but by sprite factors!)
    });

    supersprite.endRender();
    requestAnimationFrame(main);
}
```

The real fun begins when you chain multiple transformations at once!
```javascript
draw.sprite(spr.example, 0, 100, 100, (mat) => mat.translate(1,0).scale(-1,1)); // Will translate the sprite to the right and then flip it horizontally - effectively mirroring it in-place.
```

Transformations occur around the **origin-point** of a sprite. By default, this is the top-left corner. When you provide a pixel coordinate to draw a sprite at, that sprite's origin is placed at those coordinates. You can change origins by changing the sprite asset's filename before you compile your atlas - see below. For example, you probably want rotations around the center of your sprite. So in this case, if your sprite is 32x24 pixels you'd probably set the origin to 16x12 - though of course, it depends. Translation and scaling also happens from the origin. It does get a little tricky sometimes, depending on how complicated you want your transformations to be.
```javascript
draw.sprite(spr.example, 0, 100, 100, (mat) => mat.rotate(Math.PI/4)); // Rotates the sprite 45 degrees counter-clockwise around its origin point.
```

Oh yeah, you can also *change* the origin point with a transformation!
```javascript
// Say the sprite's origin is in its top-left. This will move the origin to the center, rotate the sprite 45 degrees counter-clockwise, and move the origin back.
// End result, it makes it appear rotated from the center!
draw.sprite(spr.example, 0, 0, 0, m => m.translate(0.5,0.5).rotate(Math.PI/4).translate(-0.5, -0.5));
```

## Blending

The possibilities are virtually endless, but note that transformations are additive and *their order matters*. You can also blend a sprite with any color, say for example, when your player is hit you want them to turn red.
```javascript
// Blending, with no transformation - just skip over the transformation parameter.
draw.sprite(spr.example, 0, 100, 100, null, 0.9, 0.2, 0.25, 1); // Draws sprite example blended with a color (r = 0.9, g = 0.2, b = 0.25, a = 1)

// With transformations and blending:
draw.sprite(spr.example, 0, 100, 100, (matrix) => {
    return matrix.scale(2, 2);
}, 0.9, 0.5, 0.25, 1);
```

## Contortions
Contortions are when define your own set of vertices and texture coordinates to draw a sprite on screen. This gives you practically infinite control over how your images will appear, though it does get more complex. For drawing contortions, we have the ```draw.spriteSpecial``` method.

```javascript

// "positions" are the vertices of the sprite in clipspace. (0,0) as a position coordinate corresponds to the top-left of where the sprite would *normally* be drawn, and (1,1) indicates the bottom-right.
const positions = [
    // Triangle 1
    0.2, 0.2, // This will make the top-left corner appear "scrunched" in.
    0, 1,
    1, 1,

    // Triangle 2
    1, 1,
    1, 0,
    0.2, 0.2,
];

const UVs = [
    // Triangle 1
    0, 0,
    0, 1,
    1, 1,

    // Triangle 2
    1, 1,
    1, 0,
    0, 0,
];

draw.spriteSpecial(spr.example, 0, 100, 100, positions, UVs);

```

If your positions and UVs match exactly, *your texture will not appear contorted, but cut instead.* This can be useful if you want to make a sprite appear or disappear dynamically. Otherwise, the provided UVs will appear to stretch or compress the sprite according to the vertices and their positions.

Here are all available drawing methods, exposed via ```draw```:

```javascript
draw.line()                 // Draws a line
draw.rect()                 // Draws a solid rectangle
draw.circle()               // Draws a circle
draw.primitive()            // Draws any type of GL primitive
draw.sprite()               // Draws a sprite
draw.spriteSpeed()          // Animates a sprite
draw.spriteSpecial()        // Contorts a sprite
draw.spriteSpeedSpecial()   // Animates a contorted sprite
draw.spriteCtx()            // Draws a sprite, but on the 2D context instead of GL (no transformations or contortions)
draw.spriteSpeedCtx()       // Animates a 2D context sprite
draw.texture()              // Draws a texture that isn't part of the atlas
draw.text()                 // Draws text on the 2D context
draw.textWrap()             // Takes additional options that draw.Text()
```

## 2D Context

In addition to the WebGL context, supersprite creates a second canvas context (in boring old 2D) that is overlaid directly over the first canvas. This is the canvas where you'd want to draw text, HUD elements, or any other static things that shouldn't be affected by the shader. You still draw on it via the `draw` object, but these always will appear ABOVE sprites and primitives due to the way the canvases are placed in the DOM.

```javascript
// Draws text on the 2D context - because rendering text in GL sounds kinda masochistic
draw.text(x,y,text,options); // Where "options" contains settings for align, font, color, shadows, separation, etc...

// This will allow the text to wrap, should it exceed width
draw.textWrap(x,y,text,width,options);

// Want to draw a sprite in your HUD? No problem!
draw.spriteCtx(spr.example,2,100,100);
draw.spriteSpeedCtx(spr.example,0.1,200,200);

// You can also scale images you're drawing onto this context
draw.spriteCtx(spr.example,2,100,100,5,4);
```
---

So how do you actually *use* supersprite? Well, it's pretty simple. Assuming you want nothing else on your game's webpage (which should probably be the case most of the time?), you just want an HTML file like this:

```HTML
<!DOCTYPE html>
<html>
    <body>
        <!--This is your rollup build script.
            The init() method creates both of your canvases and puts them into the body automatically - no need to worry about their styling or placement.
            Module type is optional, and prevents your game from being exposed on the console-->
        <script type="module" src='build/main.js'></script>
    </body>
</html>
```

# Compiling an Atlas

You might be wondering, how do I tell supersprite what sprites I want to use? Luckily it isn't that complicated. In order to draw sprites using WebGL, they must be part of a texture. To make things performant, we can stitch multiple images into the same texture, called the "atlas" - and supersprite contains a utility to compile sprite resources into an atlas for you which also spits out the data you need in order to use them. First, you'll want to create a config file `supersprite.json`:

```javascript
{
    // Folder containing every sprite you want to use in-game
    "dir": "assets/sprites",

    // The output image - should be loaded by your initialize function.
    "outputImage": "./atlas.png",

    // If defined, will output sprite data as TypeScript allowing you to use auto-complete on your own sprite names (how cool is that!?)
    "outputTS": "./atlas.ts",

    // If defined, will output sprite data as a default JavaScript export.
    "outputJS": "./atlas.js",

    // If defined, will output sprite data as JSON in case you want to request it from the server rather than build it into your project.
    "outputJSON": "./atlas.json",

    // In pixels - should be powers of 2
    "atlasWidth": 2048,
    "atlasHeight": 2048,

    // How far apart to place sprites on the sheet - this is used to control what spots are taken or not.
    // Larger values compile faster but leave more empty space, while smaller values do the opposite.
    "separationW": 16,
    "separationH": 16,

    // The color to use in the input GIFs to mark as transparent - as GIFs don't support transparency. This has no affect on PNGs.
    "transparent": {
        "red": 0,
        "green": 0,
        "blue": 0
    }
}
```

The most important option is `dir`, which should be a directory of your sprite assets. ***As of right now, supersprite can only compile GIFs and PNGs into your atlas.*** The following rules are followed when searching for images to compile:

1. Every GIF file found in the root folder and immediate child folders is compiled into its own, individual sprite.
2. Every PNG file found in the root folder is compiled into a single-image sprite.
3. Every immediate child folder with PNG files in it compiles them all into one sprite, under the name of the folder.
    - The PNGs that make the frames of the sprite are ordered according to their order in the filesystem, e.g. alphabetically.
    - GIFs within folders still compile into their own sprites, even if there are PNGs present in that folder. The GIF will use its filename instead of the folder name, while the PNGs will use the folder name.
    - If no PNGs are in a folder, no sprite will be created for it, though GIFs in that folder will still be detected.

All other file types are currently ignored. As of now, there is no way to load a sprite strip without converting it to a GIF or a folder of PNG images.

Example directory:
- `sprites`
    - `pngFolder`
        - `frame0.png`
        - `frame1.png`
        - `frame2.png`
    - `pngFolder2_8_8`
        - `0.png`
        - `1.png`
        - `gifSprite_2_2.gif`
    - `gifFolder`
        - `foo.gif`
        - `bar.gif`
    - `singularImage.png`
    - `gif1.gif`
    - `gif2.gif`

Will output the following sprites:
- `pngFolder`
- `pngFolder2` (with an origin of 8,8)
- `gifSprite` (with an origin of 2,2)
- `foo`
- `bar`
- `singularImage`
- `gif1`
- `gif2`

Regardless of whether a sprite was originally GIF or PNG makes no difference in how it is used from supersprite.

**The name of your GIF file, PNG file, or PNG folder becomes the name of your sprite when you use it in code.** So, if your GIF is named `mySprite.gif` you'll access it with supersprite as `spr.mySprite`.

**To set an origin point for your sprite, place coordinates *at the end of your filename or folder name, separated with underscores.***. If you want `mySprite.gif` to have an origin of (24,8) you would rename it to `mySprite_24_8.gif` but *you would still access it in code as `spr.mySprite`.* Your origins can also be negative: `mySprite_-20_-40.gif`. If no origin is defined, it defaults to (0,0) for every sprite. This also applies to folders with PNGs: a PNG folder with an origin could be `mySprite_20_20`, for example.

Make sure all your sprite names are unique or they'll overwrite each other in your output!

In order to compile your atlas, simply run `npx supersprite` from your project root. You can also specify a different config file than the default `supersprite.json` as a third argument if you want. Make sure you recompile the atlas and rebuild your game (if using `outputJS` or `outputTS`) each time you add a new sprite resource!

# The View and Display

An important distinction to make when using supersprite is that of the `view` and the `display`. The view is defined as the actual game area, while the display is the canvas on screen. They don't necessarily have to be the same size - and in some cases, you wouldn't want that! The `init()` function includes several options that can control the way the canvas takes up screen-space and makes it user-responsive, as well as the default size for the view and display. One of these is the `responsive` property.

`responsive` can have three values:
- `"static"` will keep the view and display at the same size as when they are created, regardless of if the window changes.
- `"stretch"` will expand the view and display to cover as much of the window as possible, while keeping the contents of the canvas at a constant size.
    - If `maintainAspectRatio` is true, supersprite will create bars at either the top/bottom or the sides of the screen to maintain the same aspect ratio as when the view was initially created. If it is false, the entire window will be filled.
    - Nothing on the canvases will appear to stretch, but increasing the size of the window gives the canvas more space. Drawings stay the same size.
- `"scale"` will expand the view and display to cover as much of the window as possible, while resizing the contents of the canvas to fit.
    - If `maintainAspectRatio` is true, supersprite will create bars at either the top/bottom or the sides of the screen to maintain the same aspect ratio as when the view was initially created. Items will scale up, but not change shape. If this is false, the entire window will be filled and drawings will scale up and change shape.
    - If `scalePerfectly` and `maintainAspectRatio` are both true, the view will only scale up to integers, such as 1x, 2x, 3x, 4x, etc. This is ideal for pixel-perfect situations where you do not want any distortion whatsoever, but want to upsize a small game.
    - The view will not scale smaller than its initial size.

The value you set for `responsive` depends on the needs of your game. When using `scale` and/or `maintainAspectRatio` the initial view size/aspect ratio is set by your canvas size.

Here's an example configuration for a small-scale, pixel-perfect game:

```javascript
init({
    responsive: 'scale',
    maintainAspectRatio: true,
    scalePerfectly: true,
    viewWidth: 320,
    viewHeight: 240,
    contextImageSmoothing: false,
    glOptions: {
        antialias: true,
    },
    gameTextureParameters: {
        textureMagFilter: 'nearest',
        textureMinFilter: 'nearest',
    }
});

// You must also set the proper mips for your texture!
supersprite.loadTexture('atlas.png',{
    textureMagFilter: 'nearest',
    textureMinFilter: 'nearest',
}).then((obj) => {
    supersprite.setAtlas(obj);
    main();
}).catch(err => console.error)
```

# Using Your Own Shaders

supersprite only uses one shader, referred to as the "main" shader or simply "the shader". It is compatible with all default drawing abilities implemented in supersprite, but I encourage you to extend or replace it with your own shader to meet the needs of your game. To do so, set the `mainShaderOptions` property in your call to `init`.

```javascript
init({
    mainShaderOptions: {
        source: {
            vertex: `< Your source must be compatible with WebGL2 >`,
            fragment: `< code here >`,
        },
        // Note: because the main shader uses the following attributes and shaders, all source that replaces them must ALSO use these same attributes and uniforms.
        attributes: {
            position: 'a_position',
            texture: 'a_texture',
        },
        uniforms: {
            positionMatrix: 'u_position',
            textureMatrix: 'u_texture',
            atlas: 'u_atlasSampler',
            blend: 'u_blend',
            useTexture: 'u_useTexture',
        },
    }
});
```

After calling `init()` you can locate/set your own uniforms or attributes as needbe, and store them into `shader.uniforms` and `shader.attributes` if you want.

You can also compile and use your own shaders, but be sure to call `gl.useProgram(supersprite.shader)` when appropriate!

# Enjoy!

Please reach out to me with any questions, concerns, suggestions, if I made any stupid typos, etc. I look forward to seeing what you can make with supersprite! I hope this document made sense and I did my best to cover everything, and what isn't covered should be self-explanatory or documented but if not, please reach out.

---

## To do next:
- Write tests for draw.ts, shader.ts, and sprite.ts
- PROBLEM USING DIFFERENT SIZE CANVASES
    - appears to stretch... is viewport set right? does the matrix need to change maybe?
- supersprite generator, that creates the minimum rollup/supersprite/typescript configuration you need to get started immediately
- set it up so that you can draw primitives without loading a texture

## To-do, eventually
- Compiling of sprite strips
- Main shader "extensions" of different common effects
    - e.g. palette swap, pixelation, grayscale