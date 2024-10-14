import { MAX_TRANSFORMATIONS } from "../shaders/vertex";

/** Instructions of a single transformation to apply to a draw request */
export interface TransformationOrder {
    /** What type of transformation this order should apply */
    type: "translate" | "rotate" | "scale";

    /**
     * For translations, the X coordinate to translate to.
     * 
     * For rotations, the number of degrees in radians.
     * 
     * For scaling, the X multiple to scale by.
     */
    arg0: number;

    /**
     * For translations, the Y coordinate to translate to.
     * 
     * For scaling, the Y multiple to scale by.
     * 
     * Unused for rotations.
     */
    arg1: number;
}

/** Describes a list of transformations to apply to a draw request */
export class Transform {

    list: TransformationOrder[];
    constructor() {
        this.list = [];
    }

    /** Appends another transformation to the end of this one, effectively merging them */
    append(other: Transform): Transform {
        this.list.push(...other.list);
        return this;
    }

    /** Adds a translation to the end of the transformation list */
    translate(x: number, y: number): Transform {
        // If translation is uselss, skip it
        if (x === 0 && y === 0) return this;
        
        // If last order is also a transformation and we have net 0 movement, remove it and do nothing new
        if (this.list.length > 0) {
            const last = this.list[this.list.length - 1];
            if (last.type === "translate") {
                if (last.arg0 + x === 0 && last.arg1 + y === 0) {
                    this.list.pop();
                    return this;
                } else {
                    // Otherwise, combine them
                    last.arg0 += x;
                    last.arg1 += y;
                    return this;
                }
            }
        }

        this.list.push({
            type: "translate",
            arg0: x,
            arg1: y,
        });
        this.#assertLength();
        
        return this;
    }

    /** Adds a rotation (in degrees) to the end of the transformation list */
    rotateDeg(degrees: number): Transform {
        return this.rotateRad((degrees * Math.PI) / 180);
    }

    /** Adds a rotation (in radians) to the end of the transformation list */
    rotateRad(radians: number): Transform {
        // If the rotation is (effectively) useless, skip it
        if (Math.abs(radians) < 0.01) {
            return this;
        }

        // If last order is also a rotation and we wind up with net zero, remove it and do nothing new
        if (this.list.length > 0) {
            const last = this.list[this.list.length - 1];
            if (last.type === "rotate") {
                if (Math.abs(last.arg0 + radians) < 0.01) {
                    this.list.pop();
                    return this;
                } else {
                    // Otherwise, combine them
                    last.arg0 += radians;
                    return this;
                }
            }
        }

        this.list.push({
            type: "rotate",
            arg0: radians,
            arg1: 0,
        });
        this.#assertLength();

        return this;
    }

    /** Adds a scaling to the end of the transformation list */
    scale(x: number, y: number): Transform {
        // If the scaling is useless, skip it
        if (x === 1 && y === 1) {
            return this;
        }

        // If the last order is also a scaling and we wind up back at a factor of 1, remove it and do nothing new
        if (this.list.length > 0) {
            const last = this.list[this.list.length - 1];
            if (last.type === "scale") {
                if (last.arg0 * x === 1 && last.arg1 * y === 1) {
                    this.list.pop();
                    return this;
                } else {
                    // Otherwise, combine them
                    last.arg0 *= x;
                    last.arg1 *= y;
                    return this;
                }
            }
        }

        this.list.push({
            type: "scale",
            arg0: x,
            arg1: y,
        });
        this.#assertLength();

        return this;
    }

    /** Converts the current list of transformation orders into an array, so it can be applied to the shader's transformation uniform */
    toArray(): number[] {
        const a: number[] = [];
        for (let i = 0; i < this.list.length; i++) {
            const order = this.list[i];
            switch (order.type) {
                case ("translate"): {
                    a.push(1);
                    break;
                }
                case ("rotate"): {
                    a.push(2);
                    break;
                }
                case ("scale"): {
                    a.push(3);
                    break;
                }
            }
            a.push(order.arg0);
            a.push(order.arg1);
        }

        // Pad the end of the array with zeros
        while (a.length < MAX_TRANSFORMATIONS * 3) {
            a.push(0);
        }

        return a;
    }

    /** Ensures our list of transformations doesn't exceed the maximum afforded by our shader */
    #assertLength() {
        if (this.list.length > MAX_TRANSFORMATIONS) {
            throw new TransformError(`Too many transformations applied!`);
        }
    }
}

/** Describes problems creating or converting transformations */
export class TransformError extends Error {};