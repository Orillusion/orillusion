// https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_anisotropy

import { LitMaterial } from '../../../../materials/LitMaterial';

/**
 * @internal
 * @group Loader
 */
export class KHR_materials_anisotropy {
    /**
     * Applies `anisotropyStrength` and `anisotropyRotation` and binds the
     * `anisotropyTexture` (rg direction, b strength) when present. A texture
     * without a strength factor uses strength 1 so the texture drives it.
     */
    public static apply(gltf: any, dmaterial: any, tMaterial: any) {
        const ext = dmaterial.extensions?.[`KHR_materials_anisotropy`];
        if (!ext) return;
        const mat = tMaterial as LitMaterial;
        dmaterial.anisotropyStrength = typeof ext.anisotropyStrength === 'number' ? ext.anisotropyStrength : (dmaterial.anisotropyTextureResolved ? 1 : 0);
        dmaterial.anisotropyRotation = typeof ext.anisotropyRotation === 'number' ? ext.anisotropyRotation : 0;
        mat.anisotropyRotation = dmaterial.anisotropyRotation;
        mat.anisotropy = dmaterial.anisotropyStrength;
        if (dmaterial.anisotropyTextureResolved) mat.anisotropyMap = dmaterial.anisotropyTextureResolved;
    }
}
