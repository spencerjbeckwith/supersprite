import { Color, Core, Transform } from "supersprite";
import { sprites } from "./sprites";
import { primitives } from "./primitives";
import { performance } from "./performance";
import { globalTransform } from "./globaltransform";

const core = new Core({
    atlas: {
        url: "./atlas.png",
    },
    presenter: {
        baseWidth: 300,
        baseHeight: 200,
    },
    drawDefaults: {
        backgroundColor: new Color("#151515"),
        matchPageToBackground: true,
    },
});

// Function is swapped out to draw different things
let func: (core: Core) => void = sprites;

// Used to calculate FPS
let delta = Date.now();
const lastFrames: number[] = new Array(60);
lastFrames.fill(60);

function main() {
    core.beginRender();
    func(core);

    // Determine and draw our FPS
    const change = Date.now() - delta;
    delta += change;
    const fps = 1000 / change;
    lastFrames.push(fps);
    lastFrames.shift();
    core.draw.text(`FPS: ${Math.round(lastFrames.reduce((f, c) => f + c) / lastFrames.length)}`, 300, 200, {
        hAlign: "right",
        vAlign: "bottom",
    });

    if (func === globalTransform) {
        // Apply some funky transforms to the entire game texture in this example
        const blendR = 0.5 + 0.5 * core.timer.wave(2);
        const blendG = 0.5 + 0.5 * core.timer.wave(4);
        const blendB = 0.5 + 0.5 * core.timer.wave(6);
        const scale = 1 + core.timer.wave(8) * 0.25;
        core.endRender(undefined, undefined, new Transform()
            .translate(0.5, 0.5)
            .scale(scale, scale)
            .rotateDeg(core.timer.current)
            .translate(-0.5, -0.5),
        new Color(blendR, blendG, blendB));
    } else {
        // All other examples
        core.endRender();
    }
    requestAnimationFrame(main);
}

main();

// Enable our buttons to change what we draw
document.querySelector("#sprites").addEventListener("click", () => func = sprites);
document.querySelector("#primitives").addEventListener("click", () => func = primitives);
document.querySelector("#performance").addEventListener("click", () => func = performance);
document.querySelector("#globaltransform").addEventListener("click", () => func = globalTransform);