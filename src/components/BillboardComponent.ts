import { Camera3D } from '../core/Camera3D';
import { Object3D } from '../core/entities/Object3D';
import { Vector3 } from '../math/Vector3';
import { ComponentBase } from './ComponentBase';

/**
 * Billboard orientation mode controlling which axes face the camera.
 * @group Components
 */
export enum BillboardType {
    /** No billboard behavior — the object keeps its own transform rotation. */
    None = 0,
    /** Rotate only around the Y axis to face the camera (e.g. trees, characters). */
    BillboardY = 9,
    /** Rotate freely on all axes to fully face the camera (e.g. particles, sprites). */
    BillboardXYZ = 10,
}

/**
 * Makes an object always face the active camera. Useful for sprites,
 * impostors and labels that should stay oriented toward the viewer.
 * @group Components
 */
export class BillboardComponent extends ComponentBase {
    /** Billboard orientation mode. */
    public type: BillboardType;
    /** Camera reference used to derive the facing direction. */
    public camera: Camera3D;
    private _cameraPosition: Vector3;

    constructor() {
        super();
        this._cameraPosition = new Vector3();
    }

    /**
     * Per-frame update: reorients the object to face the active camera.
     */
    public onUpdate() {
        if (this.enable && this.transform.view3D.camera) {
            this.updateBillboardMatrix();
        }
    }

    private updateBillboardMatrix(): void {
        // `None` means the object keeps whatever rotation its transform
        // already has — no face-camera logic. Without this early return the
        // method still runs `lookAt` and behaves identically to XYZ, which
        // makes the enum member name misleading.
        if (this.type == BillboardType.None) return;

        let camera = this.transform.view3D.camera;
        this._cameraPosition.copy(camera.transform.back);
        if (this.type == BillboardType.BillboardXYZ) {
        } else if (this.type == BillboardType.BillboardY) {
            this._cameraPosition.y = 0;

            // A cylindrical billboard has no defined yaw when the camera is
            // looking straight up or down. Normalizing that near-zero XZ
            // projection amplifies floating-point noise and makes the sprite
            // swing between opposite directions as the camera rotates.
            // Keep the last valid orientation until a horizontal camera
            // direction is available again.
            const horizontalLengthSquared =
                this._cameraPosition.x * this._cameraPosition.x +
                this._cameraPosition.z * this._cameraPosition.z;
            if (horizontalLengthSquared <= Vector3.EPSILON * Vector3.EPSILON) return;
        }
        this._cameraPosition.normalize();
        Vector3.add(this._cameraPosition, this.object3D.localPosition, this._cameraPosition);
        // BillboardY must stay locked to the world Y axis. Using the camera's
        // up vector introduces roll and becomes unstable at a vertical view.
        const up = this.type == BillboardType.BillboardY ? Vector3.Y_AXIS : camera.transform.up;
        this.transform.lookAt(this.object3D.localPosition, this._cameraPosition, up);
    }

    /**
     * Clone this component's settings onto another object.
     * @param obj target object to attach a copy to
     */
    public cloneTo(obj: Object3D) {
        let component = obj.addComponent(BillboardComponent);
        component.type = this.type;
    }
}
