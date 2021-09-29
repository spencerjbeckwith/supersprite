import Color from './util/color.js';
import Matrix from './util/matrix.js';
import { initialize } from './sprite.js';
let supersprite, shader, draw;
/** Initializes supersprite and defines the "shader" and "draw" exports. This must be called before doing anything else with supersprite. */
function init(options) {
    supersprite = initialize(options);
    shader = supersprite.main;
    draw = supersprite.draw;
}
export { init, supersprite, shader, draw, Color, Matrix, };
