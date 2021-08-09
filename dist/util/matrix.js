/** Allows for transformations by chaining different functions onto existing Matrices. */
class Matrix {
    constructor(values) {
        this.values = values;
    }
    copy() {
        return new Matrix([...this.values]);
    }
    /** Multiplies this matrix by another and returns itself, to allow multiple chained transformations. */
    multiply(mat) {
        const a00 = this.values[0 * 3 + 0];
        const a01 = this.values[0 * 3 + 1];
        const a02 = this.values[0 * 3 + 2];
        const a10 = this.values[1 * 3 + 0];
        const a11 = this.values[1 * 3 + 1];
        const a12 = this.values[1 * 3 + 2];
        const a20 = this.values[2 * 3 + 0];
        const a21 = this.values[2 * 3 + 1];
        const a22 = this.values[2 * 3 + 2];
        const b00 = mat.values[0 * 3 + 0];
        const b01 = mat.values[0 * 3 + 1];
        const b02 = mat.values[0 * 3 + 2];
        const b10 = mat.values[1 * 3 + 0];
        const b11 = mat.values[1 * 3 + 1];
        const b12 = mat.values[1 * 3 + 2];
        const b20 = mat.values[2 * 3 + 0];
        const b21 = mat.values[2 * 3 + 1];
        const b22 = mat.values[2 * 3 + 2];
        this.values = [
            b00 * a00 + b01 * a10 + b02 * a20,
            b00 * a01 + b01 * a11 + b02 * a21,
            b00 * a02 + b01 * a12 + b02 * a22,
            b10 * a00 + b11 * a10 + b12 * a20,
            b10 * a01 + b11 * a11 + b12 * a21,
            b10 * a02 + b11 * a12 + b12 * a22,
            b20 * a00 + b21 * a10 + b22 * a20,
            b20 * a01 + b21 * a11 + b22 * a21,
            b20 * a02 + b21 * a12 + b22 * a22,
        ];
        return this;
    }
    /** Translates this matrix and returns itself, to allow multiple chained transformations. */
    translate(tx, ty) {
        return this.multiply(new Matrix([
            1, 0, 0,
            0, 1, 0,
            tx, ty, 1
        ]));
    }
    /** Rotates this matrix and returns itself, to allow multiple chained transformations. */
    rotate(radians) {
        const c = Math.cos(radians);
        const s = Math.sin(radians);
        return this.multiply(new Matrix([
            c, -s, 0,
            s, c, 0,
            0, 0, 1
        ]));
    }
    /** Scales this matrix and returns itself, to allow multiple chained transformations. */
    scale(sx, sy) {
        return this.multiply(new Matrix([
            sx, 0, 0,
            0, sy, 0,
            0, 0, 1
        ]));
    }
}
Matrix.projection = function (viewWidth, viewHeight) {
    return new Matrix([
        2 / viewWidth, 0, 0,
        0, -2 / viewHeight, 0,
        -1, 1, 1
    ]);
};
Matrix.identity = [
    1, 0, 0,
    0, 1, 0,
    0, 0, 1
];
export default Matrix;
