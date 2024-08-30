// Generated by supersprite 8/29/2024, 4:52:40 PM - script/atlas.js
// These Sprite and SpriteImage types identical to those exported by supersprite
const spr : {
  guy : Sprite;
  spin : Sprite;
} = {
  guy: { width: 16, height: 16, originX: 0, originY: 0, images: [{ x: 0, y: 0, t: [0.0625,0,0,0,0.0625,0,0,0,1] }, { x: 16, y: 0, t: [0.0625,0,0,0,0.0625,0,0.0625,0,1] }, { x: 32, y: 0, t: [0.0625,0,0,0,0.0625,0,0.125,0,1] }, { x: 48, y: 0, t: [0.0625,0,0,0,0.0625,0,0.1875,0,1] }, ]},
  spin: { width: 4, height: 4, originX: 0, originY: 0, images: [{ x: 64, y: 0, t: [0.015625,0,0,0,0.015625,0,0.25,0,1] }, { x: 80, y: 0, t: [0.015625,0,0,0,0.015625,0,0.3125,0,1] }, { x: 96, y: 0, t: [0.015625,0,0,0,0.015625,0,0.375,0,1] }, { x: 112, y: 0, t: [0.015625,0,0,0,0.015625,0,0.4375,0,1] }, { x: 128, y: 0, t: [0.015625,0,0,0,0.015625,0,0.5,0,1] }, { x: 144, y: 0, t: [0.015625,0,0,0,0.015625,0,0.5625,0,1] }, { x: 160, y: 0, t: [0.015625,0,0,0,0.015625,0,0.625,0,1] }, { x: 176, y: 0, t: [0.015625,0,0,0,0.015625,0,0.6875,0,1] }, { x: 192, y: 0, t: [0.015625,0,0,0,0.015625,0,0.75,0,1] }, { x: 208, y: 0, t: [0.015625,0,0,0,0.015625,0,0.8125,0,1] }, { x: 224, y: 0, t: [0.015625,0,0,0,0.015625,0,0.875,0,1] }, { x: 240, y: 0, t: [0.015625,0,0,0,0.015625,0,0.9375,0,1] }, ]},
};
interface Sprite {
    width: number;
    height: number;
    originX: number;
    originY: number;
    images: SpriteImage[];
}

interface SpriteImage {
    x: number;
    y: number;
    /** A precomputed 3x3 matrix, used to slice this sprite image out of the texture atlas. */
    t: [number, number, number, number, number, number, number, number, number];
}
export default spr;