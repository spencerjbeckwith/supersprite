/** Each matrix's value array is nine values, forming a 3x3 matrix. */
interface M3 {
    length: 9;
    [index: number]: number;
    0: number;
}
/** Allows for transformations by chaining different functions onto existing Matrices. */
declare class Matrix {
    values: M3;
    static identity: M3;
    constructor(values: M3);
    /** Returns a new projection Matrix based on the provided view dimensions. Should only be called when the view size changes. */
    static projection: (viewWidth: number, viewHeight: number) => Matrix;
    /** Multiplies this matrix by another and returns itself, to allow multiple chained transformations. */
    multiply(mat: Matrix): Matrix;
    /** Translates this matrix and returns itself, to allow multiple chained transformations. */
    translate(tx: number, ty: number): Matrix;
    /** Rotates this matrix and returns itself, to allow multiple chained transformations. */
    rotate(radians: number): Matrix;
    /** Scales this matrix and returns itself, to allow multiple chained transformations. */
    scale(sx: number, sy: number): Matrix;
}
export default Matrix;
