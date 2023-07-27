import { UIComponentBase } from './UIComponentBase';
import { IUIInteractive, UIInteractiveStyle } from "./IUIInteractive";
import { Vector2 } from '../../../math/Vector2';
import { Ray } from '../../../math/Ray';
import { GUIPickHelper } from '../GUIPickHelper';
import { Object3D } from '../../../core/entities/Object3D';
import { Vector3 } from '../../../math/Vector3';
import { UIPanel } from './UIPanel';
import { HitInfo } from '../../shape/ColliderShape';

/**
 * The basic class of interactive GUI component
 * @group GPU GUI
 */
export class UIInteractive extends UIComponentBase implements IUIInteractive {
    protected _style: UIInteractiveStyle = UIInteractiveStyle.NORMAL;
    protected _interactive: boolean = false;

    public set interactive(value: boolean) {
        this._interactive = value;
    }

    public get interactive(): boolean {
        return this._interactive;
    }

    public set mouseStyle(value: UIInteractiveStyle) {
        this._style = value;
    }

    public get interactiveVisible(): boolean {
        return this._uiTransform.globalVisible && this._visible;
    }

    init(param?: any) {
        super.init(param);
        this._uiTransform.addUIInteractive(this);
    }

    public destroy() {
        this._uiTransform.removeUIInteractive(this);
        super.destroy();
    }

    public rayPick(ray: Ray, panel: UIPanel, screenPos: Vector2, screenSize: Vector2): HitInfo {
        return GUIPickHelper.rayPick(ray, screenPos, screenSize, panel.space, this._uiTransform, panel.transform.worldMatrix);
    }

    public cloneTo(obj: Object3D) {
        let component = obj.getOrAddComponent(UIInteractive);
        component.copyComponent(this);
    }

    public copyComponent(from: this): this {
        super.copyComponent(from);
        this.enable = from._enable;
        this.interactive = from._interactive;
        this.mouseStyle = from._style;
        return this;
    }
}
