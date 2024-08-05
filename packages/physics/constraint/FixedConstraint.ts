import { Ammo, Physics } from '../Physics';
import { TempPhyMath } from '../utils/TempPhyMath';
import { ConstraintBase } from './ConstraintBase';

/**
 * 固定约束
 */
export class FixedConstraint extends ConstraintBase<Ammo.btFixedConstraint> {
    protected createConstraint(selfBody: Ammo.btRigidBody, targetBody: Ammo.btRigidBody | null): void {
        if (!targetBody) throw new Error('FixedConstraint requires a target rigidbody');

        const pivotInA = TempPhyMath.toBtVec(this.pivotSelf);
        const rotInA = TempPhyMath.toBtQua(this.rotationSelf);
        const frameInA = Physics.TEMP_TRANSFORM;
        frameInA.setIdentity();
        frameInA.setOrigin(pivotInA);
        frameInA.setRotation(rotInA);

        const pivotInB = TempPhyMath.toBtVec(this.pivotTarget, TempPhyMath.tmpVecB);
        const rotInB = TempPhyMath.toBtQua(this.rotationTarget, TempPhyMath.tmpQuaB);
        const frameInB = new Ammo.btTransform();
        frameInB.setIdentity();
        frameInB.setOrigin(pivotInB);
        frameInB.setRotation(rotInB);

        this._constraint = new Ammo.btFixedConstraint(selfBody, targetBody, frameInA, frameInB);
        Ammo.destroy(frameInB);
    }


}