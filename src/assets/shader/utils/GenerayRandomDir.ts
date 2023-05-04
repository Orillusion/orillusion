

export let GenerayRandomDir: string = /*wgsl*/ `
    fn madfrac(A:f32, B:f32)-> f32 {
        return A*B-floor(A*B) ;
    }

    fn sampleRandomDir(count:u32,SAMPLE_COUNT:u32) -> vec3<f32>{
    var ray_dir = sphericalFibonacci(f32((count)), f32(SAMPLE_COUNT) );
    return normalize(ray_dir) ;
    }

    fn sphericalFibonacci( i : f32 ,  n : f32 ) -> vec3<f32>{
        const PHI = sqrt(5.0) * 0.5 + 0.5;
        let phi = 2.0 * PI * madfrac(i, PHI - 1);
        let cosTheta = 1.0 - (2.0 * i + 1.0) * (1.0 / n);
        let sinTheta = sqrt(saturate(1.0 - cosTheta*cosTheta));

        return vec3<f32>(
            cos(phi) * sinTheta,
            sin(phi) * sinTheta,
            cosTheta);

    }
`