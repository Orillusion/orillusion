/**
 * @internal
 */
export let SHCommon_frag: string = /*wgsl*/ `

fn Y0(v : vec3f ) -> f32 {
     return ((1.0 / 2.0) * sqrt(1.0 / PI)); 
}

fn Y1(v: vec3f ) -> f32 {
    return ( sqrt(3.0 / (4.0 * PI)) * v.z ) ;
}

fn Y2(v: vec3f ) -> f32 { 
    return (sqrt(3.0 / (4.0 * PI)) * v.y) ;
}

fn Y3(v: vec3f ) -> f32 {  
    return (sqrt(3.0 / (4.0 * PI)) * v.x) ;
}

fn Y4(v: vec3f ) -> f32 { 
    return (1.0 / 2.0 * sqrt(15.0 / PI) * v.x * v.z) ;
}

fn Y5(v: vec3f ) -> f32 { 
    return (1.0 / 2.0 * sqrt(15.0 / PI) * v.z * v.y) ;
}

fn Y6(v: vec3f ) -> f32 { 
    return (1.0 / 4.0 * sqrt(5.0 / PI) * (-v.x * v.x - v.z * v.z + 2.0 * v.y * v.y)) ;
}

fn Y7(v: vec3f ) -> f32 { 
    return (1.0 / 2.0 * -sqrt(15.0 / PI) * v.y * v.x) ;
}

fn Y8(v: vec3f ) -> f32 { 
    return (1.0 / 4.0 * sqrt(15.0 / PI) * (v.x * v.x - v.z * v.z)) ;
}

fn Y9(v: vec3f ) -> f32 { 
    return (1.0 / 4.0 * sqrt(35.0 / (2.0 * PI)) * (3.0 * v.x * v.x - v.z * v.z) * v.z) ;
}

fn Y10(v: vec3f ) -> f32 { 
    return ( 1.0 / 2.0 * sqrt(105.0 / PI) * v.x * v.z * v.y );
}

fn Y11(v: vec3f ) -> f32 { 
    return ( 1.0 / 4.0 * sqrt(21.0 / (2.0 * PI)) * v.z * (4.0 * v.y * v.y - v.x * v.x - v.z * v.z) );
}

fn Y12(v: vec3f ) -> f32 { 
    return ( 1.0 / 4.0 * sqrt(7.0 / PI) * v.y * (2 * v.y * v.y - 3.0 * v.x * v.x - 3.0 * v.z * v.z) );
}

fn Y13(v: vec3f ) -> f32 { 
    return ( 1.0 / 4.0 * sqrt(21.0 / (2.0 * PI)) * v.x * (4.0 * v.y * v.y - v.x * v.x - v.z * v.z) );
}

fn Y14(v: vec3f ) -> f32 { 
    return ( 1.0 / 4.0 * sqrt(105.0 / PI) * (v.x * v.x - v.z * v.z) * v.y );
}

fn Y15(v: vec3f ) -> f32 { 
    return ( 1.0 / 4.0 * sqrt(35.0 / (2.0 * PI)) * (v.x * v.x - 3.0 * v.z * v.z) * v.x );
}

fn SH9(dir: vec3<f32>, coefficients: array<vec4f, 9>) -> vec4<f32> {
    let N: vec3<f32> = vec3<f32>(dir.z, dir.y, dir.x);
    let v: vec3<f32> = normalize(N);

    let color = coefficients[0] * Y0(v)  
        + coefficients[1] * Y1(v) 
        + coefficients[2] * Y2(v) 
        + coefficients[3] * Y3(v) 
        + coefficients[4] * Y4(v) 
        + coefficients[5] * Y5(v) 
        + coefficients[6] * Y6(v) 
        + coefficients[7] * Y7(v)  
        + coefficients[8] * Y8(v) 
    ;
    
    return vec4(color.rgb,1.0) ;
}
`

