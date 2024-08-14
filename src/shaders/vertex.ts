const src = 
`#version 300 es
#define MAX_TRANSFORMATIONS 16
in vec2 a_position;
in vec2 a_texture;
out vec2 v_texcoord;

uniform mat3 u_position_matrix;
uniform mat3 u_texture_matrix;
uniform vec4 u_transformations[MAX_TRANSFORMATIONS];

void main() {
    gl_Position = vec4( (u_position_matrix * vec3(a_position, 1.0) ).xy, 0, 1);
    v_texcoord = ( u_texture_matrix * vec3(a_texture, 1.0) ).xy;
}`;

export default src;