import { Vector3 } from '@orillusion/core';
import { Ammo, Physics } from '../Physics';
import { TempPhyMath } from '../utils/TempPhyMath';
import { ConstraintBase } from './ConstraintBase';

/**
 * 通用六自由度约束
 */
export class Generic6DofConstraint extends ConstraintBase<Ammo.btGeneric6DofConstraint> {
    private _linearLowerLimit: Vector3 = new Vector3(-1e30, -1e30, -1e30);
    private _linearUpperLimit: Vector3 = new Vector3(1e30, 1e30, 1e30);
    private _angularLowerLimit: Vector3 = new Vector3(-Math.PI, -Math.PI, -Math.PI);
    private _angularUpperLimit: Vector3 = new Vector3(Math.PI, Math.PI, Math.PI);

    /**
     * default: `-1e30, -1e30, -1e30`
     */
    public get linearLowerLimit(): Vector3 {
        return this._linearLowerLimit;
    }
    public set linearLowerLimit(value: Vector3) {
        this._linearLowerLimit.copyFrom(value);
        this._constraint?.setLinearLowerLimit(TempPhyMath.toBtVec(value));
    }

    /**
     * default: `1e30, 1e30, 1e30`
     */
    public get linearUpperLimit(): Vector3 {
        return this._linearUpperLimit;
    }
    public set linearUpperLimit(value: Vector3) {
        this._linearUpperLimit.copyFrom(value);
        this._constraint?.setLinearUpperLimit(TempPhyMath.toBtVec(value));
    }

    /**
     * default: `-Math.PI, -Math.PI, -Math.PI`
     */
    public get angularLowerLimit(): Vector3 {
        return this._angularLowerLimit;
    }
    public set angularLowerLimit(value: Vector3) {
        this._angularLowerLimit.copyFrom(value);
        this._constraint?.setAngularLowerLimit(TempPhyMath.toBtVec(value));
    }

    /**
     * default: `Math.PI, Math.PI, Math.PI`
     */
    public get angularUpperLimit(): Vector3 {
        return this._angularUpperLimit;
    }
    public set angularUpperLimit(value: Vector3) {
        this._angularUpperLimit.copyFrom(value);
        this._constraint?.setAngularUpperLimit(TempPhyMath.toBtVec(value));
    }

    /**
     * 是否使用线性参考坐标系。
     * 默认值: `true`
     */
    public useLinearFrameReferenceFrame: boolean = true;

    protected createConstraint(selfBody: Ammo.btRigidBody, targetBody: Ammo.btRigidBody | null): void {
        const pivotInA = TempPhyMath.toBtVec(this.pivotSelf);
        const rotInA = TempPhyMath.toBtQua(this.rotationSelf);

        const frameInA = Physics.TEMP_TRANSFORM;
        frameInA.setIdentity();
        frameInA.setOrigin(pivotInA);
        frameInA.setRotation(rotInA);

        if (targetBody) {
            const pivotInB = TempPhyMath.toBtVec(this.pivotTarget, TempPhyMath.tmpVecB);
            const rotInB = TempPhyMath.toBtQua(this.rotationTarget, TempPhyMath.tmpQuaB);
            const frameInB = new Ammo.btTransform();
            frameInB.setIdentity();
            frameInB.setOrigin(pivotInB);
            frameInB.setRotation(rotInB);

            this._constraint = new Ammo.btGeneric6DofConstraint(selfBody, targetBody, frameInA, frameInB, this.useLinearFrameReferenceFrame);
            Ammo.destroy(frameInB);
        } else {
            this._constraint = new Ammo.btGeneric6DofConstraint(selfBody, frameInA, this.useLinearFrameReferenceFrame);
        }

        this._constraint.setLinearLowerLimit(TempPhyMath.toBtVec(this._linearLowerLimit));
        this._constraint.setLinearUpperLimit(TempPhyMath.toBtVec(this._linearUpperLimit));
        this._constraint.setAngularLowerLimit(TempPhyMath.toBtVec(this._angularLowerLimit));
        this._constraint.setAngularUpperLimit(TempPhyMath.toBtVec(this._angularUpperLimit));
    }
}
