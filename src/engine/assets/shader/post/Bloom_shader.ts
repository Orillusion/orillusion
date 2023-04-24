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
          var uv: vec2<f32>;
          var tex_offset: vec2<f32>;
          var result: vec3<f32>;
          var i: i32 = 1;
          var local: array<f32,5> = array<f32,5>(0.22702699899673462, 0.194594606757164, 0.12162160128355026, 0.05405399948358536, 0.01621600054204464);
          var local1: array<f32,5> = array<f32,5>(0.22702699899673462, 0.194594606757164, 0.12162160128355026, 0.05405399948358536, 0.01621600054204464);
          var j: i32 = 1;
          var local2: array<f32,5> = array<f32,5>(0.22702699899673462, 0.194594606757164, 0.12162160128355026, 0.05405399948358536, 0.01621600054204464);
          var local3: array<f32,5> = array<f32,5>(0.22702699899673462, 0.194594606757164, 0.12162160128355026, 0.05405399948358536, 0.01621600054204464);

          let e13: vec2<f32> = fragUV1;
          uv = e13.xy;
          let e18: vec2<f32> = uv;
          uv.y = (1.0 - e18.y);
          let e22: vec2<f32> = global.texSize;
          tex_offset = (vec2<f32>(1.0) / vec2<f32>(e22));
          let e28: vec2<f32> = uv;
          let e29: vec4<f32> = textureSample(baseMap, baseMapSampler, e28);
          result = (e29.xyz * array<f32,5>(0.22702699899673462, 0.194594606757164, 0.12162160128355026, 0.05405399948358536, 0.01621600054204464)[0]);
          let e35: f32 = global.horizontal;
          if ((e35 > 1.0)) {
              {
                  loop {
                      let e40: i32 = i;
                      if (!((e40 < 5))) {
                          break;
                      }
                      {
                          let e47: vec3<f32> = result;
                          let e48: vec2<f32> = uv;
                          let e49: vec2<f32> = tex_offset;
                          let e51: i32 = i;
                          let e54: f32 = global.hScale;
                          let e59: vec2<f32> = uv;
                          let e60: vec2<f32> = tex_offset;
                          let e62: i32 = i;
                          let e65: f32 = global.hScale;
                          let e70: vec4<f32> = textureSample(baseMap, baseMapSampler, (e59 + vec2<f32>(((e60.x * f32(e62)) * e65), 0.0)));
                          let e72: i32 = i;
                          let e75: f32 = local[e72];
                          result = (e47 + (e70.xyz * e75));
                          let e78: vec3<f32> = result;
                          let e79: vec2<f32> = uv;
                          let e80: vec2<f32> = tex_offset;
                          let e82: i32 = i;
                          let e85: f32 = global.hScale;
                          let e90: vec2<f32> = uv;
                          let e91: vec2<f32> = tex_offset;
                          let e93: i32 = i;
                          let e96: f32 = global.hScale;
                          let e101: vec4<f32> = textureSample(baseMap, baseMapSampler, (e90 - vec2<f32>(((e91.x * f32(e93)) * e96), 0.0)));
                          let e103: i32 = i;
                          let e106: f32 = local1[e103];
                          result = (e78 + (e101.xyz * e106));
                      }
                      continuing {
                          let e44: i32 = i;
                          i = (e44 + 1);
                      }
                  }
              }
          }
          let e109: f32 = global.horizontal;
          if ((e109 < 1.0)) {
              {
                  loop {
                      let e114: i32 = j;
                      if (!((e114 < 5))) {
                          break;
                      }
                      {
                          let e121: vec3<f32> = result;
                          let e122: vec2<f32> = uv;
                          let e124: vec2<f32> = tex_offset;
                          let e126: i32 = j;
                          let e129: f32 = global.vScale;
                          let e133: vec2<f32> = uv;
                          let e135: vec2<f32> = tex_offset;
                          let e137: i32 = j;
                          let e140: f32 = global.vScale;
                          let e144: vec4<f32> = textureSample(baseMap, baseMapSampler, (e133 + vec2<f32>(0.0, ((e135.y * f32(e137)) * e140))));
                          let e146: i32 = j;
                          let e149: f32 = local2[e146];
                          result = (e121 + (e144.xyz * e149));
                          let e152: vec3<f32> = result;
                          let e153: vec2<f32> = uv;
                          let e155: vec2<f32> = tex_offset;
                          let e157: i32 = j;
                          let e160: f32 = global.vScale;
                          let e164: vec2<f32> = uv;
                          let e166: vec2<f32> = tex_offset;
                          let e168: i32 = j;
                          let e171: f32 = global.vScale;
                          let e175: vec4<f32> = textureSample(baseMap, baseMapSampler, (e164 - vec2<f32>(0.0, ((e166.y * f32(e168)) * e171))));
                          let e177: i32 = j;
                          let e180: f32 = local3[e177];
                          result = (e152 + (e175.xyz * e180));
                      }
                      continuing {
                          let e118: i32 = j;
                          j = (e118 + 1);
                      }
                  }
              }
          }
          let e183: vec3<f32> = result;
          o_Target = vec4<f32>(e183, 1.0);
          return;
      }

      @fragment
      fn main(@location(0) fragUV: vec2<f32>) -> FragmentOutput {
          fragUV1 = fragUV;
          main1();
          let e27: vec4<f32> = o_Target;
          return FragmentOutput(e27);
      }
      `;

    public static Bloom_composite_frag_wgsl: string = /* wgsl */ `
      struct uniformData {
          bloomStrength: f32,
          bloomRadius: f32
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
      var<uniform> global: uniformData;

      fn lerpBloomFactor(factor: f32) -> f32 {
          var factor1: f32;
          var mirrorFactor: f32;

          factor1 = factor;
          let e23: f32 = factor1;
          mirrorFactor = (1.2000000476837158 - e23);
          let e29: f32 = factor1;
          let e30: f32 = mirrorFactor;
          let e31: f32 = global.bloomRadius;
          return mix(e29, e30, e31);
      }

      fn main1() {
          var uv: vec2<f32>;
          var source: vec4<f32>;

          let e20: vec2<f32> = fragUV1;
          uv = e20.xy;
          let e25: vec2<f32> = uv;
          uv.y = (1.0 - e25.y);
          let e29: vec2<f32> = uv;
          let e30: vec4<f32> = textureSample(baseMap, baseMapSampler, e29);
          source = e30;
          let e32: vec4<f32> = source;
          let e33: f32 = global.bloomStrength;
          let e38: f32 = lerpBloomFactor(array<f32,5>(1.0, 0.800000011920929, 0.6000000238418579, 0.4000000059604645, 0.20000000298023224)[0]);
          let e45: vec2<f32> = uv;
          let e46: vec4<f32> = textureSample(blurTex1, blurTex1Sampler, e45);
          let e52: f32 = lerpBloomFactor(array<f32,5>(1.0, 0.800000011920929, 0.6000000238418579, 0.4000000059604645, 0.20000000298023224)[1]);
          let e59: vec2<f32> = uv;
          let e60: vec4<f32> = textureSample(blurTex2, blurTex2Sampler, e59);
          let e67: f32 = lerpBloomFactor(array<f32,5>(1.0, 0.800000011920929, 0.6000000238418579, 0.4000000059604645, 0.20000000298023224)[2]);
          let e74: vec2<f32> = uv;
          let e75: vec4<f32> = textureSample(blurTex3, blurTex3Sampler, e74);
          let e82: f32 = lerpBloomFactor(array<f32,5>(1.0, 0.800000011920929, 0.6000000238418579, 0.4000000059604645, 0.20000000298023224)[3]);
          let e89: vec2<f32> = uv;
          let e90: vec4<f32> = textureSample(blurTex4, blurTex4Sampler, e89);
          let e97: f32 = lerpBloomFactor(array<f32,5>(1.0, 0.800000011920929, 0.6000000238418579, 0.4000000059604645, 0.20000000298023224)[4]);
          let e104: vec2<f32> = uv;
          let e105: vec4<f32> = textureSample(blurTex5, blurTex5Sampler, e104);
          o_Target = (e32 + (e33 * ((((((e38 * vec4<f32>(array<vec3<f32>,5>(vec3<f32>(1.0, 1.0, 1.0), vec3<f32>(1.0, 1.0, 1.0), vec3<f32>(1.0, 1.0, 1.0), vec3<f32>(1.0, 1.0, 1.0), vec3<f32>(1.0, 1.0, 1.0))[0], 1.0)) * e46) + ((e52 * vec4<f32>(array<vec3<f32>,5>(vec3<f32>(1.0, 1.0, 1.0), vec3<f32>(1.0, 1.0, 1.0), vec3<f32>(1.0, 1.0, 1.0), vec3<f32>(1.0, 1.0, 1.0), vec3<f32>(1.0, 1.0, 1.0))[1], 1.0)) * e60)) + ((e67 * vec4<f32>(array<vec3<f32>,5>(vec3<f32>(1.0, 1.0, 1.0), vec3<f32>(1.0, 1.0, 1.0), vec3<f32>(1.0, 1.0, 1.0), vec3<f32>(1.0, 1.0, 1.0), vec3<f32>(1.0, 1.0, 1.0))[2], 1.0)) * e75)) + ((e82 * vec4<f32>(array<vec3<f32>,5>(vec3<f32>(1.0, 1.0, 1.0), vec3<f32>(1.0, 1.0, 1.0), vec3<f32>(1.0, 1.0, 1.0), vec3<f32>(1.0, 1.0, 1.0), vec3<f32>(1.0, 1.0, 1.0))[3], 1.0)) * e90)) + ((e97 * vec4<f32>(array<vec3<f32>,5>(vec3<f32>(1.0, 1.0, 1.0), vec3<f32>(1.0, 1.0, 1.0), vec3<f32>(1.0, 1.0, 1.0), vec3<f32>(1.0, 1.0, 1.0), vec3<f32>(1.0, 1.0, 1.0))[4], 1.0)) * e105))));
          o_Target.a = e30.a ;
          return;
      } 

      @fragment
      fn main(@location(0) fragUV: vec2<f32>) -> FragmentOutput {
          fragUV1 = fragUV;
          main1();
        //   let e81: vec4<f32> = pow(o_Target,vec4<f32>(vec3<f32>(2.2),o_Target.w));
          return FragmentOutput(o_Target);
      }
      `;
}