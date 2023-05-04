export let Common_vert: string = /*wgsl*/ `
    #include "WorldMatrixUniform"
    #include "VertexAttributes_vert"
    #include "GlobalUniform"
    #include "Inline_vert"
    @vertex
    fn VertMain( vertex:VertexAttributes ) -> VertexOutput {
        vertex_inline(vertex);
        vert(vertex);
        return ORI_VertexOut ;
    }
`