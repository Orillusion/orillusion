import { Scene3D } from "../core/Scene3D";
import { View3D } from "../core/View3D";
import { Object3D } from "../core/entities/Object3D";
import { CEvent } from "../event/CEvent";
import { MathUtil } from "../math/MathUtil";
import { Matrix4, makeMatrix44, append } from "../math/Matrix4";
import { Orientation3D } from "../math/Orientation3D";
import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { ComponentBase } from "./ComponentBase";

/**
 * The Transform component contains the position, rotation, and scaling of an object in 3D space.
 * Each object (Object 3D) has a Transform component
 * @group Components
 */
export class Transform extends ComponentBase {
    /**
    * @internal
    */
    public static LIMIT: number = 1;
    /**
    * @internal
    */
    public static COMPONENT_NAME = 'UUTransform';
    /**
    * @internal
    */
    public static COMPONENT_TYPE = 'Transform';
    /**
    * @internal
    */
    public static POSITION_ONCHANGE: string = 'POSITION_ONCHANGE';

    /**
    * @internal
    */
    public static ROTATION_ONCHANGE: string = 'ROTATION_ONCHANGE';
    /**
    * @internal
    */
    public static SCALE_ONCHANGE: string = 'SCALE_ONCHANGE';
    /**
    * @internal
    */
    public static PARENT_ONCHANGE: string = 'PARENT_ONCHANGE';
    /**
    * @internal
    */
    public static CHILDREN_ONCHANGE: string = 'CHILDREN_ONCHANGE';
    /**
    * @internal
    */
    public static ADD_ONCHANGE: string = 'ADD_ONCHANGE';

    /**
    * @internal
    */
    public eventPositionChange: CEvent = new CEvent(Transform.POSITION_ONCHANGE);
    /**
    * @internal
    */
    public eventRotationChange: CEvent = new CEvent(Transform.ROTATION_ONCHANGE);
    /**
    * @internal
    */
    public eventScaleChange: CEvent = new CEvent(Transform.SCALE_ONCHANGE);
    /**
    * @internal
    */
    public onPositionChange: Function;
    /**
    * @internal
    */
    public onRotationChange: Function;
    /**
    * @internal
    */
    public onScaleChange: Function;

    private _scene3d: Scene3D;

    private _parent: Transform;

    private _localPos: Vector3;
    private _localRot: Vector3;
    private _localRotQuat: Quaternion;
    private _localScale: Vector3;
    // public localMatrix: Matrix4;

    private _forward: Vector3 = new Vector3();
    private _back: Vector3 = new Vector3();
    private _right: Vector3 = new Vector3();
    private _left: Vector3 = new Vector3();
    private _up: Vector3 = new Vector3();
    private _down: Vector3 = new Vector3();
    public readonly _worldMatrix: Matrix4;
    private _localChange: boolean = true;

    private _targetPos: Vector3;

    public get targetPos(): Vector3 {
        return this._targetPos;
    }
    public set targetPos(value: Vector3) {
        this._targetPos = value;
    }

    public get parent(): Transform {
        return this._parent;
    }

    public set parent(value: Transform) {
        this._parent = value;
        let hasRoot = value ? value.scene3D : null;
        if (!hasRoot) {
            this.object3D.components.forEach((c) => {
                c[`__stop`]();
            });
        } else {
            this._scene3d = hasRoot;
            this.object3D.components.forEach((c) => {
                this.object3D[`appendLateStart`](c);
            });
        }

        this.object3D.entityChildren.forEach((v) => {
            v.transform.parent = this;
        });
    }

    public set enable(value: boolean) {
        if (this.transform._scene3d && value) {
            super.enable = true;
        } else {
            super.enable = false;
        }
        this.object3D.entityChildren.forEach((v) => {
            v.transform.enable = value;
        });
    }
    public get enable(): boolean {
        return this._enable;
    }

    public get scene3D(): Scene3D {
        return this._scene3d;
    }

    public set scene3D(value: Scene3D) {
        this._scene3d = value;
    }

    public get view3D(): View3D {
        if (this._scene3d && this._scene3d.view) {
            return this._scene3d.view;
        }
        return null;
    }

    constructor() {
        super();
        this._worldMatrix = new Matrix4(true);
        this._localPos = new Vector3();
        this._localRot = new Vector3();
        this._localRotQuat = new Quaternion();
        this._localScale = new Vector3(1, 1, 1);
    }

    awake() { }

    start() { }

    stop() { }

    // update() { }

    // lateUpdate() { }

    /**
    * @internal
    */
    public notifyLocalChange() {
        this._localChange = true;
        let entityChildren = this.object3D.entityChildren;
        for (let i = 0, len = entityChildren.length; i < len; i++) {
            const transform = entityChildren[i].transform;
            transform.notifyLocalChange();
        }
    }

    public get up(): Vector3 {
        this.worldMatrix.transformVector(Vector3.UP, this._up);
        return this._up;
    }

    public set up(value: Vector3) {
        this._up.copyFrom(value);
        this.notifyLocalChange();

        if (this.onRotationChange) {
            this.onRotationChange();
        }

        if (this.eventRotationChange) {
            this.eventDispatcher.dispatchEvent(this.eventRotationChange);
        }
    }

    public get down(): Vector3 {
        this.worldMatrix.transformVector(Vector3.DOWN, this._down);
        return this._down;
    }

    public set down(value: Vector3) {
        this._down.copyFrom(value);
        this.notifyLocalChange();

        if (this.onRotationChange) {
            this.onRotationChange();
        }

        if (this.eventRotationChange) {
            this.eventDispatcher.dispatchEvent(this.eventRotationChange);
        }
    }

    public get forward(): Vector3 {
        this.worldMatrix.transformVector(Vector3.FORWARD, this._forward);
        return this._forward;
    }

    public set forward(value: Vector3) {
        this._forward.copyFrom(value);
        MathUtil.fromToRotation(Vector3.FORWARD, this._forward, Quaternion.HELP_0);
        this.transform.localRotQuat = Quaternion.HELP_0;
        this.notifyLocalChange();

        if (this.onRotationChange) {
            this.onRotationChange();
        }

        if (this.eventRotationChange) {
            this.eventDispatcher.dispatchEvent(this.eventRotationChange);
        }
    }

    public get back(): Vector3 {
        this.worldMatrix.transformVector(Vector3.BACK, this._back);
        return this._back;
    }

    public set back(value: Vector3) {
        this._back.copyFrom(value);
        MathUtil.fromToRotation(Vector3.BACK, this._back, Quaternion.HELP_0);
        this.transform.localRotQuat = Quaternion.HELP_0;
        this.notifyLocalChange();

        if (this.onRotationChange) {
            this.onRotationChange();
        }

        if (this.eventRotationChange) {
            this.eventDispatcher.dispatchEvent(this.eventRotationChange);
        }
    }

    public get left(): Vector3 {
        this.worldMatrix.transformVector(Vector3.neg_X_AXIS, this._left);
        return this._left;
    }

    public set left(value: Vector3) {
        this._left.copyFrom(value);
        this.notifyLocalChange();

        if (this.onRotationChange) {
            this.onRotationChange();
        }

        if (this.eventRotationChange) {
            this.eventDispatcher.dispatchEvent(this.eventRotationChange);
        }
    }

    public get right(): Vector3 {
        this.worldMatrix.transformVector(Vector3.X_AXIS, this._right);
        return this._right;
    }

    public set right(value: Vector3) {
        this._right.copyFrom(value);
        this.notifyLocalChange();

        if (this.onRotationChange) {
            this.onRotationChange();
        }

        if (this.eventRotationChange) {
            this.eventDispatcher.dispatchEvent(this.eventRotationChange);
        }
    }

    /**
     *
     * The transformation property of the object relative to the parent, stored in the from of a quaternion
     */
    public get localRotQuat(): Quaternion {
        return this._localRotQuat;
    }

    public set localRotQuat(value: Quaternion) {
        this._localRotQuat = value;
        this._localRotQuat.getEulerAngles(this._localRot);

        this.notifyLocalChange();

        if (this.onRotationChange) {
            this.onRotationChange();
        }

        if (this.eventRotationChange) {
            this.eventDispatcher.dispatchEvent(this.eventRotationChange);
        }
    }

    /**
     * @private
     */
    public notifyChange(): void {
        this.notifyLocalChange();
        if (this.onRotationChange) {
            this.onRotationChange();
        }

        if (this.eventRotationChange) {
            this.eventDispatcher.dispatchEvent(this.eventRotationChange);
        }
        if (this.eventPositionChange) {
            this.eventDispatcher.dispatchEvent(this.eventPositionChange);
        }
        if (this.eventScaleChange) {
            this.eventDispatcher.dispatchEvent(this.eventScaleChange);
        }
    }

    /**
    * @internal
    */
    public get worldMatrix(): Matrix4 {
        this.updateWorldMatrix();
        return this._worldMatrix;
    }

    /**
     *
     * Update the matrix4 in world space
     */
    public updateWorldMatrix(force: boolean = false) {
        if (this._localChange || force) {
            if (this.parent) {
                makeMatrix44(this._localRot, this._localPos, this.localScale, this._worldMatrix);
                append(this._worldMatrix, this.parent.worldMatrix, this._worldMatrix);

                // WasmMatrix4.makeMatrix44Append(this._localRot, this._localPos, this.localScale, this._worldMatrix, this._worldMatrix, this.parent.worldMatrix, this._worldMatrix);
                this._localChange = false;
            } else {
                makeMatrix44(this._localRot, this._localPos, this.localScale, this._worldMatrix);
                // WasmMatrix4.makeMatrix44(this._localRot, this._localPos, this.localScale, this._worldMatrix);
                this._localChange = false;
            }
        }
    }

    public lookTarget(target: Vector3, up: Vector3 = Vector3.UP) {
        let worldPosition = this.transform.worldPosition;
        this.lookAt(worldPosition, target, up);
    }

    /**
     * Current object's gaze position (global) (modified by its own global transformation)
     * @param pos Own position (global)
     * @param target Location of the target (global)
     * @param up up direction
     */
    public lookAt(pos: Vector3, target: Vector3, up: Vector3 = Vector3.UP) {
        this._targetPos = target.clone();
        this._localPos.copyFrom(pos);
        this.notifyLocalChange();

        Matrix4.helpMatrix.lookAt(pos, target, up);
        Matrix4.helpMatrix.invert();
        var prs: Vector3[] = Matrix4.helpMatrix.decompose(Orientation3D.QUATERNION);
        Quaternion.CALCULATION_QUATERNION.x = prs[1].x;
        Quaternion.CALCULATION_QUATERNION.y = prs[1].y;
        Quaternion.CALCULATION_QUATERNION.z = prs[1].z;
        Quaternion.CALCULATION_QUATERNION.w = prs[1].w;
        Quaternion.CALCULATION_QUATERNION.toEulerAngles(this._localRot);

        if (this.eventPositionChange) {
            this.eventDispatcher.dispatchEvent(this.eventPositionChange);
        }

        if (this.onPositionChange) {
            this.onPositionChange();
        }

        if (this.onRotationChange) {
            this.onRotationChange();
        }

        if (this.eventRotationChange) {
            this.eventDispatcher.dispatchEvent(this.eventRotationChange);
        }
    }

    destroy(): void {
        if (this.parent && this.parent.object3D) {
            this.parent.object3D.removeChild(this.object3D);
            this.scene3D = null;
            this.localPosition = null;
            this.localRotQuat = null;
            this.localRotation = null;
            this.localScale = null;
        }
        super.destroy();
    }


    public decomposeFromMatrix(matrix: Matrix4, orientationStyle: string = 'eulerAngles'): this {
        let prs = matrix.decompose(orientationStyle);

        let transform = this.transform;

        transform.localRotQuat.copyFrom(prs[1]);
        transform.localRotQuat = transform.localRotQuat;

        transform.localPosition.copyFrom(prs[0]);
        transform.localPosition = transform.localPosition;

        transform.localScale.copyFrom(prs[2]);
        transform.localScale = transform.localScale;
        this.updateWorldMatrix();
        return this;
    }

    /**
    *
    * Create a new component, copy the properties of the current component, and add it to the target object.
    * @param obj source Object3D
    */
    cloneTo(obj: Object3D) {
        obj.transform.localPosition.copyFrom(this.localPosition);
        obj.transform.localRotation.copyFrom(this.localRotation);
        obj.transform.localScale.copyFrom(this.localScale);
    }

    public set x(value: number) {
        if (this._localPos.x != value) {
            this._localPos.x = value;
            this.notifyLocalChange();

            if (this.onPositionChange) {
                this.onPositionChange();
            }

            if (this.eventPositionChange) {
                this.eventDispatcher.dispatchEvent(this.eventPositionChange);
            }
        }
    }
    /**
     *
     * The position of the object relative to its parent X-axis
     */
    public get x(): number {
        return this._localPos.x;
    }

    public set y(value: number) {
        if (this._localPos.y != value) {
            this._localPos.y = value;
            this.notifyLocalChange();

            if (this.onPositionChange) {
                this.onPositionChange();
            }

            if (this.eventPositionChange) {
                this.eventDispatcher.dispatchEvent(this.eventPositionChange);
            }
        }
    }
    /**
     *
     * The position of the object relative to its parent Y-axis
     */
    public get y(): number {
        return this._localPos.y;
    }

    public set z(value: number) {
        if (this._localPos.z != value) {
            this._localPos.z = value;
            this.notifyLocalChange();

            if (this.onPositionChange) {
                this.onPositionChange();
            }

            if (this.eventPositionChange) {
                this.eventDispatcher.dispatchEvent(this.eventPositionChange);
            }
        }
    }
    /**
     *
     * The position of the object relative to its parent Y-axis
     */
    public get z(): number {
        return this._localPos.z;
    }

    public set scaleX(value: number) {
        if (this._localScale.x != value) {
            this._localScale.x = value;
            this.notifyLocalChange();

            if (this.eventScaleChange) {
                this.eventDispatcher.dispatchEvent(this.eventScaleChange);
            }
        }
    }
    /**
     *
     * The scale of the object relative to its parent X-axis
     */
    public get scaleX(): number {
        return this._localScale.x;
    }

    public set scaleY(value: number) {
        if (this._localScale.y != value) {
            this._localScale.y = value;
            this.notifyLocalChange();

            if (this.eventScaleChange) {
                this.eventDispatcher.dispatchEvent(this.eventScaleChange);
            }
        }
    }
    /**
     *
     * The scale of the object relative to its parent Y-axis
     */
    public get scaleY(): number {
        return this._localScale.y;
    }

    public set scaleZ(value: number) {
        if (this._localScale.z != value) {
            this._localScale.z = value;
            this.notifyLocalChange();

            if (this.eventScaleChange) {
                this.eventDispatcher.dispatchEvent(this.eventScaleChange);
            }
        }
    }

    /**
     *
     * The scale of the object relative to its parent Z-axis
     */
    public get scaleZ(): number {
        return this._localScale.z;
    }

    public set rotationX(value: number) {
        if (this._localRot.x != value) {
            this._localRot.x = value;
            this.notifyLocalChange();

            if (this.onRotationChange) {
                this.onRotationChange();
            }

            if (this.eventRotationChange) {
                this.eventDispatcher.dispatchEvent(this.eventRotationChange);
            }
        }
    }
    /**
     *
     * The rotation of the object relative to its parent X-axis
     */
    public get rotationX(): number {
        return this._localRot.x;
    }

    public set rotationY(value: number) {
        if (this._localRot.y != value) {
            this._localRot.y = value;
            this.notifyLocalChange();

            if (this.onRotationChange) {
                this.onRotationChange();
            }

            if (this.eventRotationChange) {
                this.eventDispatcher.dispatchEvent(this.eventRotationChange);
            }
        }
    }
    /**
     *
     * The rotation of the object relative to its parent Y-axis
     */
    public get rotationY(): number {
        return this._localRot.y;
    }

    public set rotationZ(value: number) {
        if (this._localRot.z != value) {
            this._localRot.z = value;
            this.notifyLocalChange();

            if (this.onRotationChange) {
                this.onRotationChange();
            }

            if (this.eventRotationChange) {
                this.eventDispatcher.dispatchEvent(this.eventRotationChange);
            }
        }
    }
    /**
     *
     * The rotation of the object relative to its parent Z-axis
     */
    public get rotationZ(): number {
        return this._localRot.z;
    }
    /**
     *
     * world position
     */
    public get worldPosition(): Vector3 {
        if (this._localChange) {
            this.updateWorldMatrix();
        }
        return this._worldMatrix.position;
    }

    public set localPosition(v: Vector3) {
        this.x = v.x;
        this.y = v.y;
        this.z = v.z;
        this.notifyLocalChange();

        if (this.onPositionChange) {
            this.onPositionChange();
        }

        if (this.eventPositionChange) {
            this.eventDispatcher.dispatchEvent(this.eventPositionChange);
        }
    }
    /**
     *
     * The position of an object relative to its parent
     */
    public get localPosition(): Vector3 {
        return this._localPos;
    }

    public set localRotation(v: Vector3) {
        this.rotationX = v.x;
        this.rotationY = v.y;
        this.rotationZ = v.z;
        this.notifyLocalChange();

        if (this.onRotationChange) {
            this.onRotationChange();
        }

        if (this.eventRotationChange) {
            this.eventDispatcher.dispatchEvent(this.eventRotationChange);
        }
    }

    /**
     *
     * The rotaion vector of an object relative to its parent
     */
    public get localRotation(): Vector3 {
        return this._localRot;
    }

    public set localScale(v: Vector3) {
        this.scaleX = v.x;
        this.scaleY = v.y;
        this.scaleZ = v.z;
        this.notifyLocalChange();

        if (this.eventScaleChange) {
            this.eventDispatcher.dispatchEvent(this.eventScaleChange);
        }
    }
    /**
     *
     * The scale of an object relative to its parent
     */
    public get localScale(): Vector3 {
        return this._localScale;
    }

    // private _rotateAroundAxisX:number = 0 ;
    // public set rotateAroundAxisX(value:number){
    //     this._rotateAroundAxisX = value;
    //     this.notifyLocalChange();

    //     let quat = Quaternion.HELP_0 ;
    //     quat.fromAxisAngle(this.right,value);
    //     // quat.fromEulerAngles(this._rotateAroundAxisX,this._rotateAroundAxisY,this._rotateAroundAxisZ);
    //     quat.toEulerAngles(this._localRot);

    //     this.notifyLocalChange();
    //     if( this.onRotationChange ){
    //         this.onRotationChange();
    //     }

    //     if (this.events_rot) {
    //         this.events.dispatchEvent(this.events_rot);
    //     }
    // }

    // /**
    //  *
    //  */
    // public get rotateAroundAxisX():number {
    //     return this._rotateAroundAxisX ;
    // }

    // private _rotateAroundAxisY:number = 0 ;
    // public set rotateAroundAxisY(value:number){
    //     this._rotateAroundAxisY = value;
    //     this.notifyLocalChange();

    //     let quat = Quaternion.HELP_0 ;
    //     quat.fromEulerAngles(this._rotateAroundAxisX,this._rotateAroundAxisY,this._rotateAroundAxisZ);
    //     quat.toEulerAngles(this._localRot);

    //     this.notifyLocalChange();
    //     if( this.onRotationChange ){
    //         this.onRotationChange();
    //     }

    //     if (this.events_rot) {
    //         this.events.dispatchEvent(this.events_rot);
    //     }
    // }

    // /**
    //  *
    //  */
    // public get rotateAroundAxisY():number {
    //     return this._rotateAroundAxisY ;
    // }

    // private _rotateAroundAxisZ:number = 0 ;
    // public set rotateAroundAxisZ(value:number){
    //     this._rotateAroundAxisZ = value;
    //     this.notifyLocalChange();

    //     let quat = Quaternion.HELP_0 ;
    //     quat.fromEulerAngles(this._rotateAroundAxisX,this._rotateAroundAxisY,this._rotateAroundAxisZ);
    //     quat.toEulerAngles(this._localRot);

    //     this.notifyLocalChange();
    //     if( this.onRotationChange ){
    //         this.onRotationChange();
    //     }

    //     if (this.events_rot) {
    //         this.events.dispatchEvent(this.events_rot);
    //     }
    // }

    // /**
    //  *
    //  */
    // public get rotateAroundAxisZ():number {
    //     return this._rotateAroundAxisZ ;
    // }

}
