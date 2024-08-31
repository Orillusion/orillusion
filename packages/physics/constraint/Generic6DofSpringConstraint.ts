import { Vector3 } from '@orillusion/core';
import { Ammo, Physics } from '../Physics';
import { TempPhyMath } from '../utils/TempPhyMath';
import { ConstraintBase } from './ConstraintBase';

/**
 * 弹簧特性六自由度约束
 */
export class Generic6DofSpringConstraint extends ConstraintBase<Ammo.btGeneric6DofSpringConstraint> {
    private _linearLowerLimit: Vector3 = new Vector3(-1e30, -1e30, -1e30);
    private _linearUpperLimit: Vector3 = new Vector3(1e30, 1e30, 1e30);
    private _angularLowerLimit: Vector3 = new Vector3(-Math.PI, -Math.PI, -Math.PI);
    private _angularUpperLimit: Vector3 = new Vector3(Math.PI, Math.PI, Math.PI);

    // 缓存约束配置参数
    private _springParams: { index: number, onOff: boolean }[] = [];
    private _stiffnessParams: { index: number, stiffness: number }[] = [];
    private _dampingParams: { index: number, damping: number }[] = [];
    private _equilibriumPointParams: { index?: number, val?: number }[] = [];

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
     * 启用或禁用弹簧功能。
     * @param index 弹簧的索引
     * @param onOff 是否启用
     */
    public enableSpring(index: number, onOff: boolean): void {
        if (this._constraint) {
            this._constraint.enableSpring(index, onOff);
        } else {
            this._springParams.push({ index, onOff });
        }
    }

    /**
     * 设置弹簧的刚度。
     * @param index 弹簧的索引
     * @param stiffness 刚度值
     */
    public setStiffness(index: number, stiffness: number): void {
        if (this._constraint) {
            this._constraint.setStiffness(index, stiffness);
        } else {
            this._stiffnessParams.push({ index, stiffness });
        }
    }

    /**
     * 设置弹簧的阻尼。
     * @param index 弹簧的索引
     * @param damping 阻尼值
     */
    public setDamping(index: number, damping: number): void {
        if (this._constraint) {
            this._constraint.setDamping(index, damping);
        } else {
            this._dampingParams.push({ index, damping });
        }
    }

    /**
     * 设置弹簧的平衡点。
     * 
     * @param index 弹簧的索引（可选）。如果不提供，则重置所有弹簧的平衡点。
     * @param val 平衡点值（可选）。如果提供，则设置指定弹簧的平衡点为该值。
     * 
     * - 不带参数时，重置所有弹簧的平衡点。
     * - 只带 `index` 参数时，设置指定弹簧的平衡点（值由系统内部处理）。
     * - 带 `index` 和 `val` 参数时，设置指定弹簧的平衡点为 `val`。
     */
    public setEquilibriumPoint(index?: number, val?: number): void {
        if (this._constraint) {
            if (index == undefined) {
                this._constraint.setEquilibriumPoint();
            } else if (val == undefined) {
                this._constraint.setEquilibriumPoint(index);
            } else {
                this._constraint.setEquilibriumPoint(index, val);
            }
        } else {
            this._equilibriumPointParams.push({ index, val });
        }
    }

    /**
     * 是否使用线性参考坐标系。
     * 默认值 `true`
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

            this._constraint = new Ammo.btGeneric6DofSpringConstraint(selfBody, targetBody, frameInA, frameInB, this.useLinearFrameReferenceFrame);
            Ammo.destroy(frameInB);
        } else {
            this._constraint = new Ammo.btGeneric6DofSpringConstraint(selfBody, frameInA, this.useLinearFrameReferenceFrame);
        }

        this.setConstraint()
    }

    private setConstraint() {

        // 设置线性和角度限制
        this._constraint.setLinearLowerLimit(TempPhyMath.toBtVec(this._linearLowerLimit));
        this._constraint.setLinearUpperLimit(TempPhyMath.toBtVec(this._linearUpperLimit));
        this._constraint.setAngularLowerLimit(TempPhyMath.toBtVec(this._angularLowerLimit));
        this._constraint.setAngularUpperLimit(TempPhyMath.toBtVec(this._angularUpperLimit));

        // 应用缓存的弹簧参数
        this._springParams.forEach(param => this._constraint.enableSpring(param.index, param.onOff));
        this._stiffnessParams.forEach(param => this._constraint.setStiffness(param.index, param.stiffness));
        this._dampingParams.forEach(param => this._constraint.setDamping(param.index, param.damping));
        this._equilibriumPointParams.forEach(param => this.setEquilibriumPoint(param.index, param.val));

        // 清空缓存
        this._springParams = [];
        this._stiffnessParams = [];
        this._dampingParams = [];
        this._equilibriumPointParams = [];
    }
}
