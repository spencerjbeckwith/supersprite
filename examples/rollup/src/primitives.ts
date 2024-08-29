import { Core, Colors } from "supersprite";

// Pre-define coordinates for our custom primitives
const starX = 140;
const starY = 175;
const star = [
    starX, starY - 20,
    starX + 5, starY - 5,
    starX + 20, starY,
    starX + 5, starY + 5,
    starX, starY + 20,
    starX - 5, starY + 5,
    starX - 20, starY,
    starX - 5, starY - 5,
    starX, starY - 20,
];

const spiralX = 200;
const spiralY = 190;
const spiral = [
    spiralX, spiralY,
];
let rotate = 0;
let rotationRate = -Math.PI / 4;
for (let i = 0; i < 25; i++) {
    const lastX = spiral[spiral.length - 2];
    const lastY = spiral[spiral.length - 1];
    spiral.push(
        lastX + Math.cos(rotate) * 8,
        lastY + Math.sin(rotate) * 8,
    );
    rotate += rotationRate;
    rotationRate /= 1.04;
}

const triangleX = 255;
const triangleY = 180;
const triangle = [
    triangleX, triangleY - 10,
    triangleX + 20, triangleY + 20,
    triangleX - 20, triangleY + 20,
    triangleX, triangleY - 10,
];

export function primitives(core: Core) {
    core.draw.text("supersprite can draw four types of untextured shapes", 10, 10);

    core.draw.text("lines", 10, 40);
    core.draw.line(44, 40, 44, 50, Colors.gray);
    core.draw.line(50, 40, 60, 50, Colors.lime);
    core.draw.line(60, 45, 70, 40, Colors.yellow);
    core.draw.line(75, 40, 250, 40, Colors.red);
    core.draw.line(75, 42, 250, 42, Colors.blue);
    core.draw.line(75, 50, 150, 45, Colors.cyan);
    core.draw.line(150, 45, 225, 50, Colors.fuchsia);
    core.draw.line(225, 50, 250, 45, Colors.white);

    core.draw.text("rects", 10, 80);
    core.draw.rect(50, 80, 105, 100, Colors.red);
    core.draw.rect(120, 70, 140, 110, Colors.blue);
    core.draw.rect(155, 65, 195, 105, Colors.green);

    core.draw.text("circles", 10, 120);
    core.draw.circle(100, 130, 10, 6, Colors.fuchsia);
    core.draw.circle(160, 130, 20, 15, Colors.cyan);
    core.draw.circle(250, 130, 30, 20, Colors.gray);

    core.draw.text("primitives (custom)", 10, 160);
    core.draw.primitive("LINE_STRIP", star, Colors.navy);
    core.draw.primitive("LINE_STRIP", spiral, Colors.maroon);
    core.draw.primitive("TRIANGLE_FAN", triangle, Colors.green);
}