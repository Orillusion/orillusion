import { GlobalUniform } from "../../../assets/shader/core/common/GlobalUniform";
import { WorldMatrixUniform } from "../../../assets/shader/core/common/WorldMatrixUniform";
import { ColorPassFragmentOutput } from "../../../assets/shader/core/struct/ColorPassFragmentOutput";

export class GUIShader {
    private static bindTextureArray() {
        let value = ``;
        for (let i = 0; i < 7; i++) {
            value += `
        @group(1) @binding(auto)
        var tex_${i}Sampler: sampler;
        @group(1) @binding(auto)
#if VideoTexture${i}
        var tex_${i}: texture_external;
#else
        var tex_${i}: texture_2d<f32>;
#endif
`;
        }
        return value;
    }

    private static sampleTexture(index: number) {
        return `
#if VideoTexture${index}
            let size = textureDimensions(tex_${index}).xy - 1;
            uv.y = 1.0 - uv.y;
            let iuv = vec2<i32>(uv * vec2<f32>(size));
            color = textureLoad(tex_${index}, iuv) ;
#else
            color = textureSampleLevel(tex_${index}, tex_${index}Sampler, uv, 0.0);
#endif        `;
    }

    private static readonly fs: string = /* wgsl */ `
        ${ColorPassFragmentOutput}
        ${this.bindTextureArray()}

        var<private> fragmentOutput: FragmentOutput;
        var<private> uvSlice: vec2<f32>;
        
        fn sliceBorder(s0:f32, scale:f32, border0:vec2<f32>) -> f32 {
          var s = s0;
          var border = border0;
          var borderScale = vec2<f32>(border.x / scale, 1.0 - (1.0 - border.y) / scale);
          if(s < borderScale.x){
            s *= scale;
          }else if(s < borderScale.y){
            var t = (s - borderScale.x) / (borderScale.y - borderScale.x);
            s = t * (border.y - border.x) + border.x;
          }else{
            s = 1.0 - (1.0 - s) * scale;
          }
          return s;
        }
        
        @fragment
        fn FragMain( 
            @location(0) vUV: vec2<f32>,
            @location(1) vColor4: vec4<f32>,
            @location(2) vUvRec: vec4<f32>,
            @location(3) vUvBorder: vec4<f32>,
            @location(4) vUvSlice: vec2<f32>,
            @location(5) vTextureID: f32,
            @builtin(front_facing) face: bool,
            @builtin(position) fragCoord : vec4<f32> 
        ) -> FragmentOutput {
            uvSlice = vUvSlice;
            
            var uv:vec2<f32> = vUV;
            if(uvSlice.x > 1.0){ uv.x = sliceBorder(uv.x, uvSlice.x, vUvBorder.xz);}
            if(uvSlice.y > 1.0){ uv.y = sliceBorder(uv.y, uvSlice.y, vUvBorder.yw);}
            uv = uv * vUvRec.zw + vUvRec.xy;
            
            var color = vec4<f32>(0.0,0.0,0.0,1.0);
            let texId = i32(vTextureID + 0.5);
            
            var texSize = vec2<i32>(0);
            var coord = vec2<i32>(0);
            
            if(texId == 0){
                ${this.sampleTexture(0)}
            }else if(texId == 1){
                ${this.sampleTexture(1)}
            }else if(texId == 2){
                ${this.sampleTexture(2)}
            }else if(texId == 3){            
                ${this.sampleTexture(3)}
            }else if(texId == 4){            
                ${this.sampleTexture(4)}
            }else if(texId == 5){            
                ${this.sampleTexture(5)}
            }else if(texId == 6){            
                ${this.sampleTexture(6)}
            }
            color *= vColor4;
            if(color.a < 0.001)
            { 
                discard;
            }
            
            fragmentOutput.color = color;
            return fragmentOutput ;
        }`;

    private static readonly GUI_common_vs: string = /* wgsl */ `
        ${WorldMatrixUniform}
        ${GlobalUniform}

        struct VertexUniformBuffer {
            vColor4: vec4<f32>,
            vUvRec: vec4<f32>,
            vUvBorder: vec4<f32>,
            vUvSlice: vec2<f32>,
            vTextureID: f32,
            vVisible: f32
        }
                
        struct MaterialUniform{
            screen:vec2<f32>,
            mipmapRange:vec2<f32>,
        }
        
        struct VertexOutput {
            @location(0) vUV: vec2<f32>,
            @location(1) vColor4: vec4<f32>,
            @location(2) vUvRec: vec4<f32>,
            @location(3) vUvBorder: vec4<f32>,
            @location(4) vUvSlice: vec2<f32>,
            @location(5) vTextureID: f32,
            
            @builtin(position) member: vec4<f32>
        };
        
         struct VertexInput{
            @builtin(instance_index) index : u32,
            @location(0) uv: vec2<f32>,
            @location(1) vIndex: f32,
        }

        @group(2) @binding(0)
        var<uniform> materialUniform : MaterialUniform;
        @group(3) @binding(1)
        var<storage, read> vPositionBuffer: array<vec2<f32>>;
        @group(3) @binding(2)
        var<storage, read> vUniformBuffer: array<VertexUniformBuffer>;
        
        var<private> vertexOut: VertexOutput ;
    `;

    public static readonly GUI_shader_view: string = /* wgsl */ `
        ${this.GUI_common_vs}

        @vertex
        fn VertMain( vertex:VertexInput ) -> VertexOutput {
            var _m = models.matrix[0];
            var _n = globalUniform.frame;
            
            let vertexIndex = vertex.vIndex;
            let quadIndex = u32(vertex.vIndex * 0.25);
            var vUniformData = vUniformBuffer[quadIndex];
            
            var op = vec2<f32>(0.0001);
            if(vUniformData.vVisible > 0.5){
                op = 2.0 * vec2<f32>(vPositionBuffer[u32(vertexIndex)]) / materialUniform.screen;
            }

            vertexOut.member = vec4<f32>(op.x, op.y, vertexIndex * 0.0001, 1.0);

            vertexOut.vUV = vec2<f32>(vertex.uv);
            vertexOut.vUvRec = vUniformData.vUvRec;
            vertexOut.vColor4 = vUniformData.vColor4;
            vertexOut.vUvBorder = vUniformData.vUvBorder;
            vertexOut.vUvSlice = vUniformData.vUvSlice;
            vertexOut.vTextureID = vUniformData.vTextureID;
            
            return vertexOut;
         }
         
         ${this.fs}
        `;

    public static readonly GUI_shader_world: string = /* wgsl */ `
        ${this.GUI_common_vs}
        @vertex
        fn VertMain( vertex:VertexInput ) -> VertexOutput {
            var modelMatrix = models.matrix[vertex.index];
            
            let vertexIndex = vertex.vIndex;
            let quadIndex = u32(vertex.vIndex * 0.25);
            var vUniformData = vUniformBuffer[quadIndex];
            
            var localPos = vec4<f32>(vPositionBuffer[u32(vertexIndex)], vertexIndex * 0.0001, 1.0) ;
            var op = vec4<f32>(0.0001);
            if(vUniformData.vVisible > 0.5){
                op = globalUniform.projMat * globalUniform.viewMat * modelMatrix * localPos ;
            }
            vertexOut.member = op;
            vertexOut.vUV = vec2<f32>(vertex.uv);
            
            vertexOut.vUvRec = vUniformData.vUvRec;
            vertexOut.vColor4 = vUniformData.vColor4;
            vertexOut.vUvBorder = vUniformData.vUvBorder;
            vertexOut.vUvSlice = vUniformData.vUvSlice;
            vertexOut.vTextureID = vUniformData.vTextureID;
            
            return vertexOut;
         }
         
         ${this.fs}

        `;
}
