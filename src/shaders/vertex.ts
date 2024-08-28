export const MAX_TRANSFORMATIONS = 16;

const src = `#version 300 es
#define MAX_TRANSFORMATIONS ${MAX_TRANSFORMATIONS}
in vec2 a_position;
in vec2 a_texture;
out vec2 v_texcoord;

uniform mat3 u_position_matrix;
uniform mat3 u_texture_matrix;

uniform vec3 u_transformations[MAX_TRANSFORMATIONS];

void main() {

    // Potential problems here you'll have to test later:
    // - Are our matrix multiplications happening in the right order? Do we need to reverse operands, or even reverse the order of transformations?
    // - Are we initializing the transform matrices in the right column order?

    vec3 positions = u_position_matrix * vec3(a_position, 1.0);
    for (int i = 0; i < MAX_TRANSFORMATIONS; i++) {
        if (u_transformations[i][0] == 0.0) {
            // No (more) transformations
            break;
        }
        vec3 transform = u_transformations[i];
        if (transform[0] == 1.0) {
            // Translation
            float translate_x = transform[1];
            float translate_y = transform[2];
            positions *= mat3(
                vec3(1.0, 0.0, translate_x),
                vec3(0.0, 1.0, translate_y),
                vec3(0.0, 0.0, 1.0)
            );
        }
        if (transform[0] == 2.0) {
            // Rotation
            float rotate_radians = transform[1];
            float s = sin(rotate_radians);
            float c = cos(rotate_radians);
            positions *= mat3(
                vec3(c, s, 0.0),
                vec3(-s, c, 0.0),
                vec3(0.0, 0.0, 1.0)
            );
        }
        if (transform[0] == 3.0) {
            // Scale
            float scale_x = transform[1];
            float scale_y = transform[2];
            positions *= mat3(
                vec3(scale_x, 0.0, 0.0),
                vec3(0.0, scale_y, 0.0),
                vec3(0.0, 0.0, 1.0)
            );
        }
    }
    gl_Position = vec4(positions.xy, 0, 1);
    v_texcoord = (u_texture_matrix * vec3(a_texture, 1.0)).xy;
}`;

export default src;