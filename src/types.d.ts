interface ShaderOptions {
    /** Source for the vertex shader of this program. */
    vertexSource: string;
    /** Source for the fragment shader of this program. */
    fragmentSource: string;
    /** If true, the shader will attempt to set texture attributes and uniforms. */
    useTexture: boolean;
    /** Names of the attributes and uniforms of this program as they appear in the source. */
    names: {
        positionAttribute: string;
        positionUniform: string;
        blendUniform: string;
        textureAttribute?: string;
        textureUniform?: string;
    }
}

interface Sprite {
    width: number;
    height: number;
    originX: number;
    originY: number;
    images: SpriteImage[];
}

interface SpriteImage {
    x: number;
    y: number;
    /** A precomputed 3x3 matrix, used to slice this sprite image out of the texture atlas. */
    t: [number, number, number, number, number, number, number, number, number];
}

/** A function to transform sprite matrices. A matrix is provided as an argument, which should be returned with transformations applied via the matrix's methods. */
type TransformerFn = (mat: Matrix) => Matrix;
