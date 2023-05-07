//https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_emissive_strength

import { Engine3D } from "../../../../Engine3D";

export class KHR_materials_emissive_strength {
    public static apply(gltf: any, dmaterial: any, tMaterial: any) {
        let extensions = dmaterial.extensions;
        if (extensions && extensions[`KHR_materials_emissive_strength`]) {
            tMaterial.emissiveIntensity = extensions[`KHR_materials_emissive_strength`].emissiveStrength * 0.5;
            if (tMaterial.emissiveMap == Engine3D.res.blackTexture) {
                tMaterial.emissiveMap = Engine3D.res.whiteTexture;
            }
        } else {
            tMaterial.emissiveIntensity = 1;
        }
    }
}
