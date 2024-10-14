import { Core } from "supersprite";
import spr from "./sprites.json";

// Around ~10000 sprites is when things begin to slow down, but this likely depends on hardware
// Even including a tileset, most low-res games probably won't even get to 1000 sprites
// Transformations/contortions are slower, but not unless you're drawing with hundreds or thousands of them

export function performance(core: Core) {
    const s = spr.spin;
    const w = core.presenter.options.baseWidth;
    const h = core.presenter.options.baseHeight;
    const stepX = 2;
    const stepY = 4;
    let count = 0;
    for (let x = 0; x < w; x += stepX) {
        for (let y = 0; y < h; y += stepY) {
            core.draw.spriteAnim(s, (x / w) * (y / h) * 40, x, y);
            count++;
        }
    }
    core.draw.text(`Drawing ${count} sprites`, 300, 180, {
        hAlign: "right",
        vAlign: "bottom",
    });
}