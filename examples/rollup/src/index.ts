import { Shader, Presenter } from "supersprite";

const p = new Presenter({
    baseWidth: 400,
    baseHeight: 320,
});

const s = new Shader(p.gl);

// TODO: write a proper rollup example
// I added this in the meantime to ensure the shaders actually compiled right