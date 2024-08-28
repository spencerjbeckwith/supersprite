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
const green = new Color("22ff22");
const yellow = new Color("ffff22");

function main() {
    core.beginRender();

    // "Hello world" primitive draw
    core.draw.rect(0, 0, 300, 200, blue);
    core.draw.line(0, 0, 300, 200, green);
    core.draw.line(300, 0, 0, 200, red);
    core.draw.circle(150, 100, 25 + 25*core.timer.wave(3), 40, yellow);
    core.draw.text(core.timer.current.toString(), 10, 10);

    core.endRender();
    
    requestAnimationFrame(main);
}

main();
