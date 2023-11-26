export class common {
    public static cs: string = /* wgsl */ `
    fn add(a: f32, b: f32) -> f32 { return select(a, a + b, b != 0.); }
    fn sub(a: f32, b: f32) -> f32 { return select(a, a - b, b != 0.); }
    fn mul(a: f32, b: f32) -> f32 { return select(a, a * b, b != 1.); }
    fn div(a: f32, b: f32) -> f32 { return select(a, a / b, b != 1.); }
    
    fn fastTwoSum(a: f32, b: f32) -> vec2<f32> {
      let s = add(a, b);
      return vec2<f32>(s, sub(b, sub(s, a)));
    }
    
    fn twoSum(a: f32, b: f32) -> vec2<f32> {
      let s = add(a, b);
      let a1  = sub(s, b);
      return vec2<f32>(s, add(sub(a, a1), sub(b, sub(s, a1))));
    }
    
    fn twoProd(a: f32, b: f32) -> vec2<f32> {
      let ab = mul(a, b);
      return vec2<f32>(ab, fma(a, b, -ab));
    }
    
    fn add22(X: vec2<f32>, Y: vec2<f32>) -> vec2<f32> {
      let S = twoSum(X[0], Y[0]);
      let E = twoSum(X[1], Y[1]);
      let v = fastTwoSum(S[0], add(S[1], E[0]));
      return fastTwoSum(v[0], add(v[1], E[1]));
    }
    
    fn sub22(X: vec2<f32>, Y: vec2<f32>) -> vec2<f32> {
      return add22(X, -Y);
    }
    
    fn mul22(X: vec2<f32>, Y: vec2<f32>) -> vec2<f32> {
      let S = twoProd(X[0], Y[0]);
      let c = fma(X[1], Y[0], mul(X[0], Y[1]));
      return fastTwoSum(S[0], add(S[1], c));
    }
    
    fn div22(X: vec2<f32>, Y: vec2<f32>) -> vec2<f32> {
      let s = X[0] / Y[0];
      let T = twoProd(s, Y[0]);
      let e = ((((X[0] - T[0]) - T[1]) + X[1]) - s * Y[1]) / Y[0];
      return fastTwoSum(s, e);
    }
    
    fn _mod (x: f32, y: f32) -> f32{
        return x - floor(x / y) * y;
        // let x_double = vec2<f32>(x, 0.0);
        // let y_double = vec2<f32>(y, 0.0);
        // let result = sub22(x_double, mul22(floor(div22(x_double, y_double)), y_double));
        // return result[0];
    }
    
    fn gridtocell (index: u32, resolution: vec3<f32>) -> vec3<f32>{
        var indexfloat = f32(index) + f32(0.005);
        var cellindex = vec3<f32>(_mod(indexfloat, resolution.x), _mod(floor(indexfloat / resolution.x), resolution.y), 
                        floor(indexfloat / resolution.x / resolution.y)); 
        return cellindex;
    }
    
    fn celltogrid (index: vec3<f32>, resolution: vec3<f32>) -> u32{
        var clampindex = clamp(index, vec3<f32>(0.0), resolution - vec3<f32>(1.0));
        var gridindex = u32(clampindex.x + clampindex.y * resolution.x + clampindex.z * resolution.x * resolution.y);
        return gridindex;
    }
    
    fn interpvel (index: vec3<f32>, velocity1: vec3<f32>, velocity2: vec3<f32>, position: vec3<f32>) -> vec3<f32>{
        var newvelocityx: f32 = (index.x + 1.0 - position.x) * velocity1.x + (position.x - index.x) * velocity2.x;
        var newvelocityy: f32 = (index.y + 1.0 - position.y) * velocity1.y + (position.y - index.y) * velocity2.y;
        var newvelocityz: f32 = (index.z + 1.0 - position.z) * velocity1.z + (position.z - index.z) * velocity2.z;
    
        return vec3<f32>(newvelocityx, newvelocityy, newvelocityz);
    }
    `;
}
