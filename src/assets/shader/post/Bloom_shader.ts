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
        var c1: vec3<f32>;

        c1 = c;
        let e8: vec3<f32> = c1;
        let e10: vec3<f32> = c1;
        let e12: vec3<f32> = c1;
        let e14: vec3<f32> = c1;
        let e17: vec3<f32> = c1;
        let e19: vec3<f32> = c1;
        let e21: vec3<f32> = c1;
        let e23: vec3<f32> = c1;
        let e25: vec3<f32> = c1;
        let e28: vec3<f32> = c1;
        return max(max(e23.x, e25.y), e28.z);
    }

    fn main1() {
        var uv: vec2<f32>;
        var LinearColor: vec4<f32>;
        var TotalLuminance: f32;
        var BloomLuminance: f32;
        var BloomAmount: f32;

        let e6: vec2<f32> = fragUV1;
        uv = e6.xy;
        let e11: vec2<f32> = uv;
        uv.y = (1.0 - e11.y);
        let e15: vec2<f32> = uv;
        let e16: vec4<f32> = textureSample(baseMap, baseMapSampler, e15);
        LinearColor = e16;
        let e18: vec4<f32> = LinearColor;
        let e27: vec4<f32> = LinearColor;
        let e36: vec4<f32> = LinearColor;
        let e38: vec3<f32> = min(vec3<f32>(f32(65000), f32(65000), f32(65000)), e36.xyz);
        LinearColor.x = e38.x;
        LinearColor.y = e38.y;
        LinearColor.z = e38.z;
        let e45: vec4<f32> = LinearColor;
        let e47: vec4<f32> = LinearColor;
        let e49: f32 = Brightness(e47.xyz);
        TotalLuminance = e49;
        let e51: f32 = TotalLuminance;
        let e52: f32 = global.luminosityThreshold;
        BloomLuminance = (e51 - e52);
        let e55: f32 = BloomLuminance;
        let e60: f32 = BloomLuminance;
        BloomAmount = clamp((e60 * 0.5), 0.0, 1.0);
        let e67: f32 = BloomAmount;
        let e68: vec4<f32> = LinearColor;
        o_Target = vec4<f32>((e67 * e68.xyz), f32(0));
        return;
    }

    @fragment
    fn main(@location(0) fragUV: vec2<f32>) -> FragmentOutput {
        fragUV1 = fragUV;
        main1();
        let e13: vec4<f32> = o_Target;
        return FragmentOutput(e13);
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

      fn main1() {
       
          return;
      }

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
        
          let e38: f32 = lerpBloomFactor(bloomFactors[0]);
          let e46: vec4<f32> = textureSample(blurTex1, blurTex1Sampler, uv);
          let e52: f32 = lerpBloomFactor(bloomFactors[1]);
          let e60: vec4<f32> = textureSample(blurTex2, blurTex2Sampler, uv);
          let e67: f32 = lerpBloomFactor(bloomFactors[2]);
          let e75: vec4<f32> = textureSample(blurTex3, blurTex3Sampler, uv);
          let e82: f32 = lerpBloomFactor(bloomFactors[3]);
          let e90: vec4<f32> = textureSample(blurTex4, blurTex4Sampler, uv);
          let e97: f32 = lerpBloomFactor(bloomFactors[4]);
          let e105: vec4<f32> = textureSample(blurTex5, blurTex5Sampler, uv);
          o_Target = ((((((((e38 * vec4<f32>(array<vec3<f32>,5>(vec3<f32>(1.0, 1.0, 1.0), vec3<f32>(1.0, 1.0, 1.0), vec3<f32>(1.0, 1.0, 1.0), vec3<f32>(1.0, 1.0, 1.0), vec3<f32>(1.0, 1.0, 1.0))[0], 1.0)) * e46) + ((e52 * vec4<f32>(array<vec3<f32>,5>(vec3<f32>(1.0, 1.0, 1.0), vec3<f32>(1.0, 1.0, 1.0), vec3<f32>(1.0, 1.0, 1.0), vec3<f32>(1.0, 1.0, 1.0), vec3<f32>(1.0, 1.0, 1.0))[1], 1.0)) * e60)) + ((e67 * vec4<f32>(array<vec3<f32>,5>(vec3<f32>(1.0, 1.0, 1.0), vec3<f32>(1.0, 1.0, 1.0), vec3<f32>(1.0, 1.0, 1.0), vec3<f32>(1.0, 1.0, 1.0), vec3<f32>(1.0, 1.0, 1.0))[2], 1.0)) * e75)) + ((e82 * vec4<f32>(array<vec3<f32>,5>(vec3<f32>(1.0, 1.0, 1.0), vec3<f32>(1.0, 1.0, 1.0), vec3<f32>(1.0, 1.0, 1.0), vec3<f32>(1.0, 1.0, 1.0), vec3<f32>(1.0, 1.0, 1.0))[3], 1.0)) * e90)) + ((e97 * vec4<f32>(array<vec3<f32>,5>(vec3<f32>(1.0, 1.0, 1.0), vec3<f32>(1.0, 1.0, 1.0), vec3<f32>(1.0, 1.0, 1.0), vec3<f32>(1.0, 1.0, 1.0), vec3<f32>(1.0, 1.0, 1.0))[4], 1.0)) * e105))));
          
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