/**
 * KHR_materials_anisotropy — stretched specular highlights (brushed metal,
 * hair-like finishes, vinyl records).
 *
 * The engine's isotropic specular term keeps its own conventions; this chunk
 * supplies the RATIO between the anisotropic GGX lobe and the isotropic one
 * (D and correlated-Smith visibility), which is exactly 1 when the strength
 * is 0, plus the bent reflection vector for the environment term.
 *
 * `materialUniform.anisotropy` = (strength 0..1, rotation in radians, unused, unused).
 * The tangent frame comes from screen-space derivatives of position and UV,
 * so the mesh needs UVs (it falls back to an arbitrary tangent without them).
 * `AnisotropyUtil` mirrors the math on the CPU.
 * @internal
 */
export let Anisotropy_frag: string = /*wgsl*/ `
  #if USE_ANISOTROPY
    var<private> anisoT: vec3<f32>;
    var<private> anisoB: vec3<f32>;

    /// Build the rotated, orthonormal tangent frame. Call once per fragment, outside branches.
    fn initAnisotropy() {
        let N = fragData.N;
        let worldPos = ORI_VertexVarying.vWorldPos.xyz;
        let q0 = dpdx(worldPos);
        let q1 = dpdy(worldPos);
        let st0 = dpdx(ORI_VertexVarying.fragUV0.xy);
        let st1 = dpdy(ORI_VertexVarying.fragUV0.xy);
        let q0perp = cross(N, q0);
        let q1perp = cross(q1, N);
        var T = q1perp * st0.x + q0perp * st1.x;
        // Gram-Schmidt against the shading normal.
        T = T - N * dot(N, T);
        if (dot(T, T) < 1e-12) {
            // No usable UV gradient: any tangent perpendicular to N.
            var up = vec3<f32>(0.0, 1.0, 0.0);
            if (abs(N.y) > 0.99) { up = vec3<f32>(1.0, 0.0, 0.0); }
            T = cross(up, N);
        }
        T = normalize(T);
        let B0 = normalize(cross(N, T));
        let rot = materialUniform.anisotropy.y;
        anisoT = normalize(T * cos(rot) + B0 * sin(rot));
        anisoB = normalize(cross(N, anisoT));
    }

    /// (anisotropic D·V) / (isotropic D·V) for light direction L. 1 when strength is 0.
    fn anisotropySpecularRatio(L: vec3<f32>, roughness: f32) -> f32 {
        let N = fragData.N;
        let V = fragData.V;
        let H = normalize(L + V);
        let NoH = clamp(dot(N, H), 0.0, 1.0);
        let NoL = clamp(dot(N, L), 0.0001, 1.0);
        let NoV = clamp(dot(N, V), 0.0001, 1.0);
        let strength = clamp(materialUniform.anisotropy.x, 0.0, 1.0);
        let a = max(roughness * roughness, 0.002);
        let at = mix(a, 1.0, strength * strength);
        let ab = a;

        let ToH = dot(anisoT, H); let BoH = dot(anisoB, H);
        let ToV = dot(anisoT, V); let BoV = dot(anisoB, V);
        let ToL = dot(anisoT, L); let BoL = dot(anisoB, L);

        // D
        let a2 = a * a;
        let dIsoDen = NoH * NoH * (a2 - 1.0) + 1.0;
        let dIso = a2 / (dIsoDen * dIsoDen);
        let dAniDen = ToH * ToH / (at * at) + BoH * BoH / (ab * ab) + NoH * NoH;
        let dAni = 1.0 / (at * ab * dAniDen * dAniDen);

        // V (height-correlated Smith)
        let vIso = 0.5 / (NoL * sqrt(NoV * NoV * (1.0 - a2) + a2) + NoV * sqrt(NoL * NoL * (1.0 - a2) + a2));
        let vAni = 0.5 / (NoL * length(vec3<f32>(at * ToV, ab * BoV, NoV)) + NoV * length(vec3<f32>(at * ToL, ab * BoL, NoL)));

        return (dAni * vAni) / max(dIso * vIso, 1e-8);
    }

    /// Reflection vector bent toward the grain so environment reflections stretch too.
    fn anisotropyReflection(roughness: f32) -> vec3<f32> {
        let N = fragData.N;
        let V = fragData.V;
        let strength = clamp(materialUniform.anisotropy.x, 0.0, 1.0);
        let bentTangent = cross(anisoB, V);
        var bentNormal = cross(bentTangent, anisoB);
        let k = 1.0 - strength * (1.0 - roughness);
        bentNormal = normalize(mix(bentNormal, N, k * k * k * k));
        return 2.0 * dot(V, bentNormal) * bentNormal - V;
    }
  #endif
`;
