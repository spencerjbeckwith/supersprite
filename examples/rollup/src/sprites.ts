import { Colors, Core, Transform } from "supersprite";
import spr from "./atlas";

export function sprites(core: Core) {
    core.draw.textWrap("supersprite can draw sprites in a number of ways: individual images, animated, transformed, contorted, or blended", 10, 10, 280, {
        maxWidth: 280,
    });

    // Draw just a regular image
    core.draw.sprite(spr.guy, 0, 50, 80);
    core.draw.sprite(spr.guy, 0, 50, 120, undefined, Colors.blue);

    // And the sprite animated
    core.draw.spriteAnim(spr.guy, 6, 90, 80);
    core.draw.spriteAnim(spr.guy, 6, 90, 120, undefined, Colors.lime);

    // Demonstrating a scale
    core.draw.spriteAnim(spr.guy, 6, 130, 80, new Transform()
        .translate(0.5, 0.5)
        .scale(1.5 + core.timer.wave(3) * 0.5, 1.5 + core.timer.wave(3) * 0.5)
        .translate(-0.5, -0.5)
    );
    core.draw.spriteAnim(spr.guy, 6, 130, 120, new Transform()
        .translate(0.5, 0.5)
        .scale(1.5 + core.timer.wave(3) * 0.5, 1.5 + core.timer.wave(3) * 0.5)
        .translate(-0.5, -0.5),
        Colors.yellow,
    );

    // Demonstrating a rotation
    core.draw.spriteAnim(spr.guy, 6, 170, 80, new Transform()
        .translate(0.5, 0.5)
        .rotateDeg(core.timer.current * 4)
        .translate(-0.5, -0.5)
    );
    core.draw.spriteAnim(spr.guy, 6, 170, 120, new Transform()
        .translate(0.5, 0.5)
        .rotateDeg(core.timer.current * 4)
        .translate(-0.5, -0.5),
        Colors.red,
    );

    // Demonstarting a translation
    core.draw.spriteAnim(spr.guy, 6, 210, 80, new Transform().translate(0, core.timer.wave(2) * 0.6));
    core.draw.spriteAnim(spr.guy, 6, 210, 120, new Transform().translate(0, core.timer.wave(2) * 0.6), Colors.navy);

    // Demonstrating a contortion (complex)
    const c = core.timer.wave(3) * 0.25;
    const contortion = [
        0, 0,
        1 + c, -c,
        1, 1,
    
        1, 1,
        c, 1 - c,
        0, 0,
    ];
    const contortionUVs = [ // Unit quad of a contortion corresponds to the texture of the image, so same contortion could be applied regardless of sprite
        0, 0,
        1, 0,
        1, 1,
    
        1, 1,
        0, 1,
        0, 0,
    ];
    core.shader.setPositions(contortion);
    core.shader.setUVs(contortionUVs);
    core.draw.spriteSpecialAnim(spr.guy, 6, 250, 80, contortion.length / 2, new Transform()
        .translate(0.5, 0.5)
        .scale(2, 2) // Scale up this contortion so you can better see the change
        .translate(-0.5, -0.5)
    );
    core.draw.spriteSpecialAnim(spr.guy, 6, 250, 120, contortion.length / 2, new Transform()
        .translate(0.5, 0.5)
        .scale(2, 2)
        .translate(-0.5, -0.5),
        Colors.fuchsia,
    );
}