import { subdivide, subdivisions } from './subdivide';

describe('subdivisions',() => {
    test('generate a unit quad',() => {
        const quad = subdivide(1, 1);
        expect(quad).toMatchObject([
            0, 0,
            0, 1,
            1, 1,

            1, 1,
            1, 0,
            0, 0,
        ]);
    });

    test('generate vertices at correct points', () => {
        const quad = subdivide(4, 2);
        expect(quad).toEqual(expect.arrayContaining([
            // First vertex
            0, 0,
            0, 0.5,
            0.25, 0.5,

            0.25, 0.5,
            0.25, 0,
            0, 0,

            // Second vertex
            0, 0.5,
            0, 1,
            0.25, 1,

            0.25, 1,
            0.25, 0.5,
            0, 0.5,
        ]));
    });

    test('generate proper number of points', () => {
        const quad = subdivide(40, 20);
        // 40x20 = 800 sections x2 triangles per section x3 points per triangle x2 indices per triangle = 9600 total indices
        expect(quad.length).toBe(9600);
    });

    test('generate at least four precalculated quads by default', () => {
        expect(subdivisions.unit.length).toBe(12);
        expect(subdivisions.quad4.length).toBe(192);
        expect(subdivisions.quad8.length).toBe(768);
        expect(subdivisions.quad16.length).toBe(3072);
    });
});