import { GlobalUniform } from "../../../assets/shader/core/common/GlobalUniform";
import { WorldMatrixUniform } from "../../../assets/shader/core/common/WorldMatrixUniform";
import { ColorPassFragmentOutput } from "../../../assets/shader/core/struct/ColorPassFragmentOutput";

/**
 * shader code
 * @group GPU GUI
 */
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
        var<private> EPSILON: f32 = 0.001;
        
        fn sliceBorder(uv:f32, scale:f32, border:vec2<f32>) -> f32 
        {
            var s = uv * scale;
            if(s > border.x){
                s -= border.x;
                let centerPartMax = scale - border.x - border.y;
                let centerPartMin = 1.0 - border.x - border.y;
                if(s < centerPartMax){
                    s = border.x + (s / centerPartMax) * centerPartMin;
                }else{
                    s = s - centerPartMax + border.x + centerPartMin;
                }
            }
            return s;
        }

        fn isInsideAlpha(coord:vec2<f32>, rect:vec4<f32>, cornerRadius0:f32, fadeOutSize0:f32) -> f32
        {
            var minX = min(rect.x, rect.z);
            var maxX = max(rect.x, rect.z);
            var minY = min(rect.y, rect.w);
            var maxY = max(rect.y, rect.w);

            var cornerRadius = max(EPSILON, cornerRadius0);

            var center = vec2<f32>(minX + maxX, minY + maxY) * 0.5;
            var extents = vec2<f32>(maxX - minX, maxY - minY) * 0.5;

            cornerRadius = min(extents.x, cornerRadius);
            cornerRadius = min(extents.y, cornerRadius);
            
            var extendsMin = max(vec2<f32>(0.0), extents - cornerRadius);
            
            var toCenter = abs(coord - center);
            var outerDist = toCenter - extents;
            var innerDist = toCenter - extendsMin;
            
            if(innerDist.x <= 0 && innerDist.y <= 0){
                return 1.0;
            }else if(outerDist.x <= 0 && outerDist.y <= 0){
                var fadeOutPercent = clamp(fadeOutSize0, EPSILON, cornerRadius) / cornerRadius;
                innerDist = max(vec2(EPSILON), innerDist);
                var distance = min(cornerRadius, length(innerDist));
                var alpha = 1.0 - distance / cornerRadius;
                alpha /= fadeOutPercent;
                alpha = clamp(alpha, 0.0, 1.0);
                return alpha;
            }
            return 0.0;
        }
        
        @fragment
        fn FragMain( 
            @location(0) vUV: vec2<f32>,
            @location(1) vColor4: vec4<f32>,
            @location(2) vLocalPos: vec2<f32>,
            @location(3) vUvRec: vec4<f32>,
            @location(4) vUvBorder: vec4<f32>,
            @location(5) vUvSlice: vec2<f32>,
            @location(6) vTextureID: f32,
            @builtin(front_facing) face: bool,
            @builtin(position) fragCoord : vec4<f32> 
        ) -> FragmentOutput {

            var scissorAlpha = 1.0;
#if SCISSOR_ENABLE
            scissorAlpha = isInsideAlpha(
                vLocalPos.xy,
                materialUniform.scissorRect,
                materialUniform.scissorCornerRadius,
                materialUniform.scissorFadeOutSize);

            if(scissorAlpha < EPSILON){
                discard;
            }
#endif

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
            color.a *= scissorAlpha;
            if(color.a < EPSILON)
            { 
                discard;
            }

            fragmentOutput.color = color;
            return fragmentOutput ;
        }`;

    private static readonly GUI_common_vs: string = /* wgsl */ `
        ${WorldMatrixUniform}
        ${GlobalUniform}

        struct VertexSpriteBuffer {
            vUvRec: vec4<f32>,
            vUvBorder: vec4<f32>,
            vUvSlice: vec2<f32>,
            vTextureID: f32,
            vVisible: f32
        }
                
        struct MaterialUniform{
            scissorRect:vec4<f32>,

            screenSize:vec2<f32>,
            guiSolution:vec2<f32>,
            
            scissorCornerRadius:f32,
            scissorFadeOutSize:f32,

            pixelRatio:f32,
            empty:f32,
        }
        
        struct VertexOutput {
            @location(0) vUV: vec2<f32>,
            @location(1) vColor4: vec4<f32>,
            @location(2) vLocalPos: vec2<f32>,
            @location(3) vUvRec: vec4<f32>,
            @location(4) vUvBorder: vec4<f32>,
            @location(5) vUvSlice: vec2<f32>,
            @location(6) vTextureID: f32,
            
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
        var<storage, read> vPositionBuffer: array<vec4<f32>>;
        @group(3) @binding(2)
        var<storage, read> vSpriteBuffer: array<VertexSpriteBuffer>;
        @group(3) @binding(3)
        var<storage, read> vColorBuffer: array<vec4<f32>>;

        var<private> vertexOut: VertexOutput ;

        //quad: (left, bottom, right, top)
        //index: 0~3
        fn getVertexXY(quad:vec4<f32>, index:u32) -> vec2<f32>
        {
            var ret = vec2<f32>(0.0);
            if(index == 0 || index == 3){
                ret.x = quad.x;
            }else{
                ret.x = quad.z;
            }
            if(index == 0 || index == 1){
                ret.y = quad.w;
            }else{
                ret.y = quad.y;
            }
            return ret;
        }
    `;

    public static readonly GUI_shader_view: string = /* wgsl */ `
        ${this.GUI_common_vs}

        @vertex
        fn VertMain( vertex:VertexInput ) -> VertexOutput {
            var _m = models.matrix[0];
            var _n = globalUniform.frame;
            
            let vertexIndex = vertex.vIndex;
            let quadIndex = u32(vertex.vIndex * 0.25);
            let vertexPosition = getVertexXY(vPositionBuffer[quadIndex], u32(vertexIndex) % 4u);
            var vSpriteData = vSpriteBuffer[quadIndex];
            
            var op = vec2<f32>(0.0001);
            let isValidVertex = vSpriteData.vVisible > 0.5;
            if(isValidVertex){
                op = 2.0 * vertexPosition * materialUniform.pixelRatio  / materialUniform.screenSize;
            }

            vertexOut.vLocalPos = vertexPosition;
            vertexOut.member = vec4<f32>(op.x, op.y, vertexIndex * 0.0001, 1.0);

            vertexOut.vUV = vec2<f32>(vertex.uv);
            vertexOut.vUvRec = vSpriteData.vUvRec;
            vertexOut.vUvBorder = vSpriteData.vUvBorder;
            vertexOut.vUvSlice = vSpriteData.vUvSlice;
            vertexOut.vTextureID = vSpriteData.vTextureID;
            vertexOut.vColor4 = vColorBuffer[quadIndex];

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
            let vertexPosition = getVertexXY(vPositionBuffer[quadIndex], u32(vertexIndex) % 4u);
            var localPos = vec4<f32>(vertexPosition.xy, vertexIndex * 0.0001, 1.0) ;
            var op = vec4<f32>(0.0001);
            var vSpriteData = vSpriteBuffer[quadIndex];

            let isValidVertex = vSpriteData.vVisible > 0.5;
            if(isValidVertex){
                op = globalUniform.projMat * globalUniform.viewMat * modelMatrix * localPos ;
            }

            vertexOut.vLocalPos = vertexPosition;
            vertexOut.member = op;

            vertexOut.vUV = vec2<f32>(vertex.uv);
            vertexOut.vUvRec = vSpriteData.vUvRec;
            vertexOut.vUvBorder = vSpriteData.vUvBorder;
            vertexOut.vUvSlice = vSpriteData.vUvSlice;
            vertexOut.vTextureID = vSpriteData.vTextureID;
            vertexOut.vColor4 = vColorBuffer[quadIndex];

            return vertexOut;
         }
         
         ${this.fs}

        `;
}
