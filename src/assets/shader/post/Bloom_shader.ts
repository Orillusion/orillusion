export class Bloom_shader {
    public static Bloom_Brightness_frag_wgsl: string = /* wgsl */ `
    struct uniformData {
        luminosityThreshold: f32
    };

    struct FragmentOutput {
        @location(0) o_Target: vec4<f32>
    };

    var<private> fragUV1: vec2<f32>;
    var<private> o_Target: vec4<f32>;
    @group(1) @binding(0)
    var baseMapSampler: sampler;
    @group(1) @binding(1)
    var baseMap: texture_2d<f32>;
    @group(2) @binding(0)
    var<uniform> global: uniformData;

    fn Brightness(c: vec3<f32>) -> f32 {
        return max(max(c.x, c.y), c.z);
    }

    fn main1() {
        var uv: vec2<f32>;
        var LinearColor: vec3<f32>;
        var TotalLuminance: f32;
        var BloomLuminance: f32;
        var BloomAmount: f32;

        uv = fragUV1.xy;
        uv.y = (1.0 - uv.y);
        LinearColor = textureSample(baseMap, baseMapSampler, uv).xyz;
        LinearColor = min(vec3<f32>(65000.0), LinearColor.xyz);
        TotalLuminance = Brightness(LinearColor.xyz);
        BloomLuminance = (TotalLuminance - global.luminosityThreshold);
        BloomAmount = clamp((BloomLuminance * 0.5), 0.0, 1.0);
        o_Target = vec4<f32>((BloomAmount * LinearColor.xyz), f32(0));
        return;
    }

    @fragment
    fn main(@location(0) fragUV: vec2<f32>) -> FragmentOutput {
        fragUV1 = fragUV;
        main1();
        return FragmentOutput(o_Target);
    }
    `;


    public static Bloom_blur_frag_wgsl: string = /* wgsl */ `
      struct uniformData {
          texSize: vec2<f32>,
          hScale: f32,
          vScale: f32,
          horizontal: f32
      };

      struct FragmentOutput {
          @location(0) o_Target: vec4<f32>
      };

      var<private> fragUV1: vec2<f32>;
      var<private> o_Target: vec4<f32>;
      @group(1) @binding(0)
      var baseMapSampler: sampler;
      @group(1) @binding(1)
      var baseMap: texture_2d<f32>;
      @group(2) @binding(0)
      var<uniform> global: uniformData;

      const buffer1: array<f32,5> = array<f32,5>(0.22702699899673462, 0.194594606757164, 0.12162160128355026, 0.05405399948358536, 0.01621600054204464);

      @fragment
      fn main(@location(0) fragUV: vec2<f32>) -> FragmentOutput {
          var result: vec3<f32>;
          var i: i32 = 1;
          var j: i32 = 1;
          var uv: vec2<f32> = fragUV;
          uv.y = (1.0 - uv.y);
          var tex_offset: vec2<f32> = (vec2<f32>(1.0) / vec2<f32>(global.texSize));
          let color: vec4<f32> = textureSample(baseMap, baseMapSampler, uv);
          result = (color.xyz * buffer1[0]);
        
          if ((global.horizontal > 1.0)) {
              {
                  loop {
                      if (!((i < 5))) {
                          break;
                      }
                      {
                          let c1: vec4<f32> = textureSample(baseMap, baseMapSampler, (uv + vec2<f32>(((tex_offset.x * f32(i)) * global.hScale), 0.0)));
                          result = (result + (c1.xyz * buffer1[i]));
                          let e101: vec4<f32> = textureSample(baseMap, baseMapSampler, (uv - vec2<f32>(((tex_offset.x * f32(i)) * global.hScale), 0.0)));
                          result = (result + (e101.xyz * buffer1[i]));
                      }
                      continuing {
                          i = (i + 1);
                      }
                  }
              }
          }
          if ((global.horizontal < 1.0)) {
              {
                  loop {
                      let e114: i32 = j;
                      if (!((e114 < 5))) {
                          break;
                      }
                      {
                          let e144: vec4<f32> = textureSample(baseMap, baseMapSampler, (uv + vec2<f32>(0.0, ((tex_offset.y * f32(j)) * global.vScale))));
                          result = (result + (e144.xyz * buffer1[j]));
                          let e175: vec4<f32> = textureSample(baseMap, baseMapSampler, (uv - vec2<f32>(0.0, ((tex_offset.y * f32(j)) * global.vScale))));
                          result = (result + (e175.xyz *  buffer1[j]));
                      }
                      continuing {
                          j = (j + 1);
                      }
                  }
              }
          }
          o_Target = vec4<f32>(result, 1.0);
          return FragmentOutput(o_Target);
      }
    `;

    public static Bloom_composite_frag_wgsl: string = /* wgsl */ `
    #include "ColorUtil"
      struct UniformData {
          tintColor:vec4<f32>,
          bloomStrength: f32,
          exposure: f32,
          bloomRadius: f32,
      };

      struct FragmentOutput {
          @location(0) o_Target: vec4<f32>
      };

      var<private> fragUV1: vec2<f32>;
      var<private> o_Target: vec4<f32>;
      @group(1) @binding(0)
      var baseMapSampler: sampler;
      @group(1) @binding(1)
      var baseMap: texture_2d<f32>;
      @group(1) @binding(2)
      var blurTex1Sampler: sampler;
      @group(1) @binding(3)
      var blurTex1: texture_2d<f32>;
      @group(1) @binding(4)
      var blurTex2Sampler: sampler;
      @group(1) @binding(5)
      var blurTex2: texture_2d<f32>;
      @group(1) @binding(6)
      var blurTex3Sampler: sampler;
      @group(1) @binding(7)
      var blurTex3: texture_2d<f32>;
      @group(1) @binding(8)
      var blurTex4Sampler: sampler;
      @group(1) @binding(9)
      var blurTex4: texture_2d<f32>;
      @group(1) @binding(10)
      var blurTex5Sampler: sampler;
      @group(1) @binding(11)
      var blurTex5: texture_2d<f32>;
      @group(2) @binding(0)
      var<uniform> global: UniformData;

      const bloomFactors = array<f32,5>(1.0, 0.800000011920929, 0.6000000238418579, 0.4000000059604645, 0.20000000298023224);
     
      fn lerpBloomFactor(factor: f32) -> f32 {
          var mirrorFactor: f32 = (1.2000000476837158 - factor);
          return mix(factor, mirrorFactor, global.bloomRadius);
      }

      fn main1() {
    
          return;
      } 

      @fragment
      fn main(@location(0) fragUV: vec2<f32>) -> FragmentOutput {
          var uv: vec2<f32> = fragUV;
          uv.y = (1.0 - uv.y);
        
          let lp0: f32 = lerpBloomFactor(bloomFactors[0]);
          let bl0: vec4<f32> = textureSample(blurTex1, blurTex1Sampler, uv);
          let lp1: f32 = lerpBloomFactor(bloomFactors[1]);
          let bl1: vec4<f32> = textureSample(blurTex2, blurTex2Sampler, uv);
          let lp2: f32 = lerpBloomFactor(bloomFactors[2]);
          let bl2: vec4<f32> = textureSample(blurTex3, blurTex3Sampler, uv);
          let lp3: f32 = lerpBloomFactor(bloomFactors[3]);
          let bl3: vec4<f32> = textureSample(blurTex4, blurTex4Sampler, uv);
          let lp4: f32 = lerpBloomFactor(bloomFactors[4]);
          let bl4: vec4<f32> = textureSample(blurTex5, blurTex5Sampler, uv);
          o_Target = lp0 * bl0 + lp1 * bl0 + lp2 * bl1 + lp3 * bl2 + lp4 * bl3;
          
          let baseColor: vec4<f32> = textureSample(baseMap, baseMapSampler, uv);
          
          var bloomLight = global.bloomStrength * o_Target.rgb;

          bloomLight = getHDRColor(bloomLight.rgb,global.exposure);
          bloomLight = LinearToGammaSpace(bloomLight);

          o_Target =  baseColor + vec4<f32>(bloomLight * global.tintColor.rgb, baseColor.a) ;
          o_Target.a = min(o_Target.a,1.0);
          return FragmentOutput(o_Target);
      }
  `;
}