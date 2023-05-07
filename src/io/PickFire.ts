import { Camera3D } from '../core/Camera3D';
import { Engine3D } from '../Engine3D';
import { MouseCode } from '../event/MouseCode';
import { CEventDispatcher } from '../event/CEventDispatcher';
import { Ray } from '../math/Ray';
import { Vector3 } from '../math/Vector3';
import { PickCompute } from './picker/PickCompute';
import { ColliderComponent } from '../components/ColliderComponent';
import { View3D } from '../core/View3D';
import { PointerEvent3D } from '../event/eventConst/PointerEvent3D';
/**
 * Management and triggering for picking 3D objects
 * @group IO
 */
export class PickFire extends CEventDispatcher {
    /**
     * The ray used to pick 3D objects
     */
    public ray: Ray;

    /**
     * whether it's touching
     */
    public isTouching: boolean = false;
    private _mouseCode: MouseCode;

    private _pickEvent: PointerEvent3D;
    private _outEvent: PointerEvent3D;
    private _overEvent: PointerEvent3D;
    private _upEvent: PointerEvent3D;
    private _downEvent: PointerEvent3D;
    private _mouseMove: PointerEvent3D;
    private _pickCompute: PickCompute;

    //Recently Objects, picked by mousedown
    private _lastDownTarget: ColliderComponent;

    /**
     * a map records the association information between meshID(matrix id) and ColliderComponent
     */
    public mouseEnableMap: Map<number, ColliderComponent>;
    private _view: View3D;

    constructor(view: View3D) {
        super();
        this._view = view;
        this.init();
    }

    /**
     * Initialize the pickup initiator and call it internally during engine initialization
     */
    private init(): void {
        this.ray = new Ray();

        this.mouseEnableMap = new Map<number, ColliderComponent>();

        this._pickEvent = new PointerEvent3D(PointerEvent3D.PICK_CLICK);
        this._outEvent = new PointerEvent3D(PointerEvent3D.PICK_OUT);
        this._overEvent = new PointerEvent3D(PointerEvent3D.PICK_OVER);
        this._mouseMove = new PointerEvent3D(PointerEvent3D.PICK_MOVE);
        this._upEvent = new PointerEvent3D(PointerEvent3D.PICK_UP);
        this._downEvent = new PointerEvent3D(PointerEvent3D.PICK_DOWN);
    }

    /**
    * start this manager
    */
    public start() {
        Engine3D.inputSystem.addEventListener(PointerEvent3D.POINTER_DOWN, this.onTouchStart, this);
        Engine3D.inputSystem.addEventListener(PointerEvent3D.POINTER_UP, this.onTouchEnd, this);
        Engine3D.inputSystem.addEventListener(PointerEvent3D.POINTER_CLICK, this.onTouchOnce, this);
        Engine3D.inputSystem.addEventListener(PointerEvent3D.POINTER_MOVE, this.onTouchMove, this);

        if (Engine3D.setting.pick.mode == `pixel`) {
            this._pickCompute = new PickCompute();
            this._pickCompute.init();
        }
    }


    /**
     * stop this manager
     */
    public stop() {
        Engine3D.inputSystem.removeEventListener(PointerEvent3D.POINTER_DOWN, this.onTouchStart, this);
        Engine3D.inputSystem.removeEventListener(PointerEvent3D.POINTER_UP, this.onTouchEnd, this);
        Engine3D.inputSystem.removeEventListener(PointerEvent3D.POINTER_CLICK, this.onTouchOnce, this);
        Engine3D.inputSystem.removeEventListener(PointerEvent3D.POINTER_MOVE, this.onTouchMove, this);
    }

    private onTouchStart(e: PointerEvent3D) {
        // console.log(e)
        this.isTouching = true;
        this._mouseCode = e.mouseCode;

        this.collectEntities();
        this.pick(this._colliderOut, this._view.camera);
        let target = this.findNearestObj(this._interestList, this._view.camera);
        this._lastDownTarget = target;
        if (target) {
            this._downEvent.target = target.object3D;
            this._downEvent.ctrlKey = e.ctrlKey;
            this._downEvent.data = { pick: target, pickInfo: this.getPickInfo(), mouseCode: this._mouseCode };
            this.dispatchEvent(this._downEvent);

            if (target.object3D.containEventListener(PointerEvent3D.PICK_DOWN)) {
                target.object3D.dispatchEvent(this._downEvent);
            }
        }

    }

    private onTouchEnd(e: PointerEvent3D) {
        this.isTouching = false;
        this._mouseCode = e.mouseCode;

        this.collectEntities();
        this.pick(this._colliderOut, this._view.camera);
        let target = this.findNearestObj(this._interestList, this._view.camera);
        if (target) {
            this._upEvent.target = target.object3D;
            this._upEvent.ctrlKey = e.ctrlKey;
            this._upEvent.data = { pick: target, pickInfo: this.getPickInfo(), mouseCode: this._mouseCode };
            this.dispatchEvent(this._upEvent);
            if (target.object3D.containEventListener(PointerEvent3D.PICK_UP)) {
                target.object3D.dispatchEvent(this._upEvent);
            }
        }

    }

    private _lastFocus: ColliderComponent;

    private getPickInfo() {
        return {
            worldPos: this._pickCompute.getPickWorldPosition(),
            screenUv: this._pickCompute.getPickScreenUV(),
            meshID: this._pickCompute.getPickMeshID(),
        };
    }

    private onTouchMove(e: PointerEvent3D) {
        this.isTouching = true;
        this._mouseCode = e.mouseCode;
        this.collectEntities();
        this.pick(this._colliderOut, this._view.camera);
        let target = this.findNearestObj(this._interestList, this._view.camera);
        if (target) {
            this._mouseMove.target = target.object3D;
            this._mouseMove.ctrlKey = e.ctrlKey;
            this._mouseMove.data = { pick: target, pickInfo: this.getPickInfo(), mouseCode: this._mouseCode };
            this.dispatchEvent(this._mouseMove);
            if (target.object3D.containEventListener(PointerEvent3D.PICK_MOVE)) {
                target.object3D.dispatchEvent(this._mouseMove);
            }
        }

        if (target != this._lastFocus) {
            if (this._lastFocus && this._lastFocus.object3D) {
                this._outEvent.target = target.object3D;
                this._outEvent.data = { pick: this._lastFocus, pickInfo: this.getPickInfo(), mouseCode: this._mouseCode };
                this._outEvent.ctrlKey = e.ctrlKey;
                this.dispatchEvent(this._outEvent);
                if (this._lastFocus.object3D.containEventListener(PointerEvent3D.PICK_OUT)) {
                    this._lastFocus.object3D.dispatchEvent(this._outEvent);
                }
            }
            if (target) {
                this._overEvent.target = target.object3D;
                this._overEvent.ctrlKey = e.ctrlKey;
                this._overEvent.data = { pick: target, pickInfo: this.getPickInfo(), mouseCode: this._mouseCode };
                this.dispatchEvent(this._overEvent);
                if (target.object3D.containEventListener(PointerEvent3D.PICK_OVER)) {
                    target.object3D.dispatchEvent(this._overEvent);
                }
            }
        }
        this._lastFocus = target;
    }

    private onTouchOnce(e: PointerEvent3D) {
        this.isTouching = true;
        this._mouseCode = e.mouseCode;
        this.collectEntities();
        this.pick(this._colliderOut, this._view.camera);
        let target = this.findNearestObj(this._interestList, this._view.camera);
        if (target) {
            let info = Engine3D.setting.pick.mode == `pixel` ? this.getPickInfo() : null;
            this._pickEvent.target = target.object3D;
            this._pickEvent.ctrlKey = e.ctrlKey;
            this._pickEvent.data = { pick: target, pickInfo: info, mouseCode: this._mouseCode };
            this.dispatchEvent(this._pickEvent);

            if (target === this._lastDownTarget && target.object3D.containEventListener(PointerEvent3D.PICK_CLICK)) {
                target.object3D.dispatchEvent(this._pickEvent);
            }
        }

        this._lastDownTarget = null;
    }

    private findNearestObj(list: ColliderComponent[], camera: Camera3D): ColliderComponent {
        let target: ColliderComponent = null;
        let minDistance: number = Number.MAX_VALUE;
        for (const item of list) {
            let curDistance = Vector3.distance(item.object3D.transform.worldPosition, camera.transform.worldPosition);
            if (curDistance < minDistance) {
                target = item;
                minDistance = curDistance;
            }
        }
        return target;
    }

    private _colliderOut: ColliderComponent[] = [];

    private collectEntities(): ColliderComponent[] {
        this._colliderOut.length = 0;
        this._view.scene.getComponents(ColliderComponent, this._colliderOut);
        return this._colliderOut;
    }

    private _interestList: ColliderComponent[] = [];

    private pick(colliders: ColliderComponent[], camera: Camera3D) {
        this._interestList.length = 0;
        if (Engine3D.setting.pick.mode == `pixel`) {
            this._pickCompute.compute(this._view);
            let meshID = this._pickCompute.getPickMeshID();
            let iterator = this.mouseEnableMap.get(meshID);
            if (iterator) {
                this._interestList.push(iterator);
            }
        } else if (Engine3D.setting.pick.mode == `bound`) {
            this.ray = camera.screenPointToRay(Engine3D.inputSystem.mouseX, Engine3D.inputSystem.mouseY);
            let intersect: { intersect: boolean; intersectPoint?: Vector3; distance: number };
            for (const iterator of colliders) {
                intersect = iterator.enable && iterator.rayPick(this.ray);
                if (intersect) {
                    this._interestList.push(iterator);
                }
            }
        }
    }
}

// /**
//  * @internal
//  */
// export let pickFire: PickFire = new PickFire();
