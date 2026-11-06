// https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_variants

import { MaterialVariants } from '../../../../components/renderer/MaterialVariants';
import { Object3D } from '../../../../core/entities/Object3D';
import { Material } from '../../../../materials/Material';

/**
 * @internal
 * @group Loader
 */
export class KHR_materials_variants {
    /** Variant names declared at the asset root, or [] when the extension is absent. */
    public static variantNames(gltf: any): string[] {
        const list = gltf?.extensions?.[`KHR_materials_variants`]?.variants;
        return Array.isArray(list) ? list.map((v: any, i: number) => v?.name ?? `variant_${i}`) : [];
    }

    /**
     * Mesh-parser step: resolve each mapping's material index into a parsed
     * glTF material and stash the result on the parsed primitive.
     */
    public static async parsePrimitive(primitive: any, dprimitive: any, parseMaterial: (id: number) => Promise<any>): Promise<void> {
        const mappings = primitive.extensions?.[`KHR_materials_variants`]?.mappings;
        if (!Array.isArray(mappings)) return;
        const out: { variants: number[]; material: any }[] = [];
        for (const m of mappings) {
            if (m.material === undefined || !Array.isArray(m.variants)) continue;
            const dmaterial = await parseMaterial(m.material);
            if (dmaterial) out.push({ variants: m.variants, material: dmaterial });
        }
        if (out.length) dprimitive.variantMappings = out;
    }

    /**
     * Converter step: remember which renderer takes which engine material
     * per variant. `skinned` renderers get their own clone (see the
     * USE_SKELETON note in the converter).
     */
    public static bind(gltf: any, dprimitive: any, renderer: { material: Material }, skinned: boolean, toMaterial: (dmaterial: any) => Material): void {
        const mappings = dprimitive?.variantMappings;
        if (!mappings) return;
        const byVariant = new Map<number, Material>();
        for (const m of mappings) {
            let mat = toMaterial(m.material);
            if (skinned) mat = mat.clone();
            for (const v of m.variants) byVariant.set(v, mat);
        }
        (gltf._variantBindings ||= []).push({ renderer, original: renderer.material, byVariant });
    }

    /** Root step: attach a `MaterialVariants` component when the asset uses the extension. */
    public static attach(gltf: any, root: Object3D): void {
        const names = KHR_materials_variants.variantNames(gltf);
        const bindings = gltf._variantBindings;
        if (!names.length && !bindings?.length) return;
        const comp = root.addComponent(MaterialVariants);
        comp.variantNames = names;
        if (bindings) for (const b of bindings) comp.addBinding(b);
        gltf._variantBindings = null;
    }
}
