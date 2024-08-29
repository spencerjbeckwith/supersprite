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
    _ctx: CanvasRenderingContext2D;
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
        this.gl.uniform3fv = (location: string, data: number[]) => {
            this.uniforms[location] = data;
        }
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
        this._ctx = c2.getContext("2d")!;

        // Stubs for context methods we want to watch
        // @ts-ignore have to ignore for sake of a strange overload problem I don't feel like solving
        this._ctx.drawImage = sinon.stub();
        this._ctx.fillText = sinon.stub();
        this._ctx.measureText = (text: string) => {
            return {
                width: text.length,
            } as TextMetrics;
        }

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
        (this._ctx.drawImage as sinon.SinonStub).resetHistory();
        (this._ctx.fillText as sinon.SinonStub).resetHistory();
    }

    get ctx() {
        return {
            ...this._ctx,
            drawImage: this._ctx.drawImage as sinon.SinonStub,
            fillText: this._ctx.fillText as sinon.SinonStub,
        };
    }
}

describe("Draw", () => {

    const spy = new Spy();
    const timer = new Timer();
    const projection = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    const draw = new Draw(spy.shader, spy.gl, spy._ctx, {} as CanvasImageSource, projection, timer);
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

        it("applies blend when provided", () => {
            draw.spriteSpecial(s, 0, 0, 0, undefined, undefined, new Color("#001020"));
            expect(spy.uniforms.blend[0]).toBe(0);
            expect(spy.uniforms.blend[1]).toBeCloseTo(16 / 256);
            expect(spy.uniforms.blend[2]).toBeCloseTo(32 / 256);
            expect(spy.uniforms.blend[3]).toBe(1);
        });

        it("applies default blend", () => {
            draw.spriteSpecial(s, 0, 0, 0, undefined, undefined, undefined);
            for (let i = 0; i <= 3; i++) {
                expect(spy.uniforms.blend[i]).toBe(1);
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
        it("throws if the 2d context isn't initialized", () => {
            const d = new Draw(spy.shader, spy.gl, null, null, [], timer);
            expect(() => {
                d.spriteCtx(s, 0, 0, 0);
            }).toThrow(DrawError);
        });

        it("throws if there was no atlas image specified", () => {
            const d = new Draw(spy.shader, spy.gl, spy._ctx, null, [], timer);
            expect(() => {
                d.spriteCtx(s, 0, 0, 0);
            }).toThrow(DrawError);
        });

        it("limits the drawn image", () => {
            draw.spriteCtx(s, -2, 0, 0);
            expect(spy.ctx.drawImage.args[0][1]).toBe(s.images[0].x);
            expect(spy.ctx.drawImage.args[0][2]).toBe(s.images[0].y);
            draw.spriteCtx(s, 7, 0, 0);
            expect(spy.ctx.drawImage.args[1][1]).toBe(s.images[1].x);
            expect(spy.ctx.drawImage.args[1][2]).toBe(s.images[1].y);
        });

        it("makes the draw call", () => {
            draw.spriteCtx(s, 2, 0, 0);
            expect(spy.ctx.drawImage.called).toBeTruthy();
        });

        it("draws at the correct position and scale", () => {
            draw.spriteCtx(s, 0, 12, 18, 1.5, 0.5);
            expect(spy.ctx.drawImage.args[0][5]).toBe(12);
            expect(spy.ctx.drawImage.args[0][6]).toBe(18);
            expect(spy.ctx.drawImage.args[0][7]).toBeCloseTo(s.width * 1.5);
            expect(spy.ctx.drawImage.args[0][8]).toBeCloseTo(s.height * 0.5);
        });

        it("draws using the correct atlas coordinates", () => {
            // Image2 in our mock is at 32, 32 in our "atlas"
            draw.spriteCtx(s, 2, 0, 0);
            expect(spy.ctx.drawImage.args[0][1]).toBe(32);
            expect(spy.ctx.drawImage.args[0][2]).toBe(32);
            expect(spy.ctx.drawImage.args[0][3]).toBe(s.width);
            expect(spy.ctx.drawImage.args[0][4]).toBe(s.height);
        });
    });

    describe("spriteCtxAnim()", () => {
        it("draws the correct image based on the timer", () => {
            dateStub.returns(0);
            draw.timer = new Timer();
            dateStub.returns(2500);
            draw.timer.increment(); // 2.5 seconds in, at 0.5 images per second, should draw image 1
            // and image 1 is at 16, 16 in our "atlas"
            draw.spriteCtxAnim(s, 0.5, 0, 0);
            expect(spy.ctx.drawImage.args[0][1]).toBe(16);
            expect(spy.ctx.drawImage.args[0][2]).toBe(16);
        });
    });

    describe("text()", () => {
        it("throws if the 2d context isn't initialized", () => {
            const d = new Draw(spy.shader, spy.gl, null, null, [], timer);
            expect(() => {
                d.text("hi", 0, 0);
            }).toThrow(DrawError);
        });

        it("sets context options to defaults", () => {
            draw.text("hi", 0, 0);
            expect(spy.ctx.textAlign).toBe("left");
            expect(spy.ctx.textBaseline).toBe("top");
            expect(spy.ctx.font).toBe("12px Arial");
            expect(spy.ctx.fillStyle).toBe("#fafafa");
        });

        it("sets context options when provided", () => {
            draw.text("hi", 0, 0, {
                hAlign: "right",
                vAlign: "bottom",
                fontName: "Comic Sans MS",
                fontSize: 69,
                textColor: "#ee00ff", 
            });
            expect(spy.ctx.textAlign).toBe("right");
            expect(spy.ctx.textBaseline).toBe("bottom");
            expect(spy.ctx.font).toBe("69px Comic Sans MS");
            expect(spy.ctx.fillStyle).toBe("#ee00ff");
        });

        it("draws a shadow", () => {
            draw.text("hi", 0, 0, {
                drawShadow: true,
            });
            expect(spy.ctx.fillText.calledTwice).toBe(true);
        });

        it("makes the draw call", () => {
            draw.text("hi", 0, 0);
            expect(spy.ctx.fillText.calledOnce).toBe(true);
        });

        it("draws nothing if text is empty", () => {
            draw.text("", 0, 0);
            expect(spy.ctx.fillText.called).toBeFalsy();
        });
    });

    describe("textWrap()", () => {
        // For these tests, measureText returns the number of characters,
        // when in reality it would be a pixel width.

        it("throws if the 2d context isn't initialized", () => {
            const d = new Draw(spy.shader, spy.gl, null, null, [], timer);
            expect(() => {
                d.textWrap("hi", 0, 0, 10);
            }).toThrow(DrawError);
        });

        it("doesn't split when text isn't wide enough", () => {
            draw.textWrap("a", 0, 0, 10);
            expect(spy.ctx.fillText.callCount).toBe(1);
        });;

        it("splits when width is too wide", () => {
            draw.textWrap("12345 12345", 0, 0, 4);
            expect(spy.ctx.fillText.calledTwice).toBe(true);
        });

        it("splits on the nearest split character", () => {
            draw.textWrap("aaa bbb", 0, 0, 2);
            expect(spy.ctx.fillText.calledTwice).toBe(true);
            expect(spy.ctx.fillText.args[0][0]).toBe("aaa");
            expect(spy.ctx.fillText.args[1][0]).toBe("bbb");
        });

        it("aligns to the middle", () => {
            draw.textWrap("aaa bbb ccc", 0, 50, 3, {
                vAlign: "middle",
            });
            expect(spy.ctx.fillText.args[0][2]).toBeLessThan(50);
            expect(spy.ctx.fillText.args[1][2]).toBe(50);
            expect(spy.ctx.fillText.args[2][2]).toBeGreaterThan(50);
        });

        it("aligns to the bottom", () => {
            draw.textWrap("aaa bbb ccc", 0, 50, 3, {
                vAlign: "bottom",
            });
            expect(spy.ctx.fillText.args[0][2]).toBeLessThan(spy.ctx.fillText.args[1][2]);
            expect(spy.ctx.fillText.args[1][2]).toBeLessThan(50);
            expect(spy.ctx.fillText.args[2][2]).toBe(50);
        });

        it("separates lines by the separation height", () => {
            draw.textWrap("aaa bbb", 0, 40, 2, {
                lineSeparation: 13,
            });
            expect(spy.ctx.fillText.args[0][2]).toBe(40);
            expect(spy.ctx.fillText.args[1][2]).toBe(53);
        });

        it("includes breaking characters in resulting text, except spaces", () => {
            draw.textWrap("aa/bbbb", 0, 0, 2);
            expect(spy.ctx.fillText.args[0][0]).toBe("aa/");
            expect(spy.ctx.fillText.args[1][0]).toBe("bbbb");
        });

        it("does not include spaces immediately after a break", () => {
            draw.textWrap("aaaaaa    b", 0, 0, 6);
            expect(spy.ctx.fillText.args[0][0]).toBe("aaaaaa");
            expect(spy.ctx.fillText.args[1][0]).toBe("b");
        });
    });
});