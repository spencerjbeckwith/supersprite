const src =
`#version 300 es
precision mediump float;
in vec2 v_texcoord;
out vec4 outputColor;
uniform sampler2D u_atlas;
uniform vec4 u_blend;

uniform int u_useTexture;

void main() {
    if (u_useTexture == 0) {
        outputColor = u_blend;
    } else {
        outputColor = texture(u_atlas, v_texcoord) * u_blend;
    }
}`;

export default src;