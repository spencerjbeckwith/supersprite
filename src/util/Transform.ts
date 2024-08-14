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
        // TODO
        return this;
    }

    /** Adds a translation to the end of the transformation list */
    translate(x: number, y: number): Transform {
        // TODO
        return this;
    }

    /** Adds a rotation (in degrees) to the end of the transformation list */
    rotateDeg(degrees: number): Transform {
        // TODO
        return this;
    }

    /** Adds a rotation (in radians) to the end of the transformation list */
    rotateRad(radians: number): Transform {
        // TODO
        return this;
    }

    /** Adds a scaling to the end of the transformation list */
    scale(x: number, y: number): Transform {
        // TODO 
        return this;
    }

    /** Converts the current list of transformation orders into an array, so it can be applied to the shader's transformation uniform */
    toArray(): number[] {
        // TODO
        return [];
    }
}

/** Describes problems creating or converting transformations */
export class TransformError extends Error {};