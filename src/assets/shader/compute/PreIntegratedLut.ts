
export let PreIntegratedLut: string = /*wgsl*/ `
var<private>PI: f32 = 3.141592653589793;

fn Scatter( r:f32) -> vec3f
{
    return Gaussian(0.0064 * 1.414, r) * vec3f(0.233, 0.455, 0.649)
           + Gaussian(0.0484 * 1.414, r) * vec3f(0.100, 0.336, 0.344)
           + Gaussian(0.1870 * 1.414, r) * vec3f(0.118, 0.198, 0.000)
           + Gaussian(0.5670 * 1.414, r) * vec3f(0.113, 0.007, 0.007)
           + Gaussian(1.9900 * 1.414, r) * vec3f(0.358, 0.004, 0.00001)
           + Gaussian(7.4100 * 1.414, r) * vec3f(0.078, 0.00001, 0.00001);
}

fn Gaussian( v:f32 , r:f32 ) -> f32
{
    return 1.0 / sqrt(2.0 * PI * v) * exp(-(r * r) / (2.0 * v));
}

fn Integrate( cosTheta : f32 ,  skinRadius: f32 ) -> vec3f
{
    var theta = acos(cosTheta);  // theta -> the angle from lighting direction
    var totalWeights = vec3f(0.0);
    var totalLight = vec3f(0.0);

    var a = -(PI / 2.0);
    let inc = 0.05;

    while ( a <= (PI / 2.0) ) {
        var sampleAngle = theta + a;
        var diffuse = clamp(cos(sampleAngle),0.0,1.0);

        // calc distance
        var sampleDist = abs(2.0 * skinRadius * sin(a * 0.5));

        // estimated by Gaussian pdf
        var weights = Scatter(sampleDist);

        totalWeights += weights;
        totalLight += diffuse * weights;
        a += inc;
    }

    var result = vec3f(totalLight.x / totalWeights.x, totalLight.y / totalWeights.y, totalLight.z / totalWeights.z);
    return result;
}

@group(0) @binding(0) var sssMap: texture_storage_2d<rgba8unorm, write>;

@compute @workgroup_size(8, 8, 1)
// fn CsMain( @builtin(workgroup_id) workgroup_id : vec3<u32> , @builtin(local_invocation_id) local_invocation_id : vec3<u32> ){
fn CsMain(@builtin(global_invocation_id) global_invocation_id : vec3<u32>){
    var fragCoord = vec2<u32>(global_invocation_id.x, global_invocation_id.y);

    var fragColor = vec4<f32>(1.0,1.0,0.0,1.0);
    // // Output to screen
    // var res = integrateBRDF(f32(fragCoord.y + 1u) / 256.0, f32(fragCoord.x + 1u) / 256.0);
    // fragColor = vec4<f32>(res.x, res.y, 0.0, 1.0);

    var NDotL = mix(-1.0, 1.0, f32(fragCoord.x) / 256.0) ; 
    var oneOverR = 2.0 * 1.0 / (f32((fragCoord.y + 1u)) / 256.0);  

    //Integrate Diffuse Scattering
    var diff = Integrate(NDotL, oneOverR);
    // fragColor = vec4f(diff,1.0);
    fragColor = vec4f(vec3f(diff),1.0);
    textureStore(sssMap, vec2<i32>(fragCoord.xy), fragColor);
}
`

