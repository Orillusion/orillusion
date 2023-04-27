import { Object3D } from '../../core/entities/Object3D';
import { MaterialBase } from '../../materials/MaterialBase';
import { ComponentBase } from '../ComponentBase';
import { MeshComponent } from './MeshComponent';
import { RenderNode } from './RenderNode';
/**
 * Material component
 * @group Components
 */
export class MaterialComponent extends ComponentBase {
    private _materials: MaterialBase[];
    constructor() {
        super();
        this.materials = [];
    }

    public get materials(): MaterialBase[] {
        return this._materials;
    }

    public set materials(value: MaterialBase[]) {
        this._materials = value;
    }

    public get material(): MaterialBase {
        return this._materials[0];
    }

    public set material(value: MaterialBase) {
        this._materials[0] = value;

        let mc = this.object3D.getComponent(MeshComponent);
        if (mc && value && mc.geometry) {
            let render = this.object3D.addComponent(RenderNode);
            // render.initRender();
        }
    }

    public cloneTo(obj: Object3D) {
        let mc = obj.addComponent(MaterialComponent);
        mc.materials.push(...this.materials);
    }
}
