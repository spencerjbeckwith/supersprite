import Color from './util/color.js';
import Matrix from './util/matrix.js';
import { initialize, Supersprite, SuperspriteOptions } from './sprite.js';
import { Sprite, SpriteImage, Draw, DrawTextOptions } from './draw.js';
import { MainShader, MainShaderAttributes, MainShaderBuffers, MainShaderUniforms, MainShaderOptions } from './shader.js';

let supersprite: Supersprite, shader: MainShader, draw: Draw;
/** Initializes supersprite and defines the "shader" and "draw" exports. This must be called before doing anything else with supersprite. */
function init(options?: SuperspriteOptions) {
    supersprite = initialize(options);
    shader = supersprite.main;
    draw = supersprite.draw;
}

export {
    init,
    supersprite,
    shader,
    draw,

    Color,
    Matrix,
    Sprite,
    SpriteImage,
    Draw,
    DrawTextOptions,
    MainShader,
    MainShaderAttributes,
    MainShaderBuffers,
    MainShaderUniforms,
    MainShaderOptions,
}