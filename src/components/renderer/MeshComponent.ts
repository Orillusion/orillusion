import { Object3D } from '../../core/entities/Object3D';
import { GeometryBase } from '../../core/geometry/GeometryBase';
import { ComponentBase } from '../ComponentBase';
import { MaterialComponent } from './MaterialComponent';
import { RenderNode } from './RenderNode';
/**
 * Mesh component
 * @group Components
 */
export class MeshComponent extends ComponentBase {
    private _geometry: GeometryBase;
    public get geometry(): GeometryBase {
        return this._geometry;
    }
    public set geometry(value: GeometryBase) {
        this._geometry = value;
        this._checkRenderer();
    }

    protected _checkRenderer() {
        let mr = this.object3D.getComponent(MaterialComponent);
        if (mr && this._geometry && mr.materials.length > 0) {
            this.checkRenderer();
        }
    }

    protected checkRenderer() {
        let render = this.object3D.addComponent(RenderNode);
        // render.initRender();
    }

    constructor() {
        super();
    }

    public init() { }

    public cloneTo(obj: Object3D) {
        let mc = obj.addComponent(MeshComponent);
        mc._geometry = this._geometry;
    }

    // public get mesh(): BufferMesh {
    //   return this._mesh;
    // }
    // public set mesh(value: BufferMesh) {
    //   this._mesh = value;
    // }
}
