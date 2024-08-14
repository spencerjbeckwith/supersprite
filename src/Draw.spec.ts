import { Draw, DrawError } from "./Draw";
import expect from "expect";
import { Shader } from "./Shader";
import { Color } from "./Color";

/** To help us track GL/ctx state in our tests - used in this file only */
class Spy {
    shader: Shader;
    gl: WebGL2RenderingContext;
    ctx: CanvasRenderingContext2D;
    positions: number[] = [];
    UVs: number[] = [];
    vaoBound: boolean;
    uniforms: {
        [name: string]: number[];
    }
    drawn: boolean;

    constructor() {
        this.shader = {
            setPositions: (pos) => {
                if (pos) {
                    this.positions = pos;
                }
            },
            setUVs: (UVs) => {
                if (UVs) {
                    this.UVs = UVs;
                }
            },
            vao: {},
            attributes: {
                position: 0,
                texture: 1,
            },
            uniforms: {
                // Substitute the name for each uniform so we can track it more easily in our spy
                positionMatrix: "positionMatrix" as WebGLUniformLocation,
                textureMatrix: "textureMatrix" as WebGLUniformLocation,
                atlas: "atlas" as WebGLUniformLocation,
                blend: "blend" as WebGLUniformLocation,
                textured: "textured" as WebGLUniformLocation,
                // TODO: expand this list when there are more uniforms configured by our draw calls
            },
        } as Shader;

        const c1 = new HTMLCanvasElement();
        this.gl = c1.getContext("webgl2")!;

        // Stubs for GL methods we want to watch
        // Here we use string for locations, but thats because our Shader is set to use strings here
        // This is so we can easily index this uniforms object without actually needing WebGLUniformLocation objects at all
        this.gl.uniformMatrix3fv = (location: string, transpose: GLboolean, data: number[]) => {
            this.uniforms[location] = data;
        };
        this.gl.uniform1i = (location: string, value: number) => {
            this.uniforms[location] = [value];
        };
        this.gl.uniform4f = (location: string, r: number, g: number, b: number, a: number) => {
            this.uniforms[location] = [r, g, b, a];
        };
        this.gl.bindVertexArray = (vao: any) => {
            this.vaoBound = vao ? true : false;
        };
        this.gl.drawArrays = () => {
            this.drawn = true;
        }

        const c2 = new HTMLCanvasElement();
        this.ctx = c2.getContext("2d")!;

        // Stubs for context methods we want to watch
        // TODO: stubs for ctx for Draw tests
        // this.ctx.drawImage = ...
        // this.ctx.fillText = ...
        // this.ctx.measureText = ...

        this.vaoBound = false;
        this.uniforms = {};
        this.drawn = false;
    }

    reset() {
        this.positions = [];
        this.UVs = [];
        this.vaoBound = false;
        this.uniforms = {};
        this.drawn = false;
    }
}

describe("Draw", () => {

    const spy = new Spy();
    const draw = new Draw(spy.shader, spy.gl, spy.ctx);

    afterEach(() => {
        spy.reset();
    });

    describe("preparePrimitive", () => {
        it("uses color", () => {
            draw.preparePrimitive([], new Color(0.25, 0.5, 0.75, 1));
            expect(spy.uniforms.blend.length).toBe(4)
            expect(spy.uniforms.blend[0]).toBe(0.25);
            expect(spy.uniforms.blend[1]).toBe(0.5);
            expect(spy.uniforms.blend[2]).toBe(0.75);
            expect(spy.uniforms.blend[3]).toBe(1);
        });

        it("sets position uniform to a projection matrix", () => {
            expect(spy.uniforms.positionMatrix.length).toBe(9);
            for (let i = 0; i <= 8; i++) {
                expect(spy.uniforms.positionMatrix[i]).toBe(i % 4 === 0 ? 1 : 0);
            }
        });

        it("sets vertices correctly", () => {
            draw.preparePrimitive([10, 20, 30, 40], new Color("#112233"));
            expect(spy.positions.length).toBe(4);
            expect(spy.positions[0]).toBe(10);
            expect(spy.positions[1]).toBe(20);
            expect(spy.positions[2]).toBe(30);
            expect(spy.positions[3]).toBe(40);
        });

        it("uses default color if none is set", () => {
            draw.preparePrimitive([]);
            expect(spy.uniforms.blend.length).toBe(4)
            expect(spy.uniforms.blend[0]).toBe(1);
            expect(spy.uniforms.blend[1]).toBe(1);
            expect(spy.uniforms.blend[2]).toBe(1);
            expect(spy.uniforms.blend[3]).toBe(1);
        });

        it("disables texture", () => {
            draw.preparePrimitive([]);
            expect(spy.uniforms.textured).toBe(0);
        });
    });

    describe("line()", () => {
        it("sets the vertices correctly", () => {
            draw.line(10, 20, 30, 40);
            expect(spy.positions.length).toBe(4);
            expect(spy.positions[0]).toBe(10);
            expect(spy.positions[1]).toBe(20);
            expect(spy.positions[2]).toBe(30);
            expect(spy.positions[3]).toBe(40);
        });

        it("makes the draw call", () => {
            draw.line(10, 20, 30, 40);
            expect(spy.drawn).toBeTruthy();
        });
    });

    describe("rect()", () => {
        it("sets the vertices correctly", () => {
            draw.rect(10, 20, 30, 40);
            expect(spy.positions.length).toBe(4);
            expect(spy.positions[0]).toBe(10);
            expect(spy.positions[1]).toBe(20);
            expect(spy.positions[2]).toBe(30);
            expect(spy.positions[3]).toBe(40);
        });

        it("makes the draw call", () => {
            draw.rect(10, 20, 30, 40);
            expect(spy.drawn).toBeTruthy();
        });
    });

    describe("circle()", () => {
        it("sets the correct number of vertices depending on segments", () => {
            // Should have: 2 for center + 2 per segment
            draw.circle(10, 10, 10, 10);
            expect(spy.positions.length).toBe(30);
            expect(spy.positions[0]).toBe(10); // only assert on the center point
            expect(spy.positions[1]).toBe(10);
        });

        it("makes the draw call", () => {
            draw.circle(0, 0, 10, 10);
            expect(spy.drawn).toBeTruthy();
        });
    });

    describe("primitive()", () => {
        it ("sets the vertices correctly", () => {
            draw.primitive("LINES", [10, 20, 30, 40, 50, 60]);
            expect(spy.positions.length).toBe(6);
            expect(spy.positions[0]).toBe(10);
            expect(spy.positions[1]).toBe(20);
            expect(spy.positions[2]).toBe(30);
            expect(spy.positions[3]).toBe(40);
            expect(spy.positions[4]).toBe(50);
            expect(spy.positions[5]).toBe(60);
        });

        it("makes the draw call", () => {
            draw.primitive("LINES", [10, 20]);
            expect(spy.drawn).toBeTruthy();
        });
    });

    describe("sprite()", () => {
        // TODO test draw.sprite()
    });

    describe("spriteAnim()", () => {
        // TODO test draw.spriteAnim()
    });

    describe("spriteSpecial()", () => {
        // TODO test draw.spriteSpecial()
    });

    describe("spriteSpecialAnim()", () => {
        // TODO test draw.spriteSpecialAnim()
    });

    describe("spriteCtx()", () => {
        // TODO test draw.spriteCtx()
    });

    describe("spriteCtxAnim()", () => {
        // TODO test draw.spriteCtxAnim()
    });

    describe("text()", () => {
        // TODO test draw.text()
    });

    describe("textWrap()", () => {
        // TODO test draw.textWrap()
    });
});