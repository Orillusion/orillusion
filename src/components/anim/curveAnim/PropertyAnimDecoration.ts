import { MeshRenderer } from "../../../components/renderer/MeshRenderer";
import { Object3D } from "../../../core/entities/Object3D";
import { Color } from "../../../math/Color";
import { Ctor } from "../../../util/Global";

export interface IObject3DForPropertyAnim {
    materialColor: Color;
    notifyMaterialColorChange(materialIndex: number, key: string);
    active: number;
}

export function DecorateObject3D(ctor: Ctor<Object3D>, a) {
    return class extends ctor implements IObject3DForPropertyAnim {

        set active(value) {
            this.transform.enable = value > 0;
        }

        get active(): number {
            return this.transform.enable ? 1 : 0;
        }

        public get materialColor(): Color {
            let component = this.getComponent(MeshRenderer);
            return component?.material?.getBaseColor();
        }

        public set materialColor(color: Color) {
            let material = this.getComponent(MeshRenderer)?.material;
            material && (material.baseColor = color);
        }

        public notifyMaterialColorChange(materialIndex: number, key: string) {
            let materials = this.getComponent(MeshRenderer).materials;
            materials?.[materialIndex]?.renderShader.uniforms[key].onChange();
        }
    };
}