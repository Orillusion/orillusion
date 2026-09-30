import { Material } from '../../materials/Material';
import { RegisterComponent } from '../../util/SerializeDecoration';
import { ComponentBase } from '../ComponentBase';

/**
 * One renderer's participation in the variant set: the material it was
 * authored with, and the material to use for each variant index that maps it.
 */
export interface MaterialVariantBinding {
    /** A `MeshRenderer` / `SkinnedMeshRenderer2` — anything with a `material` property. */
    renderer: { material: Material };
    /** Material used when no variant (or a variant that does not mention this primitive) is active. */
    original: Material;
    /** Variant index → material. */
    byVariant: Map<number, Material>;
}

/**
 * Runtime switch for glTF `KHR_materials_variants` (product configurators:
 * one mesh, several material sets — "red leather", "blue fabric", …).
 * The glTF loader adds this component to the root object of any asset that
 * declares variants.
 *
 * ```ts
 * const root = await engine.res.loadGltf('shoe.glb');
 * const variants = root.getComponent(MaterialVariants);
 * console.log(variants.variantNames);      // ['midnight', 'beach', 'street']
 * variants.selectVariant('beach');
 * variants.selectVariant(null);            // back to the authored default
 * ```
 * @group Components
 */
@RegisterComponent(MaterialVariants, 'MaterialVariants')
export class MaterialVariants extends ComponentBase {
    /** Variant names, in the order the asset declares them. */
    public variantNames: string[] = [];

    private _bindings: MaterialVariantBinding[] = [];
    private _current: number = -1;

    /** Index of the active variant, or -1 for the authored default materials. */
    public get currentIndex(): number {
        return this._current;
    }

    /** Name of the active variant, or null for the authored default materials. */
    public get currentVariant(): string | null {
        return this._current >= 0 ? this.variantNames[this._current] : null;
    }

    /** Renderers that take part in at least one variant. */
    public get bindings(): ReadonlyArray<MaterialVariantBinding> {
        return this._bindings;
    }

    /** @internal Used by the loader. */
    public addBinding(binding: MaterialVariantBinding): void {
        this._bindings.push(binding);
    }

    /**
     * Activate a variant by name or index; `null` / `-1` restores the
     * authored materials. Primitives the variant does not mention fall back
     * to their default material, as the extension specifies.
     * @returns false when the name / index does not exist (nothing changes).
     */
    public selectVariant(variant: string | number | null): boolean {
        let index: number;
        if (variant === null || variant === -1) index = -1;
        else if (typeof variant === 'number') index = variant;
        else index = this.variantNames.indexOf(variant);
        if (index < -1 || index >= this.variantNames.length || (typeof variant === 'string' && index < 0)) return false;

        for (const b of this._bindings) {
            const m = (index >= 0 && b.byVariant.get(index)) || b.original;
            if (b.renderer.material !== m) b.renderer.material = m;
        }
        this._current = index;
        return true;
    }

    public destroy(force?: boolean): void {
        this._bindings.length = 0;
        super.destroy(force);
    }
}
