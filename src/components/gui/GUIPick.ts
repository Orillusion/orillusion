import { Engine3D } from '../../Engine3D';
import { PickGUIEvent3D, PointerEvent3D } from '../../event/eventConst/PointerEvent3D';
import { MouseCode } from '../../event/MouseCode';
import { webGPUContext } from '../../gfx/graphics/webGpu/Context3D';
import { Ray } from '../../math/Ray';
import { Vector2 } from '../../math/Vector2';
import { Time } from '../../util/Time';
import { IUIInteractive, UIInteractiveStyle, GUIHitInfo } from './uiComponents/IUIInteractive';
import { UITransform } from './uiComponents/UITransform';
import { View3D } from '../../core/View3D';
import { UIPanel } from './uiComponents/UIPanel';

/**
 * Pickup logic for GUI interactive components
 * @group GPU GUI
 */
export class GUIPick {
    // The ray used for bounding box pickup
    private _ray: Ray;

    private _mouseCode: MouseCode;
    private _clickEvent: PickGUIEvent3D;
    private _outEvent: PickGUIEvent3D;
    private _overEvent: PickGUIEvent3D;
    private _upEvent: PickGUIEvent3D;
    private _downEvent: PickGUIEvent3D;
    private _view: View3D;

    // private mouseMove: PickGUIEvent3D;

    /**
     * Initialize the pickup and call it internally during engine initialization
     */
    public init(view: View3D): void {
        this._view = view;
        this._ray = new Ray();

        this._clickEvent = new PickGUIEvent3D(PickGUIEvent3D.PICK_CLICK_GUI);
        this._outEvent = new PickGUIEvent3D(PickGUIEvent3D.PICK_OUT_GUI);
        this._overEvent = new PickGUIEvent3D(PickGUIEvent3D.PICK_OVER_GUI);
        // this.mouseMove = new PointerEvent3D(PickGUIEvent3D.PICK_MOVE);
        this._upEvent = new PickGUIEvent3D(PickGUIEvent3D.PICK_UP_GUI);
        this._downEvent = new PickGUIEvent3D(PickGUIEvent3D.PICK_DOWN_GUI);

        Engine3D.inputSystem.addEventListener(PointerEvent3D.POINTER_DOWN, this.onTouchDown, this, null, 1);
        Engine3D.inputSystem.addEventListener(PointerEvent3D.POINTER_UP, this.onTouchUp, this, null, 1);
        Engine3D.inputSystem.addEventListener(PointerEvent3D.POINTER_MOVE, this.onTouchMove, this, null, 1);
        Engine3D.inputSystem.addEventListener(PointerEvent3D.POINTER_CLICK, this.onTouchClick, this, null, 1);
    }

    private _lastDownTarget: IUIInteractive;
    private _lastOverTarget: IUIInteractive;

    private onTouchClick(e: PointerEvent3D) {
        if (this._lastOverTarget) {
            e.stopImmediatePropagation();
        }
    }

    private onTouchMove(e: PointerEvent3D) {
        this._mouseCode = e.mouseCode;
        this.collectEntities();
        let ret = this.pick(this._colliderOut);
        if(ret){
            e.stopImmediatePropagation();
            let _target = ret.collider;
            if(_target != this._lastOverTarget){
                _target.mouseStyle = UIInteractiveStyle.OVER;
                Object.assign(this._overEvent, e);
                this._overEvent.type = PickGUIEvent3D.PICK_OVER_GUI;
                this._overEvent.target = _target.object3D;
                this._overEvent.data = ret;
                _target.object3D.dispatchEvent(this._overEvent);

                if (this._lastOverTarget) {
                    this._lastOverTarget.mouseStyle = UIInteractiveStyle.NORMAL;
                    Object.assign(this._outEvent, e);
                    this._outEvent.type = PickGUIEvent3D.PICK_OUT_GUI;
                    this._outEvent.target = _target.object3D;
                    this._outEvent.data = ret;
                    this._lastOverTarget.object3D.dispatchEvent(this._outEvent);
                }
            }  
            this._lastOverTarget = _target;
        }else{
            if (this._lastOverTarget) {
                this._lastOverTarget.mouseStyle = UIInteractiveStyle.NORMAL;
                Object.assign(this._outEvent, e);
                this._outEvent.type = PickGUIEvent3D.PICK_OUT_GUI;
                this._outEvent.target = this._lastOverTarget.object3D;
                this._outEvent.data = ret;
                this._lastOverTarget.object3D.dispatchEvent(this._outEvent);
                this._lastOverTarget = null
            }
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
        let ret = this.pick(this._colliderOut);
        ret && e.stopImmediatePropagation();
        let collider = ret ? ret.collider : null;
        if (collider) {
            collider.mouseStyle = UIInteractiveStyle.DOWN;
            Object.assign(this._downEvent, e);
            this._downEvent.type = PickGUIEvent3D.PICK_DOWN_GUI;
            this._downEvent.target = collider.object3D;
            this._downEvent.data = ret;
            collider.object3D.dispatchEvent(this._downEvent);
        }
        this._lastDownTarget = collider;
    }

    private onTouchUp(e: PointerEvent3D) {
        this._calcDistanceVec2.set(e.mouseX, e.mouseY);

        this._mouseCode = e.mouseCode;
        this.collectEntities();
        let ret = this.pick(this._colliderOut);
        ret && e.stopImmediatePropagation();

        let collider = ret ? ret.collider : null;
        if (this._lastDownTarget && this._lastDownTarget.enable) {
            this._lastDownTarget.mouseStyle = UIInteractiveStyle.NORMAL;
        }

        if (collider && collider == this._lastDownTarget) {
            if (Time.time - this._lastDownTime <= this._clickTimeSpan) {
                this._calcDistanceVec2.set(e.mouseX, e.mouseY);
                if (this._calcDistanceVec2.distance(this._lastDownPosition) <= this._clickDistanceSpan) {
                    Object.assign(this._clickEvent, e);
                    this._clickEvent.type = PickGUIEvent3D.PICK_CLICK_GUI;
                    this._clickEvent.target = collider.object3D;
                    this._clickEvent.data = ret;
                    collider.object3D.dispatchEvent(this._clickEvent);
                }
            }
        }
        this._lastDownTarget = null;
    }

    private _colliderOut: IUIInteractive[] = [];
    private _transformList: UITransform[] = [];
    private _sortWorldPanelList = [];
    private _iteractive2PanelDict: Map<IUIInteractive, UIPanel> = new Map<IUIInteractive, UIPanel>();

    private collectEntities(): IUIInteractive[] {
        this._colliderOut.length = 0;
        this._sortWorldPanelList.length = 0;
        this._iteractive2PanelDict.clear();

        let reversedCanvasList = this._view.canvasList.slice().reverse();
        reversedCanvasList.forEach(canvas => {
            if (canvas && canvas.transform && canvas.transform.parent) {
                let panels = canvas.object3D.getComponentsByProperty('isUIPanel', true, true) as UIPanel[];

                panels.sort((a, b) => {
                    let aOrder = a['_uiRenderer']['__renderOrder'];
                    let bOrder = b['_uiRenderer']['__renderOrder'];
                    return aOrder > bOrder ? -1 : 1;
                })

                for (let panel of panels) {
                    this._transformList.length = 0;
                    panel.object3D.getComponents(UITransform, this._transformList);
                    this._transformList.reverse();
                    for (const uiTransform of this._transformList) {
                        let interactiveList = uiTransform.uiInteractiveList;
                        if (interactiveList && interactiveList.length > 0) {
                            for (let item of interactiveList) {
                                this._colliderOut.push(item);
                                this._iteractive2PanelDict.set(item, panel);
                            }
                        }
                    }
                }


            }
        });

        return this._colliderOut;
    }

    private pick(colliders: IUIInteractive[]): GUIHitInfo {
        this._ray = this._view.camera.screenPointToRay(Engine3D.inputSystem.mouseX, Engine3D.inputSystem.mouseY);
        let screenPos = new Vector2(Engine3D.inputSystem.mouseX, Engine3D.inputSystem.mouseY);
        let screenSize = new Vector2(webGPUContext.canvas.clientWidth, webGPUContext.canvas.clientHeight);

        let hitInfo: GUIHitInfo;
        for (const iterator of colliders) {
            if (iterator.interactive && iterator.enable && iterator.interactiveVisible) {
                let panel = this._iteractive2PanelDict.get(iterator);
                hitInfo = iterator.rayPick(this._ray, panel, screenPos, screenSize);
                if (hitInfo) {
                    hitInfo.collider = iterator;
                    return hitInfo;
                }
            }
        }

        return null;
    }
}
