/** A collection of images to be rendered */
export interface Sprite {
    /** Width of the sprite's images, in pixels */
    width: number;

    /** Height of the sprite's images, in pixels */
    height: number;

    /** List of the images that comprise this sprite */
    images: SpriteImage[];
}

/** Presents one image in a Sprite's animation cycle */
export interface SpriteImage {
    /** X location of this image within the atlas texture */
    x: number;

    /** Y location of this image within the atlas texture */
    y: number;

    /** Pre-computed texture matrix that transforms the unit quad into clipspace to select this image from the atlas texture */
    t: [
        number, number, number,
        number, number, number,
        number, number, number
    ];
}

/** Loaded data of a sprite used to compile the atlas texture */
export interface SpriteData {
    /** Identifier of the sprite */
    name: string;

    /** List of images that comprise this sprite */
    images: {
        /** Loaded data that represents this image */
        data: Buffer;
    }[];
}