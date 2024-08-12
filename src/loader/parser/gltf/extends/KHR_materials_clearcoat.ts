// https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_clearcoat

import { LitMaterial } from '../../../../materials/LitMaterial';
import { Material } from '../../../../materials/Material';

/**
 * @internal
 * @group Loader
 */
export class KHR_materials_clearcoat {
    public static apply(gltf: any, dmaterial: any, tMaterial: any) {
        let extensions = dmaterial.extensions;
        if (extensions && extensions[`KHR_materials_clearcoat`]) {
            (tMaterial as Material).shader.getDefaultColorShader().setDefine('USE_CLEARCOAT', true);

            let KHR_materials_clearcoat = extensions[`KHR_materials_clearcoat`];
            if (`clearcoatFactor` in KHR_materials_clearcoat) {
                dmaterial.clearcoatFactor = KHR_materials_clearcoat[`clearcoatFactor`];
                (tMaterial as LitMaterial).clearcoatFactor = dmaterial.clearcoatFactor;
            }

            if (`clearcoatRoughnessFactor` in KHR_materials_clearcoat) {
                dmaterial.clearcoatRoughnessFactor = KHR_materials_clearcoat[`clearcoatRoughnessFactor`];
                (tMaterial as LitMaterial).clearcoatRoughnessFactor = dmaterial.clearcoatRoughnessFactor;
            }
        }
    }
}
