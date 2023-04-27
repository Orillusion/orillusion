//https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_unlit

/**
 * @internal
 * @group Loader
 */
export class KHR_materials_unlit {
    public static apply(gltf: any, dmaterial: any, tMaterial: any) {
        let extensions = dmaterial.extensions;
        if (extensions && extensions[`KHR_materials_unlit`]) {
            tMaterial.supportLight = true;
        } else {
            tMaterial.supportLight = false;
        }
    }
}
