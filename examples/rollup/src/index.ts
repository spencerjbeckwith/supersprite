import { Core } from "supersprite";
import { sprites } from "./sprites";
import { primitives } from "./primitives";
import { performance } from "./performance";

const core = new Core({
    atlas: {
        url: "./atlas.png",
    },
    presenter: {
        baseWidth: 300,
        baseHeight: 200,
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

    core.endRender();
    requestAnimationFrame(main);
}

main();

// Enable our buttons to change what we draw
document.querySelector("#sprites").addEventListener("click", () => func = sprites);
document.querySelector("#primitives").addEventListener("click", () => func = primitives);
document.querySelector("#performance").addEventListener("click", () => func = performance);