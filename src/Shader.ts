import defaultVertexSource from "./shaders/vertex";
import defaultFragmentSource from "./shaders/fragment";

const UNIT_QUAD = [
    // Triangle 1:
    0, 0,
    0, 1,
    1, 1,
    // Triangle 2:
    1, 1,
    1, 0,
    0, 0,
];

export class Shader {

    gl: WebGL2RenderingContext;
    ready: boolean;
    attributes: {
        position: number;
        texture: number;
    }

    constructor(gl: WebGL2RenderingContext) {
        this.gl = gl;
        this.ready = false;
        // TODO...?
        this.attributes = {
            position: 0,
            texture: 0,
        }
    }

    createShader(type: "vertex" | "fragment", source: string) {
        // TODO
    }

    createShaderProgram() {
        // TODO
    }

    setPositions() {
        // TODO
    }

    setUVs() {
        // TODO
    }

}

export class ShaderError extends Error {}