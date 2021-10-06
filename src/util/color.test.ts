import Color from './color';

describe('color', () => {
    test('can be created from hex codes', () => {
        const col = Color.fromHex('#000000');
        expect(col.red).toBe(0);
        expect(col.green).toBe(0);
        expect(col.blue).toBe(0);
        expect(col.alpha).toBe(1);

        const col2 = Color.fromHex('FFFFFF', 0.5);
        expect(col2.red).toBe(1);
        expect(col2.green).toBe(1);
        expect(col2.blue).toBe(1);
        expect(col2.alpha).toBe(0.5);

        const col3 = Color.fromHex('#4080c0');
        expect(col3.red).toBeCloseTo(0.25);
        expect(col3.green).toBeCloseTo(0.5);
        expect(col3.blue).toBeCloseTo(0.75);
        expect(col3.alpha).toBeCloseTo(1);
    });

    test('can be converted into hex codes', () => {
        const col = new Color(0, 0, 0);
        expect(Color.toHex(col)).toBe('#000000');

        const col2 = new Color(1, 1, 1);
        expect(Color.toHex(col2).toLowerCase()).toBe('#ffffff');

        const col3 = new Color(0.25, 0.5, 0.75);
        expect(Color.toHex(col3).toLowerCase()).toBe('#4080bf');
    });

    test('defaults to alpha of 1', () => {
        const col = new Color(1, 1, 1);
        expect(col.alpha).toBe(1);
    });

    test('inverts', () => {
        const col = new Color(0.75, 0.3, 0.25);
        const inverted = col.invert();
        expect(inverted.red).toBe(0.25);
        expect(inverted.green).toBe(0.7);
        expect(inverted.blue).toBe(0.75);
    });
});