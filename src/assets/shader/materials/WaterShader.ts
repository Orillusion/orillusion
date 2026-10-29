import { WATER_FFT_MIPS, WATER_FFT_SIZE } from '../../../components/renderer/WaterFFT';

/** Number of Gerstner waves the water shaders evaluate. */
export const WATER_MAX_WAVES = 8;

/**
 * Gerstner waves shared by the water surface, the underwater pass and
 * WaterRenderer.getHeight on the CPU. A wave is vec4(direction.x,
 * direction.z, steepness, wavelength); a wavelength of 0 disables it.
 * Phase speed follows deep-water dispersion, c = sqrt(g / k).
 * @internal
 */
export let WaterWaves_wgsl: string = /*wgsl*/ `
    const WATER_GRAVITY: f32 = 9.81;
    const WATER_PI: f32 = 3.14159265;

    // Adds one wave's displacement and accumulates the surface tangent / binormal.
    fn gerstner(wave: vec4<f32>, p: vec2<f32>, t: f32, tangent: ptr<function, vec3<f32>>, binormal: ptr<function, vec3<f32>>) -> vec3<f32> {
        if (wave.w <= 0.0) {
            return vec3<f32>(0.0);
        }
        let k = 2.0 * WATER_PI / wave.w;
        let c = sqrt(WATER_GRAVITY / k);
        let d = normalize(wave.xy);
        let f = k * (dot(d, p) - c * t);
        let a = wave.z / k;
        let s = sin(f);
        let co = cos(f);
        *tangent += vec3<f32>(-d.x * d.x * wave.z * s, d.x * wave.z * co, -d.x * d.y * wave.z * s);
        *binormal += vec3<f32>(-d.x * d.y * wave.z * s, d.y * wave.z * co, -d.y * d.y * wave.z * s);
        return vec3<f32>(d.x * a * co, a * s, d.y * a * co);
    }

    const WATER_WAVES: i32 = ${WATER_MAX_WAVES};

    // Displacement of the undisplaced surface point p (world xz) by the waves.
    fn waterWaves(waves: array<vec4<f32>, ${WATER_MAX_WAVES}>, p: vec2<f32>, t: f32,
                  tangent: ptr<function, vec3<f32>>, binormal: ptr<function, vec3<f32>>) -> vec3<f32> {
        var w = waves;
        var d = vec3<f32>(0.0);
        for (var i = 0; i < WATER_WAVES; i++) {
            d += gerstner(w[i], p, t, tangent, binormal);
        }
        return d;
    }

    // Height of the displaced surface above world xz, relative to the undisplaced plane.
    // The waves also move points sideways, so the source point is found by fixed-point iteration.
    fn waterHeight(waves: array<vec4<f32>, ${WATER_MAX_WAVES}>, xz: vec2<f32>, t: f32) -> f32 {
        var tangent = vec3<f32>(0.0);
        var binormal = vec3<f32>(0.0);
        var p = xz;
        for (var i = 0; i < 4; i++) {
            p = xz - waterWaves(waves, p, t, &tangent, &binormal).xz;
        }
        return waterWaves(waves, p, t, &tangent, &binormal).y;
    }

    // Fine ripples on top of the waves, too small to displace the mesh: direction angle,
    // wavelength relative to the detail scale, relative steepness, phase. They bend the
    // surface normal per pixel and focus the sunlight into caustics.
    const WATER_DETAIL_COUNT: i32 = 8;
    const WATER_DETAIL = array<vec4<f32>, 8>(
        vec4<f32>(0.00, 1.00, 1.0, 0.0), vec4<f32>(2.40, 0.73, 1.0, 1.7),
        vec4<f32>(4.80, 1.31, 0.8, 4.1), vec4<f32>(0.92, 0.58, 1.1, 2.9),
        vec4<f32>(3.32, 0.87, 1.0, 5.3), vec4<f32>(5.72, 1.12, 0.9, 0.6),
        vec4<f32>(1.84, 0.66, 1.1, 3.6), vec4<f32>(4.24, 1.47, 0.8, 2.2),
    );
    // Shortest detail wavelength relative to the detail scale.
    const WATER_DETAIL_SHORTEST: f32 = 0.58;
    // Wavelength of the second, coarser octave of surface detail relative to the first.
    const WATER_DETAIL_OCTAVE: f32 = 2.3;
    // Light path in the water at which the ripples focus sunlight into the sharpest lines;
    // their steepness follows from it, so the detail scale changes their size, not the focus.
    // Past the bottom of a typical pool, so the caustics there are still soft.
    const WATER_DETAIL_FOCUS: f32 = 3.5;

    struct WaterSlope {
        // height gradient (x, z)
        grad: vec2<f32>,
        // second derivatives (xx, xz, zz)
        hess: vec3<f32>,
    };

    // Adds one sinusoidal height term (s / k) * sin(phase): direction d, wavenumber k, steepness s.
    fn waterSlopeTerm(slope: ptr<function, WaterSlope>, d: vec2<f32>, k: f32, s: f32, phase: f32) {
        (*slope).grad += s * cos(phase) * d;
        (*slope).hess += -s * k * sin(phase) * vec3<f32>(d.x * d.x, d.x * d.y, d.y * d.y);
    }

    // Adds the fine ripples at xz; scale = their base wavelength, angle turns their directions.
    fn waterDetail(slope: ptr<function, WaterSlope>, xz: vec2<f32>, t: f32, scale: f32, angle: f32) {
        // The summed curvature is about steepness * k * sqrt(count / 2), and focuses the light
        // where WATER_DETAIL_FOCUS * (1 - 1 / 1.333) times it reaches 1.
        let steepness = 1.0 / (WATER_DETAIL_FOCUS * (1.0 - 1.0 / 1.333) * sqrt(f32(WATER_DETAIL_COUNT) * 0.5));
        var detail = WATER_DETAIL;
        for (var j = 0; j < WATER_DETAIL_COUNT; j++) {
            let r = detail[j];
            let k = 2.0 * WATER_PI / (scale * r.y);
            let d = vec2<f32>(cos(r.x + angle), sin(r.x + angle));
            waterSlopeTerm(slope, d, k, steepness * r.z / k, k * dot(d, xz) - sqrt(WATER_GRAVITY * k) * t + r.w);
        }
    }
`;

/**
 * Water surface (WaterMaterial).
 *
 * Vertex: the mesh is displaced in world space by up to four Gerstner
 * waves (WaterWaves_wgsl), so neighbouring water objects line up, each
 * fading out with distance from the camera (surface.x), plus the
 * interactive ripples (USE_RIPPLES), whose slope also bends the normal per
 * pixel.
 *
 * Fragment: the fine ripples (WaterWaves_wgsl, detail scale and strength)
 * bend the normal per pixel, fading where a pixel spans them.
 *
 * Fragment (front face, seen from above):
 * - refraction: the opaque scene behind (scene color pyramid), shifted by
 *   how far the waves move the refracted ray's landing point on the
 *   bottom compared with flat water. With USE_SCENEDEPTH the depth is
 *   that of the scene behind (SceneLinearDepthPass), and the distortion
 *   fades out toward anything above the water, whose hidden background
 *   is missing from the capture; without it the bottom is waterDepth
 *   below the surface;
 * - absorption: Beer-Lambert over the refracted path,
 *   T = exp(-density * length * (1 - absorptionColor)), with the water's
 *   own color (underwaterColor) scattered in for what is absorbed, as in
 *   UnderwaterPass;
 * - reflection: environment map weighted by Schlick fresnel;
 * - specular: Blinn-Phong highlight of the first directional light,
 *   weighted by Schlick fresnel.
 *
 * Fragment (back face, seen from below): inside Snell's window the scene
 * above, refracted from water into air; outside it total internal
 * reflection of the scene below, found by marching the reflected ray
 * against the scene depth (USE_SCENEDEPTH) and fading into underwaterColor
 * with distance. Absorption from the camera to the surface is left to
 * UnderwaterPass.
 * @internal
 */
export let WaterShader: string = /*wgsl*/ `
    #include "Common_vert"
    #include "UnLit_frag"
    #include "ClusterLight"
    #include "EnvMap_frag"

    struct MaterialUniform {
        absorptionColor: vec4<f32>,
        underwaterColor: vec4<f32>,
        waveA: vec4<f32>,
        waveB: vec4<f32>,
        waveC: vec4<f32>,
        waveD: vec4<f32>,
        waveE: vec4<f32>,
        waveF: vec4<f32>,
        waveG: vec4<f32>,
        waveH: vec4<f32>,
        rippleX: vec4<f32>,
        rippleZ: vec4<f32>,
        rippleBounds: vec4<f32>,
        // x = distance from the camera, in wavelengths, at which a wave has faded out (0 = never),
        // y = undisturbed surface height, z = detail scale, w = detail strength
        surface: vec4<f32>,
        // x = foam intensity, y = reflection roughness, z = subsurface intensity,
        // w = clarity of the surface seen from below
        look: vec4<f32>,
        // FFT cascades: patch sizes (xyz), typical crest height (w)
        fftPatch: vec4<f32>,
        density: f32,
        refractionStrength: f32,
        waterDepth: f32,
        specularPower: f32,
        waveTime: f32,
        fresnelClamp: f32,
        specularIntensity: f32,
        reflectionIntensity: f32,
    };

    @group(2) @binding(0)
    var<uniform> materialUniform: MaterialUniform;

    @group(1) @binding(auto)
    var sceneColorPyramidSampler: sampler;
    @group(1) @binding(auto)
    var sceneColorPyramid: texture_2d<f32>;

    #if USE_SCENEDEPTH
        // Linear view depth of the opaque scene (SceneLinearDepthPass), read with textureLoad.
        @group(1) @binding(auto)
        var sceneLinearDepth: texture_2d<f32>;
    #endif

    #if USE_FFT
        // FFT wave cascades (WaterFFT), each tiled every fftPatch metres: displacement (x, y, z,
        // dDx/dz) and slope (dDy/dx, dDy/dz, dDx/dx, dDz/dz); foam over the first patch.
        @group(1) @binding(auto)
        var fftDisplacement0Sampler: sampler;
        @group(1) @binding(auto)
        var fftDisplacement0: texture_2d<f32>;
        @group(1) @binding(auto)
        var fftDisplacement1: texture_2d<f32>;
        @group(1) @binding(auto)
        var fftDisplacement2: texture_2d<f32>;
        @group(1) @binding(auto)
        var fftSlope0: texture_2d<f32>;
        @group(1) @binding(auto)
        var fftSlope1: texture_2d<f32>;
        @group(1) @binding(auto)
        var fftSlope2: texture_2d<f32>;
        @group(1) @binding(auto)
        var fftFoam: texture_2d<f32>;

        // Mip level of a cascade that keeps the waves the mesh resolves at this distance: down to
        // distance / surface.x wavelengths long, against two texels per wave at level 0.
        fn fftMeshLod(texel: f32, distance: f32) -> f32 {
            let perWave = materialUniform.surface.x;
            if (perWave <= 0.0) {
                return 0.0;
            }
            return clamp(log2(distance / perWave / (2.0 * texel)), 0.0, f32(${WATER_FFT_MIPS - 1}));
        }

        // Displacement of the undisplaced world point xz by the cascades, without the waves too
        // short for the mesh at this distance; the long swells stay however far.
        fn fftDisplacement(xz: vec2<f32>, distance: f32) -> vec3<f32> {
            let p = materialUniform.fftPatch;
            let texel = p.xyz / f32(${WATER_FFT_SIZE});
            return textureSampleLevel(fftDisplacement0, fftDisplacement0Sampler, xz / p.x, fftMeshLod(texel.x, distance)).xyz
                 + textureSampleLevel(fftDisplacement1, fftDisplacement0Sampler, xz / p.y, fftMeshLod(texel.y, distance)).xyz
                 + textureSampleLevel(fftDisplacement2, fftDisplacement0Sampler, xz / p.z, fftMeshLod(texel.z, distance)).xyz;
        }

        // Height gradient of the cascades at the undisplaced point xz, at the mip level matching
        // the pixel. What the coarser levels average away comes back as roughness (z).
        fn fftSlope(xz: vec2<f32>, footprint: f32) -> vec3<f32> {
            let p = materialUniform.fftPatch;
            let texel = p.xyz / f32(${WATER_FFT_SIZE});
            let lod = clamp(log2(vec3<f32>(footprint) / texel), vec3<f32>(0.0), vec3<f32>(f32(${WATER_FFT_MIPS - 1})));
            let g = textureSampleLevel(fftSlope0, fftDisplacement0Sampler, xz / p.x, lod.x).xy
                  + textureSampleLevel(fftSlope1, fftDisplacement0Sampler, xz / p.y, lod.y).xy
                  + textureSampleLevel(fftSlope2, fftDisplacement0Sampler, xz / p.z, lod.z).xy;
            return vec3<f32>(g, min(lod.y, 1.0) * 0.3 + min(lod.z, 1.0) * 0.6);
        }

        // Foam left by the whitecaps at the undisplaced point xz.
        fn fftFoamAt(xz: vec2<f32>) -> f32 {
            return textureSampleLevel(fftFoam, fftDisplacement0Sampler, xz / materialUniform.fftPatch.x, 0.0).r;
        }
    #endif

    #if USE_FOAM_TEXTURE
        // Tileable foam (r): revealed above a threshold that falls as the coverage rises.
        @group(1) @binding(auto)
        var foamTextureSampler: sampler;
        @group(1) @binding(auto)
        var foamTexture: texture_2d<f32>;
    #endif

    #if USE_RIPPLES
        // Interactive ripples (WaterRipples): r = height, over the water's local xz bounds.
        @group(1) @binding(auto)
        var rippleMap: texture_2d<f32>;

        // Ripple grid texel coordinates of world xz.
        fn rippleCoord(xz: vec2<f32>) -> vec2<f32> {
            let local = vec2<f32>(
                dot(materialUniform.rippleX.xy, xz) + materialUniform.rippleX.z,
                dot(materialUniform.rippleZ.xy, xz) + materialUniform.rippleZ.z);
            let b = materialUniform.rippleBounds;
            return (local - b.xy) / (b.zw - b.xy) * vec2<f32>(textureDimensions(rippleMap)) - 0.5;
        }

        fn rippleTexel(c: vec2<i32>) -> f32 {
            let size = vec2<i32>(textureDimensions(rippleMap));
            return textureLoad(rippleMap, clamp(c, vec2<i32>(0), size - 1), 0).r;
        }

        // Bilinear height at grid coordinates; none off the grid.
        fn rippleHeight(coord: vec2<f32>) -> f32 {
            let size = vec2<f32>(textureDimensions(rippleMap));
            if (any(coord < vec2<f32>(-0.5)) || any(coord > size - 0.5)) {
                return 0.0;
            }
            let c = vec2<i32>(floor(coord));
            let f = coord - floor(coord);
            let top = mix(rippleTexel(c), rippleTexel(c + vec2<i32>(1, 0)), f.x);
            let bottom = mix(rippleTexel(c + vec2<i32>(0, 1)), rippleTexel(c + vec2<i32>(1, 1)), f.x);
            return mix(top, bottom, f.y);
        }

        // World-space height gradient (d/dx, d/dz) of the ripples at world xz.
        fn rippleGradient(xz: vec2<f32>) -> vec2<f32> {
            let coord = rippleCoord(xz);
            let b = materialUniform.rippleBounds;
            let cell = (b.zw - b.xy) / vec2<f32>(textureDimensions(rippleMap));
            let local = vec2<f32>(
                rippleHeight(coord + vec2<f32>(1.0, 0.0)) - rippleHeight(coord - vec2<f32>(1.0, 0.0)),
                rippleHeight(coord + vec2<f32>(0.0, 1.0)) - rippleHeight(coord - vec2<f32>(0.0, 1.0))) / (2.0 * cell);
            return vec2<f32>(
                local.x * materialUniform.rippleX.x + local.y * materialUniform.rippleZ.x,
                local.x * materialUniform.rippleX.y + local.y * materialUniform.rippleZ.y);
        }
    #endif

    ${WaterWaves_wgsl}

    const WATER_IOR: f32 = 1.333;
    const WATER_F0: f32 = 0.02;
    // Far enough that projecting a point along a ray gives the ray's direction on screen.
    const WATER_FAR_SAMPLE: f32 = 1000.0;
    // Reflection march below the surface: steps, and how far it reaches in world units.
    const WATER_MARCH_STEPS: i32 = 24;
    const WATER_MARCH_DISTANCE: f32 = 40.0;
    // Steps for finding objects above the water along a refraction offset.
    const WATER_REFRACT_STEPS: i32 = 8;
    // How much the scattered water color follows the light entering the surface: at most this
    // much brighter or darker for facing toward or away from the sun, and for the crests. Light
    // inside deep water is diffused, so the surface's orientation shows only gently.
    const WATER_SCATTER_FACING: f32 = 0.3;
    const WATER_SCATTER_CREST: f32 = 0.2;
    // Foam: where the waves pinch the surface (Jacobian of the horizontal displacement) below
    // the first value it starts, below the second it covers the crest.
    const WATER_FOAM_START: f32 = 0.8;
    const WATER_FOAM_FULL: f32 = 0.5;
    // Foam texture: metres per tile at its two scales, and how deep under the surface the
    // bubble layer is seen.
    const WATER_FOAM_TILE: f32 = 3.0;
    const WATER_FOAM_TILE_LARGE: f32 = 8.5;
    const WATER_FOAM_BUBBLE_DEPTH: f32 = 0.25;
    const WATER_FOAM_TEXELS: f32 = 512.0;
    // Wave height at which the crests let the full subsurface glow through, and its strength.
    const WATER_SSS_HEIGHT: f32 = 1.0;
    const WATER_SSS: f32 = 2.0;

    // Value noise in [0, 1].
    fn waterHash(p: vec2<f32>) -> f32 {
        return fract(sin(dot(p, vec2<f32>(127.1, 311.7))) * 43758.5453);
    }
    fn waterNoise(p: vec2<f32>) -> f32 {
        let i = floor(p);
        let f = p - i;
        let u = f * f * (3.0 - 2.0 * f);
        return mix(mix(waterHash(i), waterHash(i + vec2<f32>(1.0, 0.0)), u.x),
                   mix(waterHash(i + vec2<f32>(0.0, 1.0)), waterHash(i + vec2<f32>(1.0, 1.0)), u.x), u.y);
    }

    // A wave with its steepness faded out from half surface.x wavelengths away from the camera to surface.x.
    fn fadeWave(wave: vec4<f32>, distance: f32) -> vec4<f32> {
        let far = materialUniform.surface.x * wave.w;
        if (far <= 0.0) {
            return wave;
        }
        return vec4<f32>(wave.xy, wave.z * (1.0 - smoothstep(0.5 * far, far, distance)), wave.w);
    }

    fn vert(inputData: VertexAttributes) -> VertexOutput {
        ORI_Vert(inputData);
        var worldPos = ORI_VertexOut.varying_WPos.xyz;
        let p = worldPos.xz;
        let t = materialUniform.waveTime;
        var tangent = vec3<f32>(1.0, 0.0, 0.0);
        var binormal = vec3<f32>(0.0, 0.0, 1.0);
        // Waves shorter than the mesh or a pixel resolves would alias; they fade with distance.
        let distance = length(worldPos - globalUniform.CameraPos.xyz);
        let m = materialUniform;
        let waves = array<vec4<f32>, ${WATER_MAX_WAVES}>(
            fadeWave(m.waveA, distance), fadeWave(m.waveB, distance), fadeWave(m.waveC, distance), fadeWave(m.waveD, distance),
            fadeWave(m.waveE, distance), fadeWave(m.waveF, distance), fadeWave(m.waveG, distance), fadeWave(m.waveH, distance));
        worldPos += waterWaves(waves, p, t, &tangent, &binormal);
        #if USE_FFT
            worldPos += fftDisplacement(p, distance);
        #endif
        // How much the waves pinch the surface here: 1 when flat, toward 0 at sharp crests.
        let jacobian = tangent.x * binormal.z - tangent.z * binormal.x;
        #if USE_RIPPLES
            worldPos.y += rippleHeight(rippleCoord(p));
        #endif

        let viewPos = ORI_MATRIX_V * vec4<f32>(worldPos, 1.0);
        var clipPos = ORI_MATRIX_P * viewPos;
        #if USE_LOGDEPTH
            clipPos.z = log2Depth(clipPos.w, globalUniform.near, globalUniform.far);
        #endif
        ORI_VertexOut.varying_WPos = vec4<f32>(worldPos, ORI_VertexOut.varying_WPos.w);
        ORI_VertexOut.varying_WNormal = normalize(cross(binormal, tangent));
        ORI_VertexOut.varying_ViewPos = viewPos;
        ORI_VertexOut.varying_UV1 = vec2<f32>(jacobian, 0.0);
        // The undisplaced point, where the fragment looks up the FFT cascades.
        ORI_VertexOut.varying_UV0 = p;
        ORI_VertexOut.varying_Clip = clipPos;
        ORI_VertexOut.member = clipPos;
        return ORI_VertexOut;
    }

    // Direction toward the first directional light (light data holds the way its rays travel), and its radiance.
    fn sunLight(color: ptr<function, vec3<f32>>) -> vec3<f32> {
        let count = i32(clustersUniform.numLights);
        for (var i = 0; i < count; i++) {
            let light = lightBuffer[i];
            if (light.lightType == DirectLightType) {
                *color = light.lightColor * light.intensity;
                return -normalize(light.direction);
            }
        }
        *color = vec3<f32>(0.0);
        return vec3<f32>(0.0, 1.0, 0.0);
    }

    fn screenUV(worldPos: vec3<f32>) -> vec2<f32> {
        let clip = globalUniform.projMat * globalUniform.viewMat * vec4<f32>(worldPos, 1.0);
        let ndc = clip.xy / max(clip.w, 1e-4);
        return clamp(vec2<f32>(ndc.x * 0.5 + 0.5, ndc.y * -0.5 + 0.5), vec2<f32>(0.002), vec2<f32>(0.998));
    }

    #if USE_SCENEDEPTH
        fn sceneViewZ(uv: vec2<f32>) -> f32 {
            let dim = vec2<i32>(textureDimensions(sceneLinearDepth));
            return textureLoad(sceneLinearDepth, clamp(vec2<i32>(uv * vec2<f32>(dim)), vec2<i32>(0), dim - 1), 0).r;
        }

        // World position of the opaque scene at uv.
        fn sceneWorldPos(uv: vec2<f32>) -> vec3<f32> {
            let ndc = vec2<f32>(uv.x * 2.0 - 1.0, 1.0 - uv.y * 2.0);
            let farH = globalUniform.projMatInv * vec4<f32>(ndc, 1.0, 1.0);
            let ray = farH.xyz / farH.w;
            let viewPos = ray * (sceneViewZ(uv) / ray.z);
            return (globalUniform.cameraWorldMatrix * vec4<f32>(viewPos, 1.0)).xyz;
        }

        // Only scene points below the surface can be seen through it.
        fn seenThrough(uv: vec2<f32>, surfaceY: f32) -> bool {
            return sceneWorldPos(uv).y < surfaceY;
        }

        // Screen uv and view depth of a world point.
        fn projectPoint(worldPos: vec3<f32>) -> vec3<f32> {
            let viewPos = globalUniform.viewMat * vec4<f32>(worldPos, 1.0);
            let clip = globalUniform.projMat * viewPos;
            let ndc = clip.xy / max(clip.w, 1e-4);
            return vec3<f32>(ndc.x * 0.5 + 0.5, ndc.y * -0.5 + 0.5, viewPos.z);
        }
    #endif

    // The scene below reflected by the underside along R, absorbed into underwaterColor over the path.
    fn reflectedBelow(worldPos: vec3<f32>, R: vec3<f32>) -> vec3<f32> {
        let deep = materialUniform.underwaterColor.rgb;
        #if USE_SCENEDEPTH
            var t0 = 0.0;
            var t1 = -1.0;
            for (var i = 1; i <= WATER_MARCH_STEPS; i++) {
                let f = f32(i) / f32(WATER_MARCH_STEPS);
                let t = WATER_MARCH_DISTANCE * f * f;
                let s = projectPoint(worldPos + R * t);
                if (s.z <= 0.0 || any(s.xy < vec2<f32>(0.0)) || any(s.xy > vec2<f32>(1.0))) {
                    break;
                }
                let behind = s.z - sceneViewZ(s.xy);
                // Behind the depth by more than the step: the ray passed behind a thin object.
                if (behind >= 0.0 && behind < max(1.0, (t - t0) * 2.0)) {
                    t1 = t;
                    break;
                }
                t0 = t;
            }
            if (t1 < 0.0) {
                return deep;
            }
            for (var i = 0; i < 5; i++) {
                let t = 0.5 * (t0 + t1);
                let s = projectPoint(worldPos + R * t);
                if (s.z >= sceneViewZ(s.xy)) {
                    t1 = t;
                } else {
                    t0 = t;
                }
            }
            let uv = projectPoint(worldPos + R * t1).xy;
            let hit = textureSampleLevel(sceneColorPyramid, sceneColorPyramidSampler, uv, 0.0).rgb;
            let transmittance = exp(-materialUniform.density * t1 * (vec3<f32>(1.0) - materialUniform.absorptionColor.rgb));
            let edge = min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y));
            let fade = smoothstep(0.0, 0.05, edge);
            return mix(deep, hit * transmittance + deep * (vec3<f32>(1.0) - transmittance), fade);
        #else
            return deep;
        #endif
    }

    // The surface seen from below: Snell's window, total internal reflection outside it.
    // Clarity above 0 eases the index toward 1 and lowers the reflectance: a wider window
    // and less of the surface given over to the mirror of the water below.
    fn fromBelow(worldPos: vec3<f32>, V: vec3<f32>, N: vec3<f32>) -> vec3<f32> {
        let clarity = clamp(materialUniform.look.w, 0.0, 1.0);
        let reflected = reflectedBelow(worldPos, reflect(-V, N));
        let refr = refract(-V, N, mix(WATER_IOR, 1.02, clarity));
        if (dot(refr, refr) < 1e-6) {
            return reflected;
        }
        let above = textureSampleLevel(sceneColorPyramid, sceneColorPyramidSampler,
            screenUV(worldPos + refr * WATER_FAR_SAMPLE), 0.0).rgb;
        // Fresnel on the angle in air: reflectance rises to 1 at the window's edge.
        let cosT = clamp(dot(refr, -N), 0.0, 1.0);
        let fresnel = (WATER_F0 + (1.0 - WATER_F0) * pow(1.0 - cosT, 5.0)) * (1.0 - 0.6 * clarity);
        return mix(above, reflected, fresnel);
    }

    // Sum of the wave amplitudes, the highest a crest rises.
    fn waveAmplitude() -> f32 {
        let m = materialUniform;
        return (m.waveA.z * m.waveA.w + m.waveB.z * m.waveB.w + m.waveC.z * m.waveC.w + m.waveD.z * m.waveD.w
              + m.waveE.z * m.waveE.w + m.waveF.z * m.waveF.w + m.waveG.z * m.waveG.w + m.waveH.z * m.waveH.w) / (2.0 * WATER_PI);
    }

    fn frag() {
        let worldPos = ORI_VertexVarying.vWorldPos.xyz;
        let V = normalize(globalUniform.CameraPos.xyz - worldPos);
        var N = normalize(ORI_VertexVarying.vWorldNormal);
        // Fine ripples, per pixel; they fade out where a pixel spans a good part of the shortest one.
        let footprint = length(fwidth(worldPos.xz));
        let detailScale = materialUniform.surface.z;
        let resolved = 1.0 - smoothstep(0.1, 0.4, footprint / max(detailScale * WATER_DETAIL_SHORTEST, 1e-4));
        var fftRoughness = 0.0;
        #if USE_FFT
            let fftGrad = fftSlope(ORI_VertexVarying.fragUV0, footprint);
            N = normalize(N - vec3<f32>(fftGrad.x, 0.0, fftGrad.y));
            fftRoughness = fftGrad.z;
        #endif
        if (materialUniform.surface.w * resolved > 0.0) {
            var detail = WaterSlope(vec2<f32>(0.0), vec3<f32>(0.0));
            waterDetail(&detail, worldPos.xz, materialUniform.waveTime, detailScale, 0.0);
            // A longer, turned octave at half the slope breaks up the pattern of the first.
            var coarse = WaterSlope(vec2<f32>(0.0), vec3<f32>(0.0));
            waterDetail(&coarse, worldPos.xz, materialUniform.waveTime, detailScale * WATER_DETAIL_OCTAVE, 1.1);
            detail.grad += coarse.grad * 0.5;
            N = normalize(N - vec3<f32>(detail.grad.x, 0.0, detail.grad.y) * materialUniform.surface.w * resolved);
        }
        #if USE_RIPPLES
            // Per pixel: the ripples are finer than the mesh.
            let rippleSlope = rippleGradient(worldPos.xz);
            N = normalize(N - vec3<f32>(rippleSlope.x, 0.0, rippleSlope.y));
        #endif
        if (!ORI_VertexVarying.face) {
            ORI_ShadingInput.BaseColor = vec4<f32>(fromBelow(worldPos, V, -N), 1.0);
            UnLit();
            return;
        }

        let refr = refract(-V, N, 1.0 / WATER_IOR);
        let directUV = ORI_VertexVarying.fragCoord.xy / vec2<f32>(globalUniform.windowWidth, globalUniform.windowHeight);
        // Path of the refracted ray down to the bottom: the depth of the scene behind, below this point.
        #if USE_SCENEDEPTH
            let depth = max(worldPos.y - sceneWorldPos(directUV).y, 0.0);
        #else
            let depth = materialUniform.waterDepth;
        #endif
        let travel = depth / max(-refr.y, 0.2);
        // Only the distortion the waves add: where the refracted ray lands relative to where it
        // would through flat water. The flat-water shift is left out, so the bottom keeps its
        // place on screen and objects above the water hide almost nothing it needs.
        let refrFlat = refract(-V, vec3<f32>(0.0, 1.0, 0.0), 1.0 / WATER_IOR);
        let bottom = screenUV(worldPos + refr * travel);
        let bottomFlat = screenUV(worldPos + refrFlat * (depth / max(-refrFlat.y, 0.2)));
        let offset = (bottom - bottomFlat) * materialUniform.refractionStrength;
        var uv = clamp(directUV + offset, vec2<f32>(0.002), vec2<f32>(0.998));
        #if USE_SCENEDEPTH
            // The captured scene also holds what is above the water (e.g. a floating object's top),
            // and what it hides is missing. Find where along twice the offset the first such sample
            // is, and use half that distance: the distortion fades to zero at the object's edge, so
            // the image stays continuous and never samples the edge itself.
            if (!seenThrough(directUV + offset, worldPos.y) || !seenThrough(directUV + offset * 2.0, worldPos.y)) {
                var lo = 0.0;
                var hi = 2.0;
                for (var i = 1; i <= WATER_REFRACT_STEPS; i++) {
                    let s = 2.0 * f32(i) / f32(WATER_REFRACT_STEPS);
                    if (!seenThrough(directUV + offset * s, worldPos.y)) {
                        hi = s;
                        break;
                    }
                    lo = s;
                }
                for (var i = 0; i < 3; i++) {
                    let s = 0.5 * (lo + hi);
                    if (seenThrough(directUV + offset * s, worldPos.y)) {
                        lo = s;
                    } else {
                        hi = s;
                    }
                }
                uv = directUV + offset * (0.5 * lo);
            }
        #endif
        var sunColor: vec3<f32>;
        let L = sunLight(&sunColor);

        let transmitted = textureSampleLevel(sceneColorPyramid, sceneColorPyramidSampler, uv, 0.0).rgb;
        let transmittance = exp(-materialUniform.density * travel * (vec3<f32>(1.0) - materialUniform.absorptionColor.rgb));
        // What the water absorbs is replaced by its own color scattered toward the eye: brighter
        // where the surface takes in more sunlight than flat water would, and in the thin crests.
        let facing = clamp((dot(N, L) - L.y) * 2.5, -1.0, 1.0);
        let crest = clamp((worldPos.y - materialUniform.surface.y) / max(waveAmplitude() + materialUniform.fftPatch.w, 1e-3), -1.0, 1.0);
        let scatter = materialUniform.underwaterColor.rgb
            * (1.0 + WATER_SCATTER_FACING * facing) * (1.0 + WATER_SCATTER_CREST * crest);
        let refraction = transmitted * transmittance + scatter * (vec3<f32>(1.0) - transmittance);

        // A ray reflected below the horizon would meet the next wave, not the dark lower sky;
        // turned back up it finds sky about as bright as that wave's face.
        let R0 = reflect(-V, N);
        let R = vec3<f32>(R0.x, abs(R0.y), R0.z);
        // Blurred by the roughness finer than the ripples, plus the ripples a pixel averages
        // where they fade, so distant reflections soften instead of breaking into patches.
        let maxLod = f32(textureNumLevels(prefilterMap));
        let roughness = clamp(materialUniform.look.y + (1.0 - resolved) * materialUniform.surface.w * 0.4 + fftRoughness, 0.0, 1.0);
        let reflection = textureSampleLevel(prefilterMap, prefilterMapSampler, R, roughness * maxLod).rgb
            * globalUniform.skyExposure * materialUniform.reflectionIntensity;
        let cosV = clamp(dot(N, V), 0.0, 1.0);
        let fresnel = min(WATER_F0 + (1.0 - WATER_F0) * pow(1.0 - cosV, 5.0), materialUniform.fresnelClamp);

        let H = normalize(L + V);
        // Weighted by the water's reflectance toward the sun, a few percent unless grazing.
        let sunFresnel = WATER_F0 + (1.0 - WATER_F0) * pow(1.0 - clamp(dot(H, V), 0.0, 1.0), 5.0);
        let specular = pow(max(dot(N, H), 0.0), materialUniform.specularPower)
            * sunColor * materialUniform.specularIntensity * sunFresnel * step(0.0, dot(N, L));

        // Sunlight through the thin crests toward the eye when looking toward the sun, tinted by
        // the water; only waves of some height let it through.
        let toward = pow(clamp(dot(-V, L), 0.0, 1.0), 3.0);
        let thin = max(crest, 0.0) * clamp((waveAmplitude() + materialUniform.fftPatch.w) / WATER_SSS_HEIGHT, 0.0, 1.0);
        let subsurface = sunColor * materialUniform.absorptionColor.rgb * toward * thin * materialUniform.look.z * WATER_SSS;

        var color = mix(refraction + subsurface, reflection, fresnel) + specular;

        // Whitecaps where the waves pinch the surface, in patches that grow as it pinches harder.
        var pinch = smoothstep(WATER_FOAM_START, WATER_FOAM_FULL, ORI_VertexVarying.fragUV1.x);
        #if USE_FFT
            pinch = max(pinch, fftFoamAt(ORI_VertexVarying.fragUV0));
        #endif
        #if USE_FOAM_TEXTURE
        if (pinch > 0.0 && materialUniform.look.x > 0.0) {
            let coverage = clamp(pinch * materialUniform.look.x, 0.0, 1.0);
            let drift = vec2<f32>(0.04, 0.03) * materialUniform.waveTime;
            let lod = log2(max(footprint * WATER_FOAM_TEXELS / WATER_FOAM_TILE, 1.0));
            let turned = vec2<f32>(0.8 * worldPos.x - 0.6 * worldPos.z, 0.6 * worldPos.x + 0.8 * worldPos.z);
            let sky = textureSampleLevel(prefilterMap, prefilterMapSampler, vec3<f32>(0.0, 1.0, 0.0), maxLod).rgb
                * globalUniform.skyExposure;
            let lit = sky + sunColor * (0.3 + 0.7 * max(dot(N, L), 0.0)) * 0.35;
            // Bubbles a little under the surface, along the view into the water: blurred, tinted.
            let under = worldPos.xz + refr.xz / max(-refr.y, 0.3) * WATER_FOAM_BUBBLE_DEPTH;
            let bubbles = textureSampleLevel(foamTexture, foamTextureSampler, under / WATER_FOAM_TILE + drift, lod + 2.0).r;
            let below = smoothstep(1.0 - coverage, 1.4 - coverage, bubbles);
            color = mix(color, lit * mix(materialUniform.absorptionColor.rgb, vec3<f32>(1.0), 0.5), below * 0.5);
            // The foam on the surface: two scales of the texture, the larger one turned.
            let fine = textureSampleLevel(foamTexture, foamTextureSampler, worldPos.xz / WATER_FOAM_TILE + drift, lod).r;
            let coarse = textureSampleLevel(foamTexture, foamTextureSampler, turned / WATER_FOAM_TILE_LARGE - drift,
                lod - log2(WATER_FOAM_TILE_LARGE / WATER_FOAM_TILE)).r;
            let surfaceFoam = smoothstep(1.0 - coverage, 1.25 - coverage, 0.6 * fine + 0.6 * coarse);
            color = mix(color, lit * 0.85, surfaceFoam);
        }
        #else
        if (pinch > 0.0 && materialUniform.look.x > 0.0) {
            let drift = vec2<f32>(0.3, 0.2) * materialUniform.waveTime;
            let n = 0.6 * waterNoise(worldPos.xz * 0.9 + drift) + 0.4 * waterNoise(worldPos.xz * 3.1 - drift);
            let foam = smoothstep(0.5, 0.65, 0.5 * n + 0.6 * pinch) * materialUniform.look.x;
            let sky = textureSampleLevel(prefilterMap, prefilterMapSampler, vec3<f32>(0.0, 1.0, 0.0), maxLod).rgb
                * globalUniform.skyExposure;
            let foamColor = vec3<f32>(0.9) * (sky + sunColor * max(dot(N, L), 0.0) * 0.3);
            color = mix(color, foamColor, clamp(foam, 0.0, 1.0));
        }
        #endif
        ORI_ShadingInput.BaseColor = vec4<f32>(color, 1.0);
        UnLit();
    }
`;
