export let Inline_vert: string = /*wgsl*/ `
    #include "MathShader"
    #include "FastMathShader"
    #include "InstanceUniform"

    var<private> ORI_MATRIX_P: mat4x4<f32>;
    var<private> ORI_MATRIX_V: mat4x4<f32>;
    var<private> ORI_MATRIX_M: mat4x4<f32>;
    var<private> ORI_MATRIX_PV: mat4x4<f32>;
    var<private> ORI_MATRIX_PVInv: mat4x4<f32>;
    var<private> ORI_MATRIX_World: mat4x4<f32>;
    var<private> ORI_CAMERAMATRIX: mat4x4<f32>;
    var<private> ORI_NORMALMATRIX: mat3x3<f32>;
    var<private> ORI_CameraWorldDir: vec3<f32>;

    var<private> TIME: vec4<f32>;
    var<private> MOUSE: vec4<f32>;
    var<private> SCREEN: vec4<f32>;

    var<private> ProjectionParams: vec4<f32>;

    fn vertex_inline(vertex:VertexAttributes){
        TIME.x = globalUniform.frame;
        TIME.y = globalUniform.time;
        TIME.z = globalUniform.delta;

        MOUSE.x = globalUniform.mouseX;
        MOUSE.y = globalUniform.mouseY;

        SCREEN.x = globalUniform.windowWidth;
        SCREEN.y = globalUniform.windowHeight;

        ProjectionParams.x = globalUniform.near;
        ProjectionParams.y = globalUniform.far;
        ProjectionParams.z = 1.0 + 1.0 / globalUniform.far;

        ORI_MATRIX_P = globalUniform.projMat ;
        ORI_MATRIX_V = globalUniform.viewMat ;
        ORI_MATRIX_PV = ORI_MATRIX_P * ORI_MATRIX_V ;
        ORI_MATRIX_PVInv = globalUniform.pvMatrixInv ;
        ORI_CAMERAMATRIX = globalUniform.cameraWorldMatrix ;

        ORI_MATRIX_M = models.matrix[u32(vertex.index)];
            
        #if USE_INSTANCEDRAW
            let modelID = instanceDrawID.matrixIDs[vertex.index];
            ORI_MATRIX_M = models.matrix[modelID];
        #endif
    }
`
