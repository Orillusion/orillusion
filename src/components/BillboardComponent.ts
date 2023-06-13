import { Camera3D } from '../core/Camera3D';
import { Object3D } from '../core/entities/Object3D';
import { Vector3 } from '../math/Vector3';
import { ComponentBase } from './ComponentBase';
import { BillboardType } from './gui/GUIConfig';

export class BillboardComponent extends ComponentBase {
    public type: BillboardType;
    public camera: Camera3D;
    private _cameraPosition: Vector3;

    constructor() {
        super();
        this._cameraPosition = new Vector3();
    }

    public onUpdate() {
        if (this.enable && this.transform.view3D.camera) {
            this.updateBillboardMatrix();
        }
    }

    private updateBillboardMatrix(): void {
        let camera = this.transform.view3D.camera;
        this._cameraPosition.copyFrom(camera.transform.back);
        if (this.type == BillboardType.BillboardXYZ) {
        } else if (this.type == BillboardType.BillboardY) {
            this._cameraPosition.y = 0;
        }
        this._cameraPosition.normalize();
        this._cameraPosition.add(this.object3D.localPosition, this._cameraPosition);
        this.transform.lookAt(this.object3D.localPosition, this._cameraPosition, camera.transform.up);
    }

    public cloneTo(obj: Object3D) {
        let component = obj.addComponent(BillboardComponent);
        component.type = this.type;
    }
}
