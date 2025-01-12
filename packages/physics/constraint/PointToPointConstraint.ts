import { Ammo } from '../Physics';
import { TempPhyMath } from '../utils/TempPhyMath';
import { ConstraintBase } from './ConstraintBase';

/**
 * 点到点约束
 */
export class PointToPointConstraint extends ConstraintBase<Ammo.btPoint2PointConstraint> {
    protected createConstraint(selfBody: Ammo.btRigidBody, targetBody: Ammo.btRigidBody | null) {
        const pivotInA = TempPhyMath.toBtVec(this.pivotSelf);

        if (targetBody) {
            const pivotInB = TempPhyMath.toBtVec(this.pivotTarget, TempPhyMath.tmpVecB);
            this._constraint = new Ammo.btPoint2PointConstraint(selfBody, targetBody, pivotInA, pivotInB);
        } else {
            this._constraint = new Ammo.btPoint2PointConstraint(selfBody, pivotInA);
        }
        
    }
}
