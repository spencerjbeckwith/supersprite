# supersprite

supersprite is a sprite drawing engine for 2D browser games that can use either JavaScript or TypeScript. It grealy simplifies the process of setting up your WebGL context, loading textures, compiling shaders, etc. when all you want to do is draw a couple sprites on screen! As opposed to just using a 2D context and its `drawImage` method, supersprite provides a fast, powerful, and intuitive transformation and blending system that is made possible by WebGL, while still keeping the simplicity of singular, self-contained draw calls.

supersprite itself is not a game engine - it doesn't handle any game objects, sounds, input, or networking. It fits seamlessly into your animation loop and is accessed through a variety of draw methods, so you can focus more on your gameplay instead of the many headaches that come with using WebGL. That said, supersprite is not suitable for anything 3-dimensional or anything that requires fine control over every detail of your rendering process.

supersprite also provides an atlas compilation utility, which will crawl a directory for GIF resources, place them on an atlas, and provide you with the data necessary to utilize that atlas with supersprite.

# Usage

In order to use supersprite, you must also be using a tool such as [rollup](https://rollupjs.org/guide/en/) that can pull in code from node dependencies. You will also need to use 
the [node-resolve](https://github.com/rollup/plugins/tree/master/packages/node-resolve) rollup plugin to include supersprite in your bundled game. If you are using TypeScript, you will also need the [typescript](https://github.com/rollup/plugins/tree/master/packages/typescript) rollup plugin. These will also require you to make `rollup.config.js` and `tsconfig.json` config files and set up your environment so that you can build your game into a singular script. You should also use another tool such as [babel](https://babeljs.io/) to minify and obfuscate your final game.

To get started, run `npm install supersprite` and don't forget to change your `package.json`: `"type": "module"`

All you need to access supersprite is an entry point and a main animation loop. This can be incredibly simple:

```javascript
import { initialize, draw, Shader } from 'supersprite';

function main() {
    Shader.beginRender(); // Tells supersprite to begin rendering for this frame onto our game texture.

    draw.circle(100,100,50,24,1,1,1); // Draws a circle at (100,100) with a radius of 50px, using 24 segments, and color white (r = 1, g = 1, and b = 1)

    // All your drawing must happen here!

    Shader.render(); // Renders the game's texture to the screen.
    requestAnimationFrame(main);
}

initialize({
    mainLoop: main
});
```

Using sprites and textures adds a bit more complexity than just using primitives. First off, using textures requires you to **compile an atlas** of your textures. See below for more details, but once this is done, it doesn't add much to our code:

```javascript
import { initialize, draw, Shader } from 'supersprite';

import spr from './atlas.js'; // If your atlas output is JavaScript, the default export is your sprite list.
// --- OR ---
import { spr } from './atlas.js'; // If your atlas output is TypeScript, there is no default export in order to also export the Sprite and SpriteImage interfaces.

function main() {
    Shader.beginRender();

    draw.sprite(spr.example,2,100,100); // Draws image 2 of sprite 'example' at (100,100)

    Shader.render();
    requestAnimationFrame(main);
}

initialize({
    mainLoop: main,
    atlasURL: 'build/atlas.png'; // Note that your atlas texture must be hosted on a webserver.
});
```

To transform a sprite when drawing, you must provide a **callback transformation function** which provides you a 2D matrix and expects you to return that same matrix with your transformations applied. For more details about 2D matrices I recommend checking out the awesome walkthrough at [WebGL Fundamentals](https://webglfundamentals.org/webgl/lessons/webgl-2d-matrices.html).

```javascript
function main() {
    Shader.beginRender();

    draw.sprite(spr.example,0,100,100,(matrix) => {
        return matrix.translate(1,0); // Will translate the sprite one sprite-width to the right. (Note that translate is not by pixels!)
    });

    Shader.render();
    requestAnimationFrame(main);
}
```

The real fun begins when you chain multiple transformations at once!
```javascript
draw.sprite(spr.example,0,100,100,(mat) => mat.translate(1,0).scale(-1,1)); // Will translate the sprite to the right and then flip it horizontally - effectively mirroring it in-place.
```

Transformations occur around the **origin-point** of a sprite. By default, this is the top-left corner. When you provide a pixel coordinate to draw a sprite at, that sprite's origin is placed at those coordinates. You can change origins by changing the sprite asset's filename before you compile your atlas - see below. For example, you probably want rotations around the center of your sprite. So in this case, if your sprite is 32x24 pixels you'd probably set the origin to 16x12 - though of course, it depends. Translation and scaling also happens from the origin. It does get a little tricky sometimes, depending on how complicated you want your transformations to be.
```javascript
draw.sprite(spr.example,0,100,100,(mat) => mat.rotate(Math.PI/4)); // Rotates the sprite 45 degrees counter-clockwise around its origin point.
```

Oh yeah, you can also *change* the origin point with a transformation!
```javascript
// Say the sprite's origin is in its top-left. This will move the origin to the center, rotate the sprite 45 degrees counter-clockwise, and move the origin back.
// End result, it makes it appear rotated from the center!
draw.sprite(spr.example,0,0,0,m => m.translate(0.5,0.5).rotate(Math.PI/4).translate(-0.5,-0.5));
```

The possibilities are virtually endless, but note that transformations are additive and *their order matters*. Now combine all this with the ability to blend a sprite with any color--
```javascript
// Blending, with no transformation - effectively skips over the transformation parameter.
draw.sprite(spr.example,0,100,100,undefined,0.9,0.5,0.25,1); // Draws sprite example blended with a color (r = 0.9, g = 0.5, b = 0.25, a = 1)

// With transformations and blending:
draw.sprite(spr.example,0,100,100,(matrix) => {
    return matrix.scale(2,2);
},0.9,0.5,0.25,1);
```
--And you have complete control over a flexible system to draw sprites in crazy ways, never thought possible by a canvas's limited 2D context.

In addition to sprites, you can draw primitives with the following methods:
```javascript
// A line from (x,y) to (x2,y2)
draw.line(x,y,x2,y2,r,g,b,a);

// A solid rectangle with the top-left corner at (x,y) and the bottom-right corner at (x2,y2)
draw.rect(x,y,x2,y2,r,g,b,a);

// A solid circle centered at (x,y) with a radius of r pixels and using s segments.
draw.circle(x,y,r,s,r,g,b,a);

// Any sort of primitive you want!
// Possible modes: gl.POINTS, gl.LINE_STRIP, gl.LINE_LOOP, gl.LINES, gl.TRIANGLE_STRIP, gl.TRIANGLE_FAN, or gl.TRIANGLES
// Positions is an array of numbers, with each pair signifying the next pixel coordinate of the primitive.
draw.primitive(mode,positions,r,g,b,a);

// For example:
draw.primitive(Shader.gl.TRIANGLE_FAN,[0,0, 32,0, 0,32, 32,32],1,0,0); // A red box

// Alpha is optional for colors, but when not provided it is assumed to be 1. You can also use a supersprite Color instance intstead of traditional RGBA.

import { Color } from 'supersprite';

const myColor = new Color(0.9,0.5,0.25); // Alpha assumed to be 1
draw.line(0,0,32,32,myColor);
draw.line(32,32,64,64,myColor.invert()); // ooooooh, wowee we inverted that bad boio
```

In addition to primitives, supersprite creates a second canvas context (in boring old 2D) that is overlaid directly over the first canvas. This is the canvas where you'd want to draw text, HUD elements, or any other static things that shouldn't be affected by a shader. You still draw on it via the `draw` object, but these always will appear ABOVE sprites and primitives due to the way the canvases are placed in the DOM.

```javascript
draw.text(x,y,text,options); // Where "options" contains settings for align, font, color, shadows, separation, etc...
draw.textWrap(x,y,text,width,options);

// You can also draw to this context manually.
Shader.ctx.fillStyle = 'red';
Shader.ctx.fillRect(16,16,80,80);
```

So how do you actually *use* supersprite? Well, it's pretty simple. Assuming you want nothing else on your game's webpage (which should probably be the case most of the time?), you just want an HTML file like this:

```HTML
<!DOCTYPE html>
<html>
    <!-- Don't forget head, title, character encoding, meta tags, etc... -->
    <body>
        <!--This is your rollup build script.
            The initialize() method creates both of your canvases and puts them into the body automatically - no need to worry about their styling or placement.
            It doesn't really matter where or how you load this script (head or body), though you may want to load it as a module so users can't mess with your game from the web console.-->
        <script src='build/main.js'></script>
    </body>
</html>
```

# Compiling an Atlas

You might be wondering, how do I tell supersprite what sprites I want to use? Luckily it isn't that complicated. In order to draw sprites using WebGL, they must be part of a texture - and supersprite contains a utility to compile sprite resources into an atlas for you, and spits out the data you need in order to use them. First, you'll want to create a config file `supersprite.json`:

```JSON
{
    // Folder containing every sprite you want to use in-game
    "dir": "assets/sprites",

    // The output image - should be the same as is loaded by your initialize function.
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

    // The color to use in the input GIFs to mark as transparent - as GIFs don't support transparency.
    "transparent": {
        "red": 0,
        "green": 0,
        "blue": 0
    }
}
```

The most important option is `dir`, which should be a directory of your sprite assets. ***As of right now, supersprite can only compile GIFs into your atlas.*** The entire directory is crawled for every GIF that is present, which then gets split and placed onto the atlas as a sprite. Even if your sprite is only one image, *it must still be in .gif format.* Sub-folders are crawled as well, allowing you to organize your assets better - but this does not have any impact on the way they are named. As such, *make sure every sprite (regardless of its location in the file system) has a unique name.*

**The name of your GIF file becomes the name of your sprite when you use it in code.** So, if your GIF is named `mySprite.gif` you'll access it with supersprite as `spr.mySprite`.

**To set an origin point for your sprite, place coordinates *at the end of your filename, separated with underscores.***. If you want `mySprite.gif` to have an origin of (24,8) you would rename it to `mySprite_24_8.gif` but *you would still access it in code as `spr.mySprite`.* Your origins can also be negative: `mySprite_-20_-40.gif`. If no origin is defined, it defaults to (0,0) for every sprite.

In order to compile your atlas, simply run `npx supersprite` from your project root. You can also specify a different config file than the default `supersprite.json` as a third argument if you want. Make sure you recompile the atlas and rebuild your game (if using `outputJS` or `outputTS`) each time you add a new sprite resource!

# The View and Display

An important distinction to make when using supersprite is that of the `view` and the `display`. The view is defined as the actual game area, while the display is the canvas on screen. They don't necessarily have to be the same size - and in some cases, you wouldn't want that! The `initialize()` function includes several options that can control the way the canvas takes up screen-space and makes it user-responsive, as well as the default size for the view and display.

The shape of the canvases is determined by the options specified for `responsive`, `maintainAspectRatio`, and `scalePerfectly` options. `responsive` can have three values:
- `"static"` will keep the view and display at the same size as when they are created, regardless of if the window changes.
- `"stretch"` will expand the view and display to cover as much of the window as possible, while keeping the contents of the canvas as a constant size.
    - If `maintainAspectRatio` is true, supersprite will create bars at either the top/bottom or the sides of the screen to maintain the same aspect ratio as when the view was initially created. If it is false, the entire window will be filled.
    - Nothing on the canvases will appear to stretch, but increasing the size of the window gives the canvas more space. Drawings stay the same size.
- `"scale"` will expand the view and display to cover as much of the widnow as possible, while resizing the contents of the canvas to fit.
    - If `maintainAspectRatio` is true, supersprite will create bars at either the top/bottom or the sides of the screen to maintain the same aspect ratio as when the view was initially created. Items will scale up, but not change shape. If this is false, the entire window will be filled and drawings will scale up and change shape.
        - If `scalePerfectly` is also true, the view will only scale up to integers, such as 1x, 2x, 3x, 4x, etc. This is ideal for pixel-perfect situations where you do not want any distortion whatsoever, but want to upsize a small game.
    - The view will not scale smaller than its initial size.

The value you set for `responsive` depends on the needs of your game.

# Enjoy!

Please reach out to me with any questions, concerns, suggestions, if I made any stupid typos, etc. I look forward to seeing what you can make with supersprite!

To do next:
- make sure ctx scales properly
- make example and host it