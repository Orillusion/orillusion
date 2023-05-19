import { Camera3D } from '../../core/Camera3D';
import { Engine3D } from '../../Engine3D';
import { PointerEvent3D } from '../../event/eventConst/PointerEvent3D';
import { MouseCode } from '../../event/MouseCode';
import { webGPUContext } from '../../gfx/graphics/webGpu/Context3D';
import { Ray } from '../../math/Ray';
import { Vector2 } from '../../math/Vector2';
import { Vector3 } from '../../math/Vector3';
import { Time } from '../../util/Time';
import { IUIInteractive, UIInteractiveStyle } from './uiComponents/IUIInteractive';
import { UITransform } from './uiComponents/UITransform';
import { ViewPanel } from './uiComponents/ViewPanel';
import { WorldPanel } from './uiComponents/WorldPanel';
import { Object3D } from '../../core/entities/Object3D';
import { View3D } from '../../core/View3D';
import { zSorterUtil } from '../../util/ZSorterUtil';

/**
 * Pickup logic for GUI interactive components
 * @group GUI/IO
 */
export class GUIPick {
    // The ray used for bounding box pickup
    private _ray: Ray;

    private _mouseCode: MouseCode;
    private _clickEvent: PointerEvent3D;
    private _outEvent: PointerEvent3D;
    private _overEvent: PointerEvent3D;
    private _upEvent: PointerEvent3D;
    private _downEvent: PointerEvent3D;
    private _view: View3D;

    // private mouseMove: PointerEvent3D;

    /**
     * Initialize the pickup and call it internally during engine initialization
     */
    public init(view: View3D): void {
        this._view = view;
        this._ray = new Ray();

        this._clickEvent = new PointerEvent3D(PointerEvent3D.PICK_CLICK_GUI);
        this._outEvent = new PointerEvent3D(PointerEvent3D.PICK_OUT_GUI);
        this._overEvent = new PointerEvent3D(PointerEvent3D.PICK_OVER_GUI);
        // this.mouseMove = new PointerEvent3D(PointerEvent3D.PICK_MOVE);
        this._upEvent = new PointerEvent3D(PointerEvent3D.PICK_UP_GUI);
        this._downEvent = new PointerEvent3D(PointerEvent3D.PICK_DOWN_GUI);

        Engine3D.inputSystem.addEventListener(PointerEvent3D.POINTER_DOWN, this.onTouchDown, this);
        Engine3D.inputSystem.addEventListener(PointerEvent3D.POINTER_UP, this.onTouchUp, this);
        Engine3D.inputSystem.addEventListener(PointerEvent3D.POINTER_MOVE, this.onTouchMove, this);
    }

    private _lastDownTarget: IUIInteractive;
    private _lastOverTarget: IUIInteractive;

    private onTouchMove(e: PointerEvent3D) {
        this._mouseCode = e.mouseCode;
        this.collectEntities();
        let ret = this.pick(this._colliderOut, this._view.camera);
        let target = ret ? ret.interactive : null;
        if (target != this._lastOverTarget) {
            if (this._lastOverTarget && this._lastOverTarget.enable) {
                this._lastOverTarget.mouseStyle = UIInteractiveStyle.NORMAL;
                this._outEvent.data = this._lastOverTarget;
                this._lastOverTarget.object3D.dispatchEvent(this._outEvent);
            }
            if (target) {
                target.mouseStyle = UIInteractiveStyle.OVER;
                this._overEvent.data = target;
                target.object3D.dispatchEvent(this._overEvent);
            }
            this._lastOverTarget = target;
        }
    }

    private _lastDownPosition: Vector2 = new Vector2();
    private _calcDistanceVec2: Vector2 = new Vector2();
    private _lastDownTime: number = 0;
    private readonly _clickTimeSpan: number = 200; //ms
    private readonly _clickDistanceSpan: number = 10;

    private onTouchDown(e: PointerEvent3D) {
        this._lastDownTime = Time.time;
        this._lastDownPosition.set(e.mouseX, e.mouseY);

        this._mouseCode = e.mouseCode;
        this.collectEntities();
        let ret = this.pick(this._colliderOut, this._view.camera);
        let target = ret ? ret.interactive : null;
        if (target) {
            target.mouseStyle = UIInteractiveStyle.DOWN;
            this._overEvent.data = target;
            target.object3D.dispatchEvent(this._overEvent);
        }
        this._lastDownTarget = target;
    }

    private onTouchUp(e: PointerEvent3D) {
        this._calcDistanceVec2.set(e.mouseX, e.mouseY);

        this._mouseCode = e.mouseCode;
        this.collectEntities();
        let ret = this.pick(this._colliderOut, this._view.camera);
        let target = ret ? ret.interactive : null;
        if (this._lastDownTarget && this._lastDownTarget.enable) {
            this._lastDownTarget.mouseStyle = UIInteractiveStyle.NORMAL;
        }

        if (target && target == this._lastDownTarget) {
            if (Time.time - this._lastDownTime <= this._clickTimeSpan) {
                this._calcDistanceVec2.set(e.mouseX, e.mouseY);
                if (this._calcDistanceVec2.distance(this._lastDownPosition) <= this._clickDistanceSpan) {
                    this._clickEvent.data = { pick: target, pickInfo: ret, mouseCode: this._mouseCode };
                    target.object3D.dispatchEvent(this._clickEvent);
                }
            }
        }
        this._lastDownTarget = null;
    }

    private _colliderOut: IUIInteractive[] = [];
    private _uiList: UITransform[] = [];
    private _sortWorldPanelList = [];
    private collectEntities(): IUIInteractive[] {
        this._colliderOut.length = 0;
        this._uiList.length = 0;
        this._sortWorldPanelList.length = 0;

        this._view.canvasList.forEach(canvas => {
            if (canvas && canvas.transform && canvas.transform.parent) {
                let viewPanels = canvas.object3D.getComponents(ViewPanel);
                let worldPanels = canvas.object3D.getComponents(WorldPanel);
                worldPanels = zSorterUtil.sort(this._view.camera, worldPanels, this.getObject3D, this._sortWorldPanelList) as any;

                for (let panel of worldPanels) {
                    panel.object3D.getComponents(UITransform, this._uiList);
                }

                for (let panel of viewPanels) {
                    panel.object3D.getComponents(UITransform, this._uiList);
                }

                for (const uiTransform of this._uiList) {
                    let interactiveList = uiTransform.uiInteractiveList;
                    if (interactiveList && interactiveList.length > 0) {
                        this._colliderOut.push(...interactiveList);
                    }
                }
            }
        });

        return this._colliderOut;
    }

    private getObject3D(userData: WorldPanel): Object3D {
        return userData.object3D;
    }

    private pick(colliders: IUIInteractive[], camera: Camera3D) {
        this._ray = this._view.camera.screenPointToRay(Engine3D.inputSystem.mouseX, Engine3D.inputSystem.mouseY);
        let screenPos = new Vector2(Engine3D.inputSystem.mouseX, Engine3D.inputSystem.mouseY);
        let screenSize = new Vector2(webGPUContext.canvas.clientWidth, webGPUContext.canvas.clientHeight);

        let intersect: { intersect: boolean; intersectPoint?: Vector3; distance: number; interactive?: IUIInteractive };
        for (const iterator of colliders) {
            if (iterator.interactive && iterator.enable && iterator.interactiveVisible) {
                intersect = iterator.rayPick(this._ray, screenPos, screenSize);
                if (intersect) {
                    intersect.interactive = iterator;
                    return intersect;
                }
            }
        }
        return null;
    }
}
