/**
 * KHR_materials_sheen — a cloth-like retro-reflective lobe layered over the
 * base BRDF. Charlie distribution + Neubelt visibility for punctual lights,
 * an analytic DG fit for the environment term, and the same energy
 * compensation three.js / the Khronos sample viewer use (base layer scaled by
 * `1 - 0.157·max(sheenColor)`).
 *
 * `materialUniform.sheenColor.rgb` = sheen tint (linear), `.a` = sheen roughness.
 * @internal
 */
export let Sheen_frag: string = /*wgsl*/ `
  #if USE_SHEEN
    // Estevez & Kulla "Production Friendly Microfacet Sheen BRDF".
    fn sheenD_Charlie(roughness: f32, NoH: f32) -> f32 {
        let alpha = max(roughness * roughness, 0.0049);
        let invAlpha = 1.0 / alpha;
        let cos2h = NoH * NoH;
        let sin2h = max(1.0 - cos2h, 0.0078125);
        return (2.0 + invAlpha) * pow(sin2h, invAlpha * 0.5) / (2.0 * 3.14159265);
    }

    // Neubelt & Pettineo visibility term.
    fn sheenV_Neubelt(NoV: f32, NoL: f32) -> f32 {
        return clamp(1.0 / (4.0 * (NoL + NoV - NoL * NoV)), 0.0, 1.0);
    }

    fn sheenBRDF(L: vec3<f32>) -> f32 {
        let N = fragData.N;
        let V = fragData.V;
        let H = normalize(L + V);
        let NoL = clamp(dot(N, L), 0.0, 1.0);
        let NoV = clamp(dot(N, V), 0.0001, 1.0);
        let NoH = clamp(dot(N, H), 0.0, 1.0);
        return sheenD_Charlie(materialUniform.sheenColor.a, NoH) * sheenV_Neubelt(NoV, NoL) * NoL;
    }

    // Analytic fit of the directional albedo of the sheen lobe
    // (https://drive.google.com/file/d/1T0D1VSyR4AllqIJTQAraEIzjlb5h4FKH/view).
    fn sheenIBL_DG(NoV: f32, roughness: f32) -> f32 {
        let r2 = roughness * roughness;
        var a = -8.48 * r2 + 14.3 * roughness - 9.95;
        var b = 1.97 * r2 - 3.27 * roughness + 0.72;
        var extra = 0.1 * (roughness - 0.25);
        if (roughness < 0.25) {
            a = -339.2 * r2 + 161.4 * roughness - 25.9;
            b = 44.0 * r2 - 23.7 * roughness + 3.26;
            extra = 0.0;
        }
        let DG = exp(a * NoV + b) + extra;
        return clamp(DG / 3.14159265, 0.0, 1.0);
    }

    fn sheenSpotAtt(WP: vec3<f32>, light: LightData) -> f32 {
        var dir = light.position.xyz - WP;
        let dist = length(dir);
        if (dist != 0.0) { dir *= 1.0 / dist; }
        var atten = 0.0;
        if (abs(dist) < light.range * 2.0) {
            let angle = acos(dot(-dir, normalize(light.direction)));
            atten = 1.0 - smoothstep(0.0, light.range, dist);
            atten *= 1.0 / max(light.radius, 0.001);
            if (angle < light.outerCutOff) {
                if (angle > light.innerCutOff) {
                    atten *= 1.0 - smoothstep(light.innerCutOff, light.outerCutOff, angle);
                }
            } else {
                atten = 0.0;
            }
            atten *= sphere_unit(light.range, light.intensity);
        }
        return atten;
    }

    /// Layer sheen over an already-lit base color.
    fn applySheen(base: vec3<f32>, start: f32, end: f32) -> vec3<f32> {
        let sheenColor = materialUniform.sheenColor.rgb;
        let WP = ORI_VertexVarying.vWorldPos.xyz;
        var sheen = vec3<f32>(0.0);
        for (var i: i32 = i32(start); i < i32(end); i += 1) {
            let light = getLight(i32(i));
            let lightColor = getHDRColor(light.lightColor.rgb, light.linear);
            switch (light.lightType) {
                case DirectLightType: {
                    let L = normalize(-light.direction.xyz);
                    let shadow = directShadowVisibility[(light.castShadow)];
                    sheen += sheenBRDF(L) * lightColor * max(0.0, light.intensity) * shadow;
                    break;
                }
                case PointLightType: {
                    let L = normalize(light.position.xyz - WP);
                    let shadow = pointShadows[i32(light.castShadow)];
                    sheen += sheenBRDF(L) * lightColor * pointAtt(WP, light) * shadow;
                    break;
                }
                case SpotLightType: {
                    let L = normalize(light.position.xyz - WP);
                    let shadow = pointShadows[i32(light.castShadow)];
                    sheen += sheenBRDF(L) * lightColor * sheenSpotAtt(WP, light) * shadow;
                    break;
                }
                default: {
                    break;
                }
            }
        }
        // Environment: diffuse irradiance × directional albedo of the lobe.
        sheen += fragData.Irradiance * sheenIBL_DG(fragData.NoV, materialUniform.sheenColor.a) * fragData.Ao;

        let energyComp = 1.0 - 0.157 * max(sheenColor.r, max(sheenColor.g, sheenColor.b));
        return base * energyComp + sheenColor * sheen;
    }
  #endif
`;
