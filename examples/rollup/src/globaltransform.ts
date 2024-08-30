import { Core, Transform } from "supersprite";
import spr from "./atlas";

export function globalTransform(core: Core) {
    // The meat of this example happens in index.ts, with the call to `endRender()`.

    // Draw some dudes to move around
    core.draw.spriteAnim(spr.guy, 4, 150, 100, new Transform()
        .translate(-1.5, -1.5)
        .scale(3, 3)
    );
    core.draw.sprite(spr.guy, 0, 50, 50);
    core.draw.sprite(spr.guy, 1, 250, 50);
    core.draw.sprite(spr.guy, 2, 250, 150);
    core.draw.sprite(spr.guy, 3, 50, 150);

    // This isn't affected by the transformations, since it's on the 2D context
    core.draw.text("transformations, blends, and contortions can also be applied to the entire view", 150, 100, {
        maxWidth: 280,
        hAlign: "center",
        vAlign: "middle",
    });
}