export let WorldMatrixUniform: string = /*wgsl*/ `
    struct Uniforms {
        matrix : array<mat4x4<f32>>
    };

    @group(0) @binding(1)
    var<storage, read> models : Uniforms;
`
