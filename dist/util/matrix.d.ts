/** Each matrix's value array is nine values, forming a 3x3 matrix. */
declare type M3 = [number, number, number, number, number, number, number, number, number];
/** Allows for transformations by chaining different functions onto existing Matrices. */
declare class Matrix {
    values: M3;
    static identity: M3;
    constructor(values: M3);
    /** Returns a new projection Matrix based on the provided view dimensions. Should only be called when the view size changes. */
    static projection: (viewWidth: number, viewHeight: number) => Matrix;
    copy(): Matrix;
    /** Multiplies this matrix by another and returns itself, to allow multiple chained transformations. */
    multiply(mat: Matrix): Matrix;
    /** Translates this matrix and returns itself, to allow multiple chained transformations. Note that this does not translate the matrix by PIXELS, but by factors of the sprite's width and height. So, to translate one full sprite width to the right, you'd use "translate(1,0)" */
    translate(tx: number, ty: number): Matrix;
    /** Rotates this matrix and returns itself, to allow multiple chained transformations. */
    rotate(radians: number): Matrix;
    /** Scales this matrix and returns itself, to allow multiple chained transformations. */
    scale(sx: number, sy: number): Matrix;
}
export default Matrix;
