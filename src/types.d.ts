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

interface AtlasTextureObject {
    image: HTMLImageElement; 
    texture: WebGLTexture;
}

/** A function to transform sprite matrices. A matrix is provided as an argument, which should be returned with transformations applied via the matrix's methods. */
type TransformerFn = (mat: Matrix) => Matrix;

interface ShaderAttributes {
    position: number;
    texture: number;
}

interface ShaderUniforms {
    positionMatrix: WebGLUniformLocation;
    textureMatrix: WebGLUniformLocation;
    blend: WebGLUniformLocation;
    image: WebGLUniformLocation;
}