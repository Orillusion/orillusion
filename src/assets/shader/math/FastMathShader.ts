export let FastMathShader: string = /*wgsl*/ `
  fn Pow3(  x : f32 ) -> f32
  {
      var xx = x*x;
      return x * xx;
  }

  fn Pow4(  x : f32 ) -> f32
  {
      var xx = x*x;
      return xx * xx;
  }

  fn pow5(x: f32) -> f32 {
      var x2 = x * x;
      return x2 * x2 * x;
  }

  fn rcp( x:f32 ) -> f32
  {
      return 1.0 / x;
  }

  fn rsqrt3( a : vec3<f32> ) -> vec3<f32>
  {
    return pow(a, vec3<f32>(-0.5));
  }

  fn rsqrt( a : f32 ) -> f32
  {
    return pow(a, -0.5);
  }
`

