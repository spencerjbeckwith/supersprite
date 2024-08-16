import { Draw, DrawError, Sprite } from "./Draw";
import expect from "expect";
import { Shader } from "./Shader";
import { Color } from "./util/Color";
import { Timer } from "./util/Timer";
import sinon from "sinon";
import { Transform } from "./util/Transform";

/** To help us track GL/ctx state in our tests - used in this file only */
class Spy {
    shader: Shader;
    gl: WebGL2RenderingContext;
    ctx: CanvasRenderingContext2D;
    positions: number[] = [];
    UVs: number[] = [];
    vaoWasBound: boolean;
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
                transformations: "transformations" as WebGLUniformLocation,
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
            if (!this.vaoWasBound && vao) {
                this.vaoWasBound = true;
            }
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

        this.vaoWasBound = false;
        this.vaoBound = false;
        this.uniforms = {};
        this.drawn = false;
    }

    reset() {
        this.positions = [];
        this.UVs = [];
        this.vaoWasBound = false;
        this.vaoBound = false;
        this.uniforms = {};
        this.drawn = false;
    }
}

describe("Draw", () => {

    const spy = new Spy();
    const timer = new Timer();
    const projection = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    const draw = new Draw(spy.shader, spy.gl, spy.ctx, projection, timer);
    const dateStub = sinon.stub(Date, "now");
    
    const s: Sprite = {
        width: 16,
        height: 32,
        images: [{
            x: 0,
            y: 0,
            t: [0, 0, 0, 0, 0, 0, 0, 0, 0],
        },{
            x: 16,
            y: 16,
            t: [1, 1, 1, 1, 1, 1, 1, 1, 1],
        },{
            x: 32,
            y: 32,
            t: [2, 2, 2, 2, 2, 2, 2, 2, 2],
        }]
    };

    afterEach(() => {
        spy.reset();
    });
    after(() => {
        dateStub.restore();
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

        it("sets position uniform to the projection matrix", () => {
            draw.preparePrimitive([]);
            expect(spy.uniforms.positionMatrix.length).toBe(9);
            for (let i = 0; i <= 8; i++) {
                expect(spy.uniforms.positionMatrix[i]).toBe(i);
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
            expect(spy.uniforms.textured[0]).toBe(0);
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
        it("sets the correct number of vertices", () => {
            // Should be six vertices, since we draw two triangles to make a the rectangle
            draw.rect(10, 20, 30, 40);
            expect(spy.positions.length).toBe(12); // 2 points per vertex
        });

        it("makes the draw call", () => {
            draw.rect(10, 20, 30, 40);
            expect(spy.drawn).toBeTruthy();
        });
    });

    describe("circle()", () => {
        it("sets the correct number of vertices depending on segments", () => {
            // Should have: 2 points for center + 2 points per segment + closing point
            // Meaning 10 segments -> 2 + 2 * 10 + 2 = 24
            draw.circle(10, 10, 10, 10);
            expect(spy.positions.length).toBe(24);
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
        it("binds and unbinds the vao", () => {
            draw.sprite(s, 0, 0, 0);
            expect(spy.vaoWasBound).toBe(true);
            expect(spy.vaoBound).toBe(false);
        });
    });

    describe("spriteAnim()", () => {
        it("draws the correct image based on the timer", () => {
            dateStub.returns(0);
            draw.timer = new Timer();
            dateStub.returns(2500);
            draw.timer.increment(); // 2.5 seconds in, at 0.5 images per second, should draw image 1
            draw.spriteAnim(s, 0.5, 0, 0);
            expect(spy.uniforms.textureMatrix[0]).toBe(1);
        });
    });

    describe("spriteSpecial()", () => {
        it("does not bind the vao", () => {
            draw.spriteSpecial(s, 0, 0, 0);
            expect(spy.vaoWasBound).toBe(false);
            expect(spy.vaoBound).toBe(false);
        });

        it("translates by the given position and scales sprite to the correct size", () => {
            draw.spriteSpecial(s, 0, 25, 50);
            const u = spy.uniforms.transformations;
            expect(u[0]).toBe(1); // translate the sprite...
            expect(u[1]).toBe(25); // ...by 25 pixels horizontally...
            expect(u[2]).toBe(50); // ...and by 50 pixels verticlaly...
            expect(u[3]).toBe(3); // ...while scaling the sprite...
            expect(u[4]).toBe(16); // ...16 pixels horizontally...
            expect(u[5]).toBe(32); // ...and 32 pixels vertically.
        });

        it("adds additional transformations", () => {
            // translation can't be 0, because then the transformation chain is shortened
            // and the values we're checking would be different
            draw.spriteSpecial(s, 0, 1, 1, undefined, new Transform().rotateRad(Math.PI));
            const u = spy.uniforms.transformations;
            // use 6 because that's after both a translation and a scale
            expect(u[6]).toBe(2); // Rotation
            expect(u[7]).toBeCloseTo(Math.PI);
        });

        it("limits the drawn image", () => {
            draw.spriteSpecial(s, -2, 0, 0);
            expect(spy.uniforms.textureMatrix[0]).toBe(0); // image 0
            draw.spriteSpecial(s, 7, 0, 0);
            expect(spy.uniforms.textureMatrix[0]).toBe(1); // image 1 (from modulo wrap)
        });

        it("uses texture", () => {
            draw.spriteSpecial(s, 2, 0, 0);
            expect(spy.uniforms.textured[0]).toBeTruthy();
        });

        it("sets texture positions according to the sprite object", () => {
            draw.spriteSpecial(s, 2, 0, 0);
            for (let i = 0; i < 9; i++) {
                // Stub sprite has image index value in the texture matrix
                expect(spy.uniforms.textureMatrix[i]).toBe(2);
            }
        });

        it("makes the draw call", () => {
            draw.spriteSpecial(s, 2, 0, 0);
            expect(spy.drawn).toBe(true);
        });
    });

    describe("spriteSpecialAnim()", () => {
        it("draws the correct image based on the timer", () => {
            dateStub.returns(0);
            draw.timer = new Timer();
            dateStub.returns(4500);
            draw.timer.increment(); // 4.5 seconds in, at 1 image per second, should draw image 1
            draw.spriteSpecialAnim(s, 1, 0, 0);
            expect(spy.uniforms.textureMatrix[0]).toBe(1);
        });
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