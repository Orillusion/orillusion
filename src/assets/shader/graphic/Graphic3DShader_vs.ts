export let Graphic3DShader_vs: string = /*wgsl*/ `
    #include "WorldMatrixUniform"
    #include "GlobalUniform"

    struct VertexAttributes {
        @location(auto) position: vec4<f32>,
        @location(auto) color: vec4<f32>,
    }

    struct VertexOutput {
        @location(auto) varying_WPos: vec4<f32>,
        @location(auto) varying_Color: vec4<f32>,
        @builtin(position) member: vec4<f32>
    };

    @vertex
    fn main( vertex:VertexAttributes ) -> VertexOutput {
        var worldMatrix = models.matrix[u32(vertex.position.w)];
        var worldPos = (worldMatrix * vec4<f32>(vertex.position.xyz, 1.0));
        var viewPosition = ((globalUniform.viewMat) * worldPos);
        var clipPosition = globalUniform.projMat * viewPosition;

        var ORI_VertexOut: VertexOutput; 
        ORI_VertexOut.varying_WPos = worldPos;
        ORI_VertexOut.varying_Color = vertex.color;
        ORI_VertexOut.member = clipPosition;
        return ORI_VertexOut;
    }
`