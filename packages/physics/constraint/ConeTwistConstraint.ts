import { Ammo, Physics } from '../Physics';
import { TempPhyMath } from '../utils/TempPhyMath'
import { ConstraintBase } from './ConstraintBase';

/**
 * 锥形扭转约束
 */
export class ConeTwistConstraint extends ConstraintBase<Ammo.btConeTwistConstraint> {
    private _twistSpan: number = Math.PI;
    private _swingSpan1: number = Math.PI;
    private _swingSpan2: number = Math.PI;

    /**
     * 扭转角度限制，绕 X 轴的扭转范围。
     * 默认值 `Math.PI` 
     */
    public get twistSpan() {
        return this._twistSpan;
    }
    public set twistSpan(value: number) {
        this._twistSpan = value;
        this._constraint?.setLimit(3, value);
    }

    /**
     * 摆动角度限制1，绕 Y 轴的摆动范围。
     * 默认值 `Math.PI` 
     */
    public get swingSpan1() {
        return this._swingSpan1;
    }
    public set swingSpan1(value: number) {
        this._swingSpan1 = value;
        this._constraint?.setLimit(5, value);
    }

    /**
     * 摆动角度限制2，绕 Z 轴的摆动范围。
     * 默认值 `Math.PI` 
     */
    public get swingSpan2() {
        return this._swingSpan2;
    }
    public set swingSpan2(value: number) {
        this._swingSpan2 = value;
        this._constraint?.setLimit(4, value);
    }

    protected createConstraint(selfBody: Ammo.btRigidBody, targetBody: Ammo.btRigidBody | null) {
        const frameInA = TempPhyMath.toBtVec(this.pivotSelf);
        const rotInA = TempPhyMath.toBtQua(this.rotationSelf);

        const transformA = Physics.TEMP_TRANSFORM;
        transformA.setIdentity();
        transformA.setOrigin(frameInA);
        transformA.setRotation(rotInA);

        if (targetBody) {
            const frameInB = TempPhyMath.toBtVec(this.pivotTarget, TempPhyMath.tmpVecB);
            const rotInB = TempPhyMath.toBtQua(this.rotationTarget, TempPhyMath.tmpQuaB);
            const transformB = new Ammo.btTransform();
            transformB.setIdentity();
            transformB.setOrigin(frameInB);
            transformB.setRotation(rotInB);

            this._constraint = new Ammo.btConeTwistConstraint(selfBody, targetBody, transformA, transformB);
            Ammo.destroy(transformB);
        } else {
            this._constraint = new Ammo.btConeTwistConstraint(selfBody, transformA);
        }

        //********************************************
        //* 当前版本 Ammo 无法设置柔软度/偏差/松弛度
        //* 索引 3 是 m_twistSpan axe X
        //* 索引 4 是 m_swingSpan2 axe Z
        //* 索引 5 是 m_swingSpan1 axe Y
        //********************************************

        this._constraint.setLimit(3, this.twistSpan);
        this._constraint.setLimit(5, this.swingSpan1);
        this._constraint.setLimit(4, this.swingSpan2);
    }
}
