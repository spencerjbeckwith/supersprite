import { Shader, ShaderError } from "./Shader";
import expect from "expect";
import sinon from "sinon";

describe("Shader", () => {

    const gl = new HTMLCanvasElement().getContext("webgl2")!;
    
    // Make our critical mock functions return truthy objects like they normally would
    // and we'll stub these when we test for errors to be thrown
    gl.createShader = () => ({});
    gl.createProgram = () => ({});
    gl.createBuffer = () => ({});
    gl.getUniformLocation = () => ({});
    gl.createVertexArray = () => ({});

    it("creates and uses a ShaderProgram when initialized", () => {
        const spy = sinon.spy(gl, "useProgram");
        new Shader(gl);
        expect(spy.called).toBe(true);
        spy.restore();
    });

    // Are all these "throws" tests even worth anything?
    // Meh, I already wrote them.

    it("throws if a shader cannot be created", () => {
        const s = sinon.stub(gl, "createShader");
        s.returns(null);
        expect(() => {
            new Shader(gl);
        }).toThrow(ShaderError);
        s.restore();
    });

    it("throws if a shader fails to compile", () => {
        const s = sinon.stub(gl, "getShaderParameter");
        s.returns(false);
        expect(() => {
            new Shader(gl);
        }).toThrow(ShaderError);
        s.restore();
    });

    it("throws if the shader program cannot be created", () => {
        const s = sinon.stub(gl, "createProgram");
        // @ts-ignore
        s.returns(null);
        expect(() => {
            new Shader(gl);
        }).toThrow(ShaderError);
        s.restore();
    });

    it("throws if the shaders cannot be linked", () => {
        const s = sinon.stub(gl, "getProgramParameter");
        s.returns(null);
        expect(() => {
            new Shader(gl);
        }).toThrow(ShaderError);
        s.restore();
    });

    it("throws if buffers cannot be created", () => {
        const s = sinon.stub(gl, "createBuffer");
        // @ts-ignore
        s.returns(null);
        expect(() => {
            new Shader(gl);
        }).toThrow(ShaderError);
        s.restore();
    });

    it("throws if uniforms cannot be located", () => {
        const s = sinon.stub(gl, "getUniformLocation");
        s.returns(null);
        expect(() => {
            new Shader(gl);
        }).toThrow(ShaderError);
        s.restore();
    });

    it("throws if vertex array cannot be created", () => {
        const s = sinon.stub(gl, "createVertexArray");
        // @ts-ignore
        s.returns(null);
        expect(() => {
            new Shader(gl);
        }).toThrow(ShaderError);
        s.restore();
    });

    it("sets position attributes via setPositions", () => {
        const s1 = sinon.stub(gl, "getAttribLocation")
        s1.onFirstCall().returns(11); // position
        s1.onSecondCall().returns(22); // texture
        const s2 = sinon.stub(gl, "vertexAttribPointer");
        const shader = new Shader(gl);
        shader.setPositions();
        expect(s2.getCall(0).args[0] === 11);
        s1.restore();
        s2.restore();
    });

    it("sets texture attributes via setUVs", () => {
        const s1 = sinon.stub(gl, "getAttribLocation")
        s1.onFirstCall().returns(11); // position
        s1.onSecondCall().returns(22); // texture
        const s2 = sinon.stub(gl, "vertexAttribPointer");
        const shader = new Shader(gl);
        shader.setUVs();
        expect(s2.getCall(0).args[0] === 22);
        s1.restore();
        s2.restore();
    });
});