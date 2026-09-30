// https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_sheen

import { LitMaterial } from '../../../../materials/LitMaterial';
import { Color } from '../../../../math/Color';

/**
 * @internal
 * @group Loader
 */
export class KHR_materials_sheen {
    /**
     * Applies `sheenColorFactor` / `sheenRoughnessFactor` and binds the
     * `sheenColorTexture` / `sheenRoughnessTexture` resolved by the async
     * material parser. A texture without a factor uses the spec defaults
     * (colour 1, roughness 1) so the texture alone drives the lobe.
     */
    public static apply(gltf: any, dmaterial: any, tMaterial: any) {
        const ext = dmaterial.extensions?.[`KHR_materials_sheen`];
        if (!ext) return;
        const mat = tMaterial as LitMaterial;
        const hasColorTex = !!dmaterial.sheenColorTextureResolved;
        const c = ext.sheenColorFactor ?? (hasColorTex ? [1, 1, 1] : [0, 0, 0]);
        dmaterial.sheenColorFactor = c;
        dmaterial.sheenRoughnessFactor = ext.sheenRoughnessFactor ?? (dmaterial.sheenRoughnessTextureResolved ? 1 : 0);
        mat.sheenRoughness = dmaterial.sheenRoughnessFactor;
        mat.sheenColor = new Color(c[0], c[1], c[2], 1);
        if (dmaterial.sheenColorTextureResolved) mat.sheenColorMap = dmaterial.sheenColorTextureResolved;
        if (dmaterial.sheenRoughnessTextureResolved) mat.sheenRoughnessMap = dmaterial.sheenRoughnessTextureResolved;
    }
}
