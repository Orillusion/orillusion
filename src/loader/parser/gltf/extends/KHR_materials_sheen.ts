// https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_sheen

import { LitMaterial } from '../../../../materials/LitMaterial';
import { Color } from '../../../../math/Color';

/**
 * @internal
 * @group Loader
 */
export class KHR_materials_sheen {
    /**
     * Applies `sheenColorFactor` / `sheenRoughnessFactor`. The texture
     * variants (`sheenColorTexture`, `sheenRoughnessTexture`) are not
     * sampled yet — the factors alone are used.
     */
    public static apply(gltf: any, dmaterial: any, tMaterial: any) {
        const ext = dmaterial.extensions?.[`KHR_materials_sheen`];
        if (!ext) return;
        const mat = tMaterial as LitMaterial;
        const c = ext.sheenColorFactor ?? [0, 0, 0];
        dmaterial.sheenColorFactor = c;
        dmaterial.sheenRoughnessFactor = ext.sheenRoughnessFactor ?? 0;
        mat.sheenRoughness = dmaterial.sheenRoughnessFactor;
        mat.sheenColor = new Color(c[0], c[1], c[2], 1);
    }
}
