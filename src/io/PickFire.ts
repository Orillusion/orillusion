import { Camera3D } from '../core/Camera3D';
import { MouseCode } from '../event/MouseCode';
import { CEventDispatcher } from '../event/CEventDispatcher';
import { Ray } from '../math/Ray';
import { Vector3 } from '../math/Vector3';
import { PickCompute } from './picker/PickCompute';
import { ColliderComponent } from '../components/ColliderComponent';
import { View3D } from '../core/View3D';
import { PointerEvent3D } from '../event/eventConst/PointerEvent3D';
import { HitInfo } from '../components/shape/ColliderShape';
import { ComponentCollect, Matrix4 } from '..';
import { VisibleLayer } from '../gfx/renderJob/config/VisibleLayer';

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

    /**
     * `bound` mode: only colliders whose `visibleLayer` shares a bit with
     * this mask are picked.
     */
    public layerMask: number = VisibleLayer.All;

    /** `bound` mode: optional per-collider filter; return false to skip a collider. */
    public filter: ((collider: ColliderComponent) => boolean) | null = null;
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

    private _inputSystem() {
        // Multi-instance: prefer the input system owned by the view's
        // engine. Fall back to the legacy static accessor so single-
        // instance usage keeps working.
        const owner = (this._view as any)?.engine3D;
        return owner?.inputSystem;
    }

    /**
    * start this manager
    */
    public start() {
        const input = this._inputSystem();
        if (!input) return;
        const pick = this._view.engine3D.setting.pick;
        if (pick.enable) {
            input.addEventListener(PointerEvent3D.POINTER_DOWN, this.onTouchStart, this);
            input.addEventListener(PointerEvent3D.POINTER_UP, this.onTouchEnd, this);
            input.addEventListener(PointerEvent3D.POINTER_CLICK, this.onTouchOnce, this);
            input.addEventListener(PointerEvent3D.POINTER_RIGHT_CLICK, this.onTouchOnce, this);
            input.addEventListener(PointerEvent3D.POINTER_MOVE, this.onTouchMove, this);
        }

        if (pick.mode == `pixel`) {
            this._pickCompute = new PickCompute();
            this._pickCompute.init(this._view);
        }
    }


    /**
     * stop this manager
     */
    public stop() {
        const input = this._inputSystem();
        if (!input) return;
        input.removeEventListener(PointerEvent3D.POINTER_DOWN, this.onTouchStart, this);
        input.removeEventListener(PointerEvent3D.POINTER_UP, this.onTouchEnd, this);
        input.removeEventListener(PointerEvent3D.POINTER_CLICK, this.onTouchOnce, this);
        input.removeEventListener(PointerEvent3D.POINTER_RIGHT_CLICK, this.onTouchOnce, this);
        input.removeEventListener(PointerEvent3D.POINTER_MOVE, this.onTouchMove, this);
    }

    private onTouchStart(e: PointerEvent3D) {
        // console.log(e)
        this.isTouching = true;
        this._mouseCode = e.mouseCode;

        this.pick(this._view.camera);
        let target = this.findNearestObj(this._interestList, this._view.camera);
        this._lastDownTarget = target;
        if (target) {
            Object.assign(this._downEvent, e);
            this._downEvent.type = PointerEvent3D.PICK_DOWN;
            this._downEvent.target = target.object3D;
            this._downEvent.data = this.getPickInfo();
            this.dispatchEvent(this._downEvent);

            if (target.object3D.containEventListener(PointerEvent3D.PICK_DOWN)) {
                target.object3D.dispatchEvent(this._downEvent);
            }
        }

    }

    private onTouchEnd(e: PointerEvent3D) {
        this.isTouching = false;
        this._mouseCode = e.mouseCode;

        this.pick(this._view.camera);
        let target = this.findNearestObj(this._interestList, this._view.camera);
        if (target) {
            Object.assign(this._upEvent, e);
            this._upEvent.type = PointerEvent3D.PICK_UP;
            this._upEvent.target = target.object3D;
            this._upEvent.data = this.getPickInfo();
            this.dispatchEvent(this._upEvent);

            if (target.object3D.containEventListener(PointerEvent3D.PICK_UP)) {
                target.object3D.dispatchEvent(this._upEvent);
            }
        }

    }

    private _lastFocus: ColliderComponent;

    private getPickInfo() {
        if(this._view.engine3D.setting.pick.mode == `pixel`) {
            return {
                worldPos: this._pickCompute.getPickWorldPosition(),
                worldNormal: this._pickCompute.getPickWorldNormal(),
                screenUv: this._pickCompute.getPickScreenUV(),
                meshID: this._pickCompute.getPickMeshID(),
            };
        } else {
            let intersection = this._interestList[0];
            if (intersection) {
                // Hit objects are created fresh by each pick, so handing them
                // out does not let the next pick overwrite them.
                return {
                    worldPos: intersection.intersectPoint,
                    worldNormal: intersection.normal,
                    meshID: intersection.collider.transform.worldMatrix.index,
                    distance: intersection.distance,
                    localPos: intersection.localPoint,
                    faceNormal: intersection.faceNormal,
                    faceIndex: intersection.faceIndex,
                    barycentric: intersection.barycentric,
                    uv: intersection.uv,
                    uv1: intersection.uv1,
                    subGeometryIndex: intersection.subGeometryIndex,
                    frontFace: intersection.frontFace,
                    hits: this._interestList.slice(),
                };
            }
            return {
                worldPos: Vector3.ZERO,
                worldNormal: Vector3.ZERO,
                meshID: -1,
                distance: 0,
            };
        }
    }

    private onTouchMove(e: PointerEvent3D) {
        this.isTouching = true;
        this._mouseCode = e.mouseCode;
        this.pick(this._view.camera);
        let target = this.findNearestObj(this._interestList, this._view.camera);
        if (target) {
            Object.assign(this._mouseMove, e);
            this._mouseMove.type = PointerEvent3D.PICK_MOVE;
            this._mouseMove.target = target.object3D;
            this._mouseMove.data = this.getPickInfo();
            this.dispatchEvent(this._mouseMove);

            if (target.object3D.containEventListener(PointerEvent3D.PICK_MOVE)) {
                target.object3D.dispatchEvent(this._mouseMove);
            }
        }

        if (target != this._lastFocus) {
            if (this._lastFocus && this._lastFocus.object3D) {
                Object.assign(this._outEvent, e);
                this._outEvent.type = PointerEvent3D.PICK_OUT;
                this._outEvent.target = this._lastFocus.object3D;
                this._outEvent.data = this.getPickInfo();
                this.dispatchEvent(this._outEvent);

                if (this._lastFocus.object3D.containEventListener(PointerEvent3D.PICK_OUT)) {
                    this._lastFocus.object3D.dispatchEvent(this._outEvent);
                }
            }
            if (target) {
                Object.assign(this._overEvent, e);
                this._overEvent.type = PointerEvent3D.PICK_OVER;
                this._overEvent.target = target.object3D;
                this._overEvent.data = this.getPickInfo();
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
        this.pick(this._view.camera);
        let target = this.findNearestObj(this._interestList, this._view.camera);
        if (target) {
            let info = this.getPickInfo();
            Object.assign(this._pickEvent, e);
            this._pickEvent.type = PointerEvent3D.PICK_CLICK;
            this._pickEvent.target = target.object3D;
            this._pickEvent.data = info;
            this.dispatchEvent(this._pickEvent);

            if (target === this._lastDownTarget && target.object3D.containEventListener(PointerEvent3D.PICK_CLICK)) {
                target.object3D.dispatchEvent(this._pickEvent);
            }
        }

        this._lastDownTarget = null;
    }

    private findNearestObj(list: HitInfo[], camera: Camera3D): ColliderComponent {
        // let target: ColliderComponent = null;
        // let minDistance: number = Number.MAX_VALUE;
        // for (const item of list) {
        //     let curDistance = Vector3.distance(item.object3D.transform.worldPosition, camera.transform.worldPosition);
        //     if (curDistance < minDistance) {
        //         target = item;
        //         minDistance = curDistance;
        //     }
        // }
        list.sort((a, b) => {
            return a.distance > b.distance ? 1 : -1;
        });

        return list[0]?.collider;
    }

    private _interestList: HitInfo[] = [];

    private pick(camera: Camera3D) {
        this._interestList.length = 0;
        const mode = this._view.engine3D.setting.pick.mode;
        if (mode == `pixel`) {
            this._pickCompute.compute(this._view);
            let meshID = this._pickCompute.getPickMeshID();
            let iterator = this.mouseEnableMap.get(meshID);
            if (iterator) {
                let position = this._pickCompute.getPickWorldPosition();
                let distance = Vector3.distance(position, this.ray.origin);
                this._interestList.push({ distance: distance, collider: iterator, intersectPoint: position });
            }
        } else if (mode == `bound`) {
            const input = this._inputSystem();
            this.ray = camera.screenPointToRay(input.mouseX, input.mouseY);
            let intersect: HitInfo;
            let colliders = ComponentCollect.componentsEnablePickerList.get(this._view);;
            if (colliders) {
                for (const item of colliders) {
                    let collider = item[0];
                    if (collider.enable && (collider.visibleLayer & this.layerMask) !== 0 && (!this.filter || this.filter(collider))) {
                        intersect = collider.rayPick(this.ray);
                        if (intersect) {
                            intersect.collider = collider;
                            this._interestList.push(intersect);
                        }
                    }

                }
            }
        }
    }
}

// /**
//  * @internal
//  */
// export let pickFire: PickFire = new PickFire();
