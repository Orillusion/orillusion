import { Texture } from "../../../../gfx/graphics/webGpu/core/texture/Texture"

export let textureCompress = (colorMap:Texture,sourceTexture: Texture[], destTexture: Texture[], workX: number, workY: number, workZ: number = 1) => {
    let begin = 0;
    let bindInputTexture = '';
    let preG = '';

    preG += /* wgsl */`
        fn acesFilm( x:vec3f) -> vec3f {
            return clamp((x*(2.51*x+vec3f(0.03)))/(x*(2.43*x+vec3f(0.59))+vec3f(0.14)),vec3f(0.0),vec3f(1.0));
        }
    `;
 
    for (let i = 0; i < sourceTexture.length; i++) {
        const inputTexture = sourceTexture[i];
        let inTextureName = `source${i}Map`;
        let inTextureSamplerName = `source${i}MapSampler`;
        
        bindInputTexture += /* wgsl */`
            @group(0) @binding(${(begin+i) * 2 + 0}) var ${inTextureName} : texture_2d<f32>;\n
            @group(0) @binding(${(begin+i) * 2 + 1}) var ${inTextureSamplerName} : sampler;
        `;

       

        preG += GaussBlur(`GaussBlur_${inTextureName}_1`,inTextureName,inTextureSamplerName);
        preG += GaussBlur(`GaussBlur_${inTextureName}_0`,inTextureName,inTextureSamplerName);
    }
    
    begin += sourceTexture.length ;
    let bindOutputTexture = '';
    for (let i = 0; i < destTexture.length; i++) {
        bindOutputTexture += /* wgsl */`@group(0) @binding(${(begin+i) * 2 + 0}) var dest${i}Map : texture_storage_2d<rgba16float, write>;\n`;
    }

    let loadMainColor = "";
    if(colorMap){
        begin += destTexture.length ;
        bindInputTexture += /* wgsl */`@group(0) @binding(${(begin) * 2 + 0}) var colorMap : texture_2d<f32>;\n
       
        `
        loadMainColor += /* wgsl */`
            mainColor = textureLoad( colorMap ,fragCoord, 0) ;
        ` ;
    }

    let compute_workgroup_size = /* wgsl */`@compute @workgroup_size(${workX}, ${workY},${workZ})`;

    let copyTexture = copyToTexture(sourceTexture.length,colorMap?true:false);

    let compute_shader = /* wgsl */`
        ${GaussWeight2D}
        ${CalcUV_01}
        ${bindInputTexture}
        ${bindOutputTexture}
        ${preG}
        
        var<private> fragCoord: vec2<i32>;
        var<private> texSize: vec2<u32>;

        var<private> mainColor: vec4f;

        ${compute_workgroup_size}
        fn CsMain(@builtin(global_invocation_id) globalInvocation_id : vec3<u32>){
            fragCoord = vec2<i32>( globalInvocation_id.xy );
            texSize = textureDimensions(dest0Map).xy;
            if(fragCoord.x >= i32(texSize.x) || fragCoord.y >= i32(texSize.y)){
                return;
            }
            
            ${loadMainColor}

            ${copyTexture}
        }
    `
    return compute_shader
}

let copyToTexture = (len:number,combineMainColor:boolean)=>{
    let code = ``
    for (let i = 0; i < len ; i++) {
        code += upSample(`GaussBlur_source${i}Map`,`dest${i}Map`,combineMainColor);
    }
    return code ;
}

let upSample = (funName:string,outeTextureName:string,combineMainColor:boolean)=>{
    let code = /* wgsl */`
        var color = vec4<f32>(0.0, 0.0, 0.0, 1.0);
        var uv = CalcUV_01(fragCoord, texSize);
        
        // half stride
        let prev_stride = vec2<f32>(0.5) / vec2<f32>(f32(texSize.x), f32(texSize.y));
        let curr_stride = vec2<f32>(1.0) / vec2<f32>(f32(texSize.x), f32(texSize.y));

        let rgb1 = ${funName}_1(uv, i32(1), prev_stride, 1.0);
        let rgb2 = ${funName}_0(uv, i32(1), curr_stride, 1.0);
        color = vec4<f32>((rgb1 + rgb2) * 0.5 , color.w) ;
        // color *= 3.1415926 ;
        color = vec4f(pow(acesFilm(max(vec3f(0.),color.xyz)),vec3f(0.45)),1.) * 0.5  ;   
        ${combineMainColor ? "color = (color + mainColor) ;": "" }
        // color = color / (1.0+color) * 2.0 ;
        textureStore(${outeTextureName}, fragCoord, color );
    `
    return code;
}

let CalcUV_01 = /*wgsl*/ `
  fn CalcUV_01(coord:vec2<i32>, texSize:vec2<u32>) -> vec2<f32>
  {
    let u = (f32(coord.x) + 0.5) / f32(texSize.x);
    let v = (f32(coord.y) + 0.5) / f32(texSize.y);
    return vec2<f32>(u, v);
  }
`

//_______________calc weight

let GaussWeight2D: string =  /*wgsl*/ `
fn GaussWeight2D(x:f32, y:f32, sigma:f32) -> f32
  {
      let PI = 3.14159265358;
      let E  = 2.71828182846;
      let sigma_2 = pow(sigma, 2);
  
      let a = -(x*x + y*y) / (2.0 * sigma_2);
      return pow(E, a) / (2.0 * PI * sigma_2);
  }
`

let GaussBlur = function (GaussNxN: string, inTex: string, inTexSampler: string) {
  var code: string = /*wgsl*/ `
  
  fn ${GaussNxN}(uv:vec2<f32>, n:i32, stride:vec2<f32>, sigma:f32) -> vec3<f32>
  {
      var color = vec3<f32>(0.0);
      let r:i32 = n / 2;
      var weight:f32 = 0.0;
  
      for(var i:i32=-r; i<=r; i+=1)
      {
          for(var j=-r; j<=r; j+=1)
          {
              let w = GaussWeight2D(f32(i), f32(j), sigma);
              var coord:vec2<f32> = uv + vec2<f32>(f32(i), f32(j)) * stride;
              // color += tex2D(tex, coord).rgb * w;
              color += textureSampleLevel(${inTex}, ${inTexSampler}, coord, 0.0).xyz * w;
              weight += w;
          }
      }
  
      color /= weight;
      return color;
  }`;
  return code;

}
// let merge = (a: string, b: string) => {
//     let code = /* wgsl */ `
    
//     `
//     return a + b;
// }
