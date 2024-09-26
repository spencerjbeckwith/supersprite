import { Core, Color } from "supersprite";
import spr from "./sprites.json";

const core = new Core({
    atlas: {
        url: "atlas.png",
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

function main() {
    core.beginRender();

    core.draw.circle(150, 100, 50, 20, new Color("#ffffff"));
    core.draw.sprite(spr.guy, 0.2, 142, 92);
    core.draw.text("webpack example", 150, 160, {
        hAlign: "center",
        vAlign: "top",
    })

    core.endRender();
    requestAnimationFrame(main);
}

main();