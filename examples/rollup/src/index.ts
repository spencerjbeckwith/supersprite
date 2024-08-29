import { Core } from "supersprite";
import { primitives } from "./primitives";
import { sprites } from "./sprites";

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

function main() {
    core.beginRender();
    func(core);
    core.endRender();
    requestAnimationFrame(main);
}

main();

// Enable our buttons to change what we draw
document.querySelector("#primitives").addEventListener("click", () => func = primitives);
document.querySelector("#sprites").addEventListener("click", () => func = sprites);