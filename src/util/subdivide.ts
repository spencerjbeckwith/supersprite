export function subdivide(divisorX: number, divisorY: number): number[] {
    const positions: number[] = [], stepX = 1 / divisorX, stepY = 1/divisorY;
    for (let x = 0; x < 1; x += stepX) {
        for (let y = 0; y < 1; y += stepY) {
            // Each cell gets a unit quad - two triangles, six points
            const x2 = x + stepX, y2 = y + stepY;
            positions.push(
                x, y,
                x, y2,
                x2, y2,

                x2, y2,
                x2, y,
                x, y
            );
        }
    }

    return positions;
}

export interface PrecalculatedSubdivisions {
    unit: number[];
    quad4: number[];
    quad8: number[];
    quad16: number[];
    array: Float32Array;
    array4: Float32Array;
    array8: Float32Array;
    array16: Float32Array;
}

const unit = subdivide(1, 1);
const quad4 = subdivide(4, 4);
const quad8 = subdivide(8, 8);
const quad16 = subdivide(16, 16);

export const subdivisions: PrecalculatedSubdivisions = {
    unit: unit,
    quad4: quad4,
    quad8: quad8,
    quad16: quad16,
    array: new Float32Array(unit),
    array4: new Float32Array(quad4),
    array8: new Float32Array(quad8),
    array16: new Float32Array(quad16),
}

