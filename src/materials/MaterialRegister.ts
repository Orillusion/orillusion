import { Ctor } from "../util/Global";
import { MaterialBase } from "../materials/MaterialBase";
/**
 *
 * @internal
 * @group Material
 */
export type MaterialClassName =
    'MaterialBase'
    | 'GBufferPass'
    | 'GUIMaterial'
    | 'ChromaKeyMaterial'
    | 'LambertMaterial'
    | 'PhysicMaterial'
    | 'SkyMaterial'
    | 'UnLitMaterial'
    | 'VideoMaterial'
    | 'DepthMaterialPass'
    | 'CastShadowMaterialPass'
    | 'SkyGBufferPass'
    | 'FlameSimulatorMaterial'
    | 'FlowImgSimulatorMaterial'
    | 'FluidSimulatorMaterial'
    | 'FluidSimulatorMaterial2'
    | 'HairSimulatorMaterial'
    | 'LitMaterial'
    | 'BoxMaterial'
    | 'SkeletonMaterial'
    | 'GlassMaterial'
    | 'PavementMaterial'
    | 'PointMaterial'
    | 'none';

// export let materialClassToName: Map<Ctor<MaterialBase>, MaterialClassName> = new Map<Ctor<MaterialBase>, MaterialClassName>();
// export let materialNameToClass: Map<MaterialClassName, Ctor<MaterialBase>> = new Map<MaterialClassName, Ctor<MaterialBase>>();

export function registerMaterial(name: MaterialClassName, cls: Ctor<MaterialBase>): void {
    // materialClassToName.set(cls, name);
    // materialNameToClass.set(name, cls);
}