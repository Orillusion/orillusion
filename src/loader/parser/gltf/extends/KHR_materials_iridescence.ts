// https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_iridescence

import { LitMaterial } from '../../../../materials/LitMaterial';

/**
 * @internal
 * @group Loader
 */
export class KHR_materials_iridescence {
    /**
     * Applies `iridescenceFactor`, `iridescenceIor` and the film thickness.
     * Without a thickness texture the spec says the maximum applies, so
     * `iridescenceThicknessMaximum` (default 400 nm) is used. The texture
     * variants are not sampled yet.
     */
    public static apply(gltf: any, dmaterial: any, tMaterial: any) {
        const ext = dmaterial.extensions?.[`KHR_materials_iridescence`];
        if (!ext) return;
        const mat = tMaterial as LitMaterial;
        dmaterial.iridescenceFactor = typeof ext.iridescenceFactor === 'number' ? ext.iridescenceFactor : 0;
        dmaterial.iridescenceIor = typeof ext.iridescenceIor === 'number' ? ext.iridescenceIor : 1.3;
        dmaterial.iridescenceThickness = typeof ext.iridescenceThicknessMaximum === 'number' ? ext.iridescenceThicknessMaximum : 400;
        mat.iridescenceIOR = dmaterial.iridescenceIor;
        mat.iridescenceThickness = dmaterial.iridescenceThickness;
        mat.iridescence = dmaterial.iridescenceFactor;
    }
}
