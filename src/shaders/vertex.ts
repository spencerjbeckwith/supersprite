const src = 
`#version 300 es
in vec2 a_position;
in vec2 a_texcoord;
out vec2 v_texcoord;
uniform mat3 u_positionMatrix;
uniform mat3 u_textureMatrix;

void main() {
    gl_Position = vec4( (u_positionMatrix * vec3(a_position, 1.0) ).xy, 0, 1);
    v_texcoord = ( u_textureMatrix * vec3(a_texcoord, 1.0) ).xy;
}`;

export default src;