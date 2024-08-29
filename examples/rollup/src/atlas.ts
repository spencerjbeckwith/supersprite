// Generated by supersprite 8/29/2024, 3:21:23 PM - script/atlas.js
// These Sprite and SpriteImage types identical to those exported by supersprite
const spr : {
  guy : Sprite;
} = {
  guy: { width: 16, height: 16, originX: 0, originY: 0, images: [{ x: 0, y: 0, t: [0.0625,0,0,0,0.0625,0,0,0,1] }, { x: 16, y: 0, t: [0.0625,0,0,0,0.0625,0,0.0625,0,1] }, { x: 32, y: 0, t: [0.0625,0,0,0,0.0625,0,0.125,0,1] }, { x: 48, y: 0, t: [0.0625,0,0,0,0.0625,0,0.1875,0,1] }, ]},
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