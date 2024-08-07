import { Vector3 } from '@orillusion/core';
import { Ammo, Physics } from '../Physics';
import { TempPhyMath } from '../utils/TempPhyMath';
import { ConstraintBase } from './ConstraintBase';

/**
 * 铰链约束
 */
export class HingeConstraint extends ConstraintBase<Ammo.btHingeConstraint> {
    /**
     * 自身刚体上的铰链轴方向。
     * 默认值 `Vector3.UP`
     */
    public axisSelf: Vector3 = Vector3.UP;
    /**
     * 目标刚体上的铰链轴方向。
     * 默认值 `Vector3.UP`
     */
    public axisTarget: Vector3 = Vector3.UP;
    /**
     * 是否使用自身刚体的参考框架。
     * 默认值 `true`
     */
    public useReferenceFrameA: boolean = true;
    /**
     * 是否使用两个刚体的变换重载方式。
     * 如果为 true，则使用两个刚体的变换作为约束的参考框架。
     * 默认值 `false`
     */
    public useTwoBodiesTransformOverload: boolean = false;

    private _pendingLimits: [number, number, number, number, number?];
    private _pendingMotorConfig: [boolean, number, number];

    /**
     * 获取当前的限制参数。
     */
    public get limitInfo() { return this._pendingLimits; }
    /**
     * 获取当前的马达配置参数。
     */
    public get motorConfigInfo() { return this._pendingMotorConfig; }

    /**
     * 设置铰链约束的旋转限制。
     * @param low - 铰链旋转的最小角度（下限）。
     * @param high - 铰链旋转的最大角度（上限）。
     * @param softness - 软限制系数，表示限制的柔软程度。值在0到1之间，1表示完全刚性。
     * @param biasFactor - 偏置因子，用于控制限制恢复力的力度。值通常在0到1之间。
     * @param relaxationFactor -（可选）松弛因子，控制限制恢复的速度。值越大，恢复越快。
     */
    public setLimit(low: number, high: number, softness: number, biasFactor: number, relaxationFactor?: number): void {
        this._pendingLimits = [low, high, softness, biasFactor, relaxationFactor];
        this._constraint?.setLimit(...this._pendingLimits);
    };

    /**
     * 启用或禁用角度马达。
     * @param enableMotor - 是否启用马达。
     * @param targetVelocity - 马达的目标速度。
     * @param maxMotorImpulse - 马达的最大推力。
     */
    public enableAngularMotor(enableMotor: boolean, targetVelocity: number, maxMotorImpulse: number): void {
        this._pendingMotorConfig = [enableMotor, targetVelocity, maxMotorImpulse]
        this._constraint?.enableAngularMotor(...this._pendingMotorConfig)
    };

    protected createConstraint(selfBody: Ammo.btRigidBody, targetBody: Ammo.btRigidBody | null) {
        const constraintType = !targetBody ?
            'SINGLE_BODY_TRANSFORM' : this.useTwoBodiesTransformOverload ?
                'TWO_BODIES_TRANSFORM' : 'TWO_BODIES_PIVOT';

        const pivotInA = TempPhyMath.toBtVec(this.pivotSelf, TempPhyMath.tmpVecA);
        const pivotInB = TempPhyMath.toBtVec(this.pivotTarget, TempPhyMath.tmpVecB);

        switch (constraintType) {
            case 'SINGLE_BODY_TRANSFORM':
                const frameA_single = Physics.TEMP_TRANSFORM;
                frameA_single.setIdentity();
                frameA_single.setOrigin(pivotInA);
                frameA_single.setRotation(TempPhyMath.toBtQua(this.rotationSelf));

                this._constraint = new Ammo.btHingeConstraint(selfBody, frameA_single, this.useReferenceFrameA);
                break;
            case 'TWO_BODIES_TRANSFORM':
                const frameA = Physics.TEMP_TRANSFORM;
                frameA.setIdentity();
                frameA.setOrigin(pivotInA);
                frameA.setRotation(TempPhyMath.toBtQua(this.rotationSelf));

                const frameB = new Ammo.btTransform();
                frameB.setIdentity();
                frameB.setOrigin(pivotInB);
                frameB.setRotation(TempPhyMath.toBtQua(this.rotationTarget, TempPhyMath.tmpQuaB));

                this._constraint = new Ammo.btHingeConstraint(selfBody, targetBody, frameA, frameB, this.useReferenceFrameA);
                Ammo.destroy(frameB);
                break;
            case 'TWO_BODIES_PIVOT':
                const axisSelf = TempPhyMath.toBtVec(this.axisSelf, TempPhyMath.tmpVecC);
                const axisTarget = TempPhyMath.toBtVec(this.axisTarget, TempPhyMath.tmpVecD);

                this._constraint = new Ammo.btHingeConstraint(selfBody, targetBody, pivotInA, pivotInB, axisSelf, axisTarget);
                break;
            default:
                console.error('Invalid constraint type');
                return;
        }

        this._pendingLimits && this.setLimit(...this._pendingLimits)
        this._pendingMotorConfig && this.enableAngularMotor(...this._pendingMotorConfig)
    }
}
