const src =
`#version 300 es
precision mediump float;
in vec2 v_texcoord;
out vec4 out_color;
uniform sampler2D u_atlas;
uniform vec4 u_blend;

uniform int u_textured;

void main() {
    if (u_textured == 0) {
        out_color = u_blend;
    } else {
        out_color = texture(u_atlas, v_texcoord) * u_blend;
    }
}`;

export default src;