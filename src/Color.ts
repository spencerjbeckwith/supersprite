export class Color {
    red: number;
    green: number;
    blue: number;
    alpha: number;

    constructor(hex: string, alpha?: number)
    constructor(red: number, green: number, blue: number, alpha?: number)
    constructor(arg1: number | string, arg2?: number, arg3?: number, arg4?: number) {
        if (typeof arg1 === "string") {
            // Constructing from hex code
            const hex = arg1;
            const alpha = arg2;
        } else {
            // Constructing from RGB values
            const red = arg1;
            const green = arg2;
            const blue = arg3;
            const alpha = arg4;
            // TODO
        }

        this.red = 0;
        this.green = 0;
        this.blue = 0;
        this.alpha = 1;
    }

    invert(): Color {
        // TODO
        return this;
    }

    toHex(): string {
        // TODO
        return "";
    }
}

export class ColorError extends Error {}
