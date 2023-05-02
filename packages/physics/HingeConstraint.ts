import Ammo from '@orillusion/ammo';
import { ComponentBase, Vector3 } from '@orillusion/core'
import { Physics } from './Physics';
import { Rigidbody } from './Rigidbody';
/**
 * @internal
 * @group Plugin
 */
export class HingeConstraint extends ComponentBase {
    private _targetRigidbody: Rigidbody;
    public pivotSelf: Vector3 = new Vector3();
    public pivotTarget: Vector3 = new Vector3();
    public axisSelf: Vector3 = new Vector3(0, 1, 0);
    public axisTarget: Vector3 = new Vector3(0, 1, 0);
    private _hinge: Ammo.btHingeConstraint;

    start(): void {
        var selfRb = this.object3D.getComponent(Rigidbody);
        if (selfRb == null) {
            console.error('HingeConstraint need rigidbody');
            return;
        }

        if (this._targetRigidbody == null) {
            console.error('HingeConstraint need target rigidbody');
            return;
        }

        let canStart = true;
        if (!selfRb.btRigidbodyInited) {
            selfRb.addInitedFunction(this.start, this);
            canStart = false;
        }
        if (!this._targetRigidbody.btRigidbodyInited) {
            this._targetRigidbody.addInitedFunction(this.start, this);
            canStart = false;
        }

        // console.log("hinge true start init");

        let axisSelf = new Ammo.btVector3(this.axisSelf.x, this.axisSelf.y, this.axisSelf.z);
        let axisTarget = new Ammo.btVector3(this.axisTarget.x, this.axisTarget.y, this.axisTarget.z);

        if (!canStart) {
            return;
        }
        let pa = new Ammo.btVector3(this.pivotSelf.x, this.pivotSelf.y, this.pivotSelf.z);
        let pb = new Ammo.btVector3(this.pivotTarget.x, this.pivotTarget.y, this.pivotTarget.z);
        let hinge = new Ammo.btHingeConstraint(selfRb.btRigidbody, this._targetRigidbody.btRigidbody, pa, pb, axisSelf, axisTarget, true);
        this._hinge = hinge;
        Physics.world.addConstraint(hinge, true);
    }

    public get hinge(): Ammo.btHingeConstraint {
        return this._hinge;
    }

    public get targetRigidbody(): Rigidbody {
        return this._targetRigidbody;
    }

    public set targetRigidbody(value: Rigidbody) {
        this._targetRigidbody = value;
    }

    public destroy(): void {
        super.destroy();
    }
}
