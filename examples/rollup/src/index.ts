import { Color, Core } from "supersprite";

const core = new Core({
    atlas: null,
    presenter: {
        baseWidth: 300,
        baseHeight: 200,
    },
});

const red = new Color("#ff2222");
const blue = new Color("#2222ff");
const green = new Color("#22ff22");
const yellow = new Color("#ffff22");

function main() {
    core.beginRender();

    // "Hello world" primitive draw
    const colors = [blue, red, yellow, green];
    for (let i = 0; i <= 3; i++) {
        core.draw.circle(80 + i * 50, 100, 40, 40, colors[i]);
    }

    core.endRender();
    requestAnimationFrame(main);
}

main();
