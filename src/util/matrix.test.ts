import Matrix from './matrix';

describe('matrices', () => {
    test('copy returns a new instance', () => {
        const m1 = new Matrix([0, 1, 2, 3, 4, 5, 6, 7, 8]);
        const m2 = m1.copy();
        m1.values[0] = 10; // Should not affect our copy
        m1.values[1] = 20;
        expect(m2.values[0]).toBe(0);
        expect(m2.values[1]).toBe(1);
    });

    test('multiply properly', () => {
        // Note WebGL matrices swap rows and columns
        // So you have to swap them too, if testing on a calculator like this one
        //  https://www.easycalculation.com/matrix/matrix-multiplication.php?amat=3
        const m1 = new Matrix([
            1, 4, 7,
            2, 5, 8,
            3, 6, 9
        ]);
        const m2 = new Matrix([
            9, 6, 3,
            8, 5, 2,
            7, 4, 1
        ]);
        m1.multiply(m2);
        expect(m1.values).toMatchObject([
            30, 84, 138,
            24, 69, 114,
            18, 54, 90
        ]);
    });

    test('multiply by vec3 properly', () => {
        // Again, reverse the rows and columns so we can calculate the real result
        const m1 = new Matrix([
            1, 4, 7,
            2, 5, 8,
            3, 6, 9
        ]);
        const vec3 = m1.multiplyVec3([2, 3, 4]);
        expect(vec3).toMatchObject([20, 47, 74]);
    });

    test('translate properly', () => {
        const m1 = new Matrix(Matrix.identity);
        m1.translate(2, 3);
        expect(m1.values[6]).toBe(2);
        expect(m1.values[7]).toBe(3);
    });

    test('rotate properly', () => {
        const m1 = new Matrix(Matrix.identity);
        m1.rotate(Math.PI / 4);
        const rad2 = Math.sqrt(2) / 2;
        expect(m1.values[0]).toBeCloseTo(rad2);
        expect(m1.values[1]).toBeCloseTo(-rad2);
        expect(m1.values[3]).toBeCloseTo(rad2);
        expect(m1.values[4]).toBeCloseTo(rad2);
    });

    test('scale properly', () => {
        const m1 = new Matrix([
            2, 0, 0,
            0, 2, 0,
            0, 0, 1
        ]);
        m1.scale(4, 6);
        expect(m1.values[0]).toBe(8);
        expect(m1.values[4]).toBe(12);
    });

    test('projection converts to clipspace properly', () => {
        const width = 400, height = 240;
        const m1 = Matrix.projection(width, height);
        const points: number[] = [];
        points.push(
            0, 0,
            width / 4, height / 4,
            width / 2, height / 2,
            width * 0.75, height * 0.75,
            width, height,

            0, height,
            width / 4, height * 0.75,
            width * 0.75, height / 4,
            width, 0,
        );

        const results: number[][] = [];
        for (let i = 0; i < points.length; i += 2) {
            const product = m1.multiplyVec3([points[i], points[i + 1], 1]);
            results.push([product[0], product[1]]); // Just take X and Y
        }

        expect(results[0]).toMatchObject([-1, -1]);
        expect(results[1]).toMatchObject([-0.5, -0.5]);
        expect(results[2]).toMatchObject([0, 0]);
        expect(results[3]).toMatchObject([0.5, 0.5]);
        expect(results[4]).toMatchObject([1, 1]);

        expect(results[5]).toMatchObject([-1, 1])
        expect(results[6]).toMatchObject([-0.5, 0.5])
        expect(results[7]).toMatchObject([0.5, -0.5])
        expect(results[8]).toMatchObject([1, -1])
    });

    test('can chain multiple transformations', () => {
        const m1 = new Matrix(Matrix.identity);
        m1.translate(10,20).scale(3,4);
        expect(m1.values).toMatchObject([
            3, 0, 0,
            0, 4, 0,
            10, 20, 1
        ]);
    });
});