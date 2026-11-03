// https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_specular

import { Material } from '../../../../materials/Material';
import { Color } from '../../../../math/Color';

/**
 * @internal
 * @group Loader
 */
export class KHR_materials_specular {
    /**
     * `specularColorFactor` tints the dielectric F0 and `specularFactor`
     * scales the specular layer. Both land in the PBR `specularColor`
     * uniform (rgb = F0 modulator, a = specular strength). The texture
     * variants (`specularTexture`, `specularColorTexture`) are not sampled
     * yet — the factors alone are used.
     */
    public static apply(gltf: any, dmaterial: any, tMaterial: any) {
        const ext = dmaterial.extensions?.[`KHR_materials_specular`];
        if (!ext) return;
        const c = Array.isArray(ext.specularColorFactor) ? ext.specularColorFactor : [1, 1, 1];
        const f = typeof ext.specularFactor === 'number' ? ext.specularFactor : 1;
        dmaterial.specularColorFactor = c;
        dmaterial.specularFactor = f;
        (tMaterial as Material).setUniformColor(`specularColor`, new Color(c[0], c[1], c[2], f));
    }
}
