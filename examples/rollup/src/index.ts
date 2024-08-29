import { Core } from "supersprite";
import { primitives } from "./primitives";
import { sprites } from "./sprites";

const core = new Core({
    atlas: null,
    presenter: {
        baseWidth: 300,
        baseHeight: 200,
    },
});

// Function is swapped out to draw different things
let func: (core: Core) => void = primitives;

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