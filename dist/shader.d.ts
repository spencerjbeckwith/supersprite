/** The access point for all properties/methods directly related to the main shader itself */
interface MainShader {
    /** The main vertex shader */
    vertex: WebGLShader;
    /** The main fragment shader */
    fragment: WebGLShader;
    /** The main shader program used by supersprite */
    program: WebGLProgram;
    /** The main vertex array object used by supersprite, recording a unit quad for non-transformed sprites */
    vao: WebGLVertexArrayObject | null;
    /** Provides access to all attributes available on the main shader. Feel free to extend this to add more. */
    attributes: MainShaderAttributes;
    /** Provides access to all uniforms available on the main shader. Feel free to extend this to add more. */
    uniforms: MainShaderUniforms;
    /** Provides access to all buffers used by supersprite */
    buffers: MainShaderBuffers;
    /** Creates a new shader. */
    createShader: (type: number, source: string) => WebGLShader;
    /** Sets the drawing vertex positions for the next GL draw call. If no argument, will set the positions to the default, a unit quad.*/
    setPositions: (positions?: number[]) => void;
    /** Sets the UV texture positions for the next GL draw call. If no argument, will set the positions to the default, a unit quad. */
    setUVs: (positions?: number[]) => void;
}
/** Contains all attributes */
interface MainShaderAttributes {
    position: number;
    texture: number;
}
/** Contains all uniforms */
interface MainShaderUniforms {
    positionMatrix: WebGLUniformLocation;
    textureMatrix: WebGLUniformLocation;
    atlasSampler: WebGLUniformLocation;
    blend: WebGLUniformLocation;
    useTexture: WebGLUniformLocation;
}
/** Contains all buffers */
interface MainShaderBuffers {
    square: WebGLBuffer;
    position: WebGLBuffer;
    texture: WebGLBuffer;
}
/** Use this to substitute the main shader's source. Note you must have the same number of attributes/uniforms and their names must be present. */
interface MainShaderOptions {
    source: {
        vertex: string;
        fragment: string;
    };
    /** The names of each attribute, as they appear in the shader source */
    attributes: {
        position: string;
        texture: string;
    };
    /** The names of each uniform, as they appear in the shader source */
    uniforms: {
        positionMatrix: string;
        textureMatrix: string;
        atlas: string;
        blend: string;
        useTexture: string;
    };
}
/** Used internally to initialize the main shader */
declare function prepareMainShader(gl: WebGL2RenderingContext, options?: MainShaderOptions): MainShader;
export { MainShader, MainShaderAttributes, MainShaderBuffers, MainShaderUniforms, MainShaderOptions, prepareMainShader, };
