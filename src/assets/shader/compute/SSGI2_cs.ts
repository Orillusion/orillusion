/**
 * @internal
 */
export let SSGI2_cs: string = /*wgsl*/ `
    #include "GlobalUniform"
    #include "MathShader"
    #include "FastMathShader"
    #include "BitUtil"
    #include "ColorUtil_frag"
    #include "GBufferStand"

    struct FrameBuffer{
      frameCount : f32 ,
      indirectIns : f32 ,
      delay : f32 ,
      frameCount4 : f32 ,
      d1 : f32 ,
      d2 : f32 ,
      d3 : f32 ,
      d4 : f32 ,
  }
    
    @group(0) @binding(3) var combineTexture : texture_2d<f32>;
    @group(0) @binding(5) var newTexture : texture_storage_2d<rgba16float, write>;

    @group(0) @binding(6) var<storage,read> updateBuffer: FrameBuffer ;

    var<private> i32InputSize: vec2<i32> ;
    var<private> i32GbufferSize: vec2<i32> ;

    var<private> f32InputSize: vec2<f32> ;
    var<private> f32GBufferSize: vec2<f32> ;

    var<private> i32InputFragCoord: vec2<i32> ;
    var<private> i32GbufferFragCoord: vec2<i32> ;

    var<private> f32InputFragCoord: vec2<f32> ;
    var<private> f32GbufferFragCoord: vec2<f32> ;

    var<private> f32InputUV: vec2<f32> ;
    var<private> f32GbufferUV: vec2<f32> ;

    var<private> inputToGBuffer: vec2<f32> ;

    var<private> gBuffer: GBuffer ;
    var<private> wColor: vec3<f32>;

    var<private> halfPi: f32 ;

    const PI: f32 = 3.141592653;
    const I64: f32 = 1.0/64.0;
    // const halfPi = 20.371832715762602978417121711682 ;
    const offsetCount = 20u ;
    
    @compute @workgroup_size( 16 , 16 , 1 )
    fn CsMain( @builtin(workgroup_id) workgroup_id : vec3<u32> , @builtin(global_invocation_id) globalInvocation_id : vec3<u32>)
    {
      i32InputFragCoord = vec2<i32>( globalInvocation_id.xy ) ;
      f32InputFragCoord = vec2<f32>( globalInvocation_id.xy ) ;

      i32InputSize = vec2i(textureDimensions(newTexture).xy);
      i32GbufferSize = vec2i(textureDimensions(gBufferTexture).xy);

      f32InputSize = vec2f(i32InputSize);
      f32GBufferSize = vec2f(i32GbufferSize);

      inputToGBuffer = 1.0/(f32InputSize / f32GBufferSize) ;

      f32InputUV = f32InputFragCoord / f32InputSize ;

      f32GbufferUV = f32InputUV  ;

      f32GbufferFragCoord = f32GbufferUV * f32GBufferSize;
      i32GbufferFragCoord = vec2i(f32GbufferFragCoord) ; 

      gBuffer = getGBuffer(i32GbufferFragCoord) ;
      wColor = getRGBMColorFromGBuffer(gBuffer);
      var n = getViewNormalFromGBuffer(gBuffer);
      var p = getWorldPositionFromGBuffer(gBuffer,f32GbufferUV);

      let f = -globalUniform.far;
      if(gBuffer.x <= f ){
        textureStore(newTexture, i32InputFragCoord , vec4f(0.0) );
        return ;
      }

      halfPi = 1.0 / (PI*0.5) * f32(offsetCount);

      var trackColor:vec4f = vec4f(0.0);

      trackColor = ray(i32InputFragCoord,f32InputFragCoord);
      // trackColor = vec4f(n.xyz,1.0);

      textureStore(newTexture, i32InputFragCoord , trackColor );
    }

    fn ray(i32InputFragCoord:vec2<i32>,f32InputFragCoord:vec2<f32>) -> vec4f {
      var Output = vec4f(0.0);
      let i64pi = I64*PI ;
      let iFrame = updateBuffer.frameCount;
      var lastColor2 = textureLoad(combineTexture, i32InputFragCoord , 0) ;
      if (iFrame > 1.0 ) {
          var CurrentFrame = f32(iFrame);
          var SSOffset = vec2f(0.0);
          
          gBuffer = getGBuffer(i32GbufferFragCoord) ;
          var VColor = getRGBMColorFromGBuffer(gBuffer);
          var VNormal = getViewNormalFromGBuffer(gBuffer) ;
          var VPPos = getViewPositionFromGBuffer(gBuffer,f32GbufferUV) ;
          var ModFC = f32InputFragCoord % 4.;
          var RandPhiOffset = ARand21(vec2f(1.234)+ (CurrentFrame*3.26346) % 7.2634 );
          var RandPhi2 = (((floor(ModFC.x)+floor(ModFC.y)*4.0+CurrentFrame*5.0) % 16.0)+RandPhiOffset)*2.0*PI*I64 ;
       
          var stepScale = ceil( 128.0 / f32(offsetCount) ) ;
          var skyColor = vec4f(0.0,0.0,0.0,1.0);
          var ii = 0.0;
          var i=0u;
          for (; i < 4u; i+=1u) {
            let RandPhi = f32(i+1u) * (RandPhi2 + PI * 0.5);
            let SSDir = (vec2f(cos(RandPhi),sin(RandPhi)));

            var StepDist = stepScale ;
            let StepCoeff = 0.15+0.15*ARand21(f32InputUV*(1.4+f32(iFrame)*3.26346%6.2634));

            var BitMask = 0u;
            var s = 1u ;
            for (; s<= offsetCount ; s+=1u)
            {
                let SUV : vec2f = f32InputFragCoord + SSDir * StepDist;

                //round 2d offset
                let CurrentStep = max( 1.0 , (StepDist * StepCoeff) );
                StepDist += CurrentStep;

                //fullsize 
                let offsetUV = (SUV / f32InputSize) ;
                let i32InputUV = vec2i( offsetUV * f32GBufferSize );
                let stepGBuffer = getGBuffer(vec2i(i32InputUV));
                var SSVC = getRGBMColorFromGBuffer(stepGBuffer);
                
                var uuv = (SUV * inputToGBuffer);
                uuv = uuv / f32GBufferSize ;
                var SVPPos = getViewPositionFromGBuffer(stepGBuffer,uuv) ;
                var SWPos = getWorldPositionFromGBuffer(stepGBuffer,uuv) ;
                var SNormal = getViewNormalFromGBuffer(stepGBuffer) ;

                let f = (globalUniform.far - globalUniform.near) - 1000.0;
                if(stepGBuffer.x <= f ){
                  let svvd = SVPPos.xyz-VPPos ;
                  var NorDot = dot(VNormal,(svvd))-0.001;
  
                  if(stepGBuffer.x < -1.1 || NorDot < 1.570796 )
                  {
                     continue ;
                  }
  
                  var TanDist = (length(svvd-NorDot*VNormal));

                  if(TanDist <= 0.00001 )
                  {
                      continue ;
                  }
  
                  var Angle1f = atan2(NorDot,TanDist);
                  var Angle2f = atan2((NorDot-0.03*max(1.0,StepDist*0.07)),TanDist);
  
                  var Angle1 = max(0.0,ceil(Angle1f*halfPi));
                  var Angle2 = max(0.0,floor(Angle2f*halfPi));
  
                  var SBitMask = (u32(pow(2.0,Angle1-Angle2))-1u) << u32(Angle2);
                  
                  let b1 = f32(countOneBits(SBitMask & (~BitMask)))/max(1.0,Angle1-Angle2) ;
                  let b2 = pow(cos(Angle2*i64pi),2.0)-pow(cos(Angle1*i64pi),2.0);
                  let b3 = sqrt(max(0.0,dot(SNormal,-svvd))) ;
                  let fb = b1 * b2 * b3 ;
                  
                  var lastColor2 = textureLoad(combineTexture, vec2i(SUV) , 0) ;
                  Output = vec4f(Output.xyz + vec3f(fb * (SSVC.xyz + lastColor2.xyz * 0.15)  ) , 1.0);
                  BitMask = BitMask | SBitMask;
                }
              }
          }
      }else{
        Output = vec4f( wColor.xyz , 1.0 );
      }

      return Output ;
    }
  `