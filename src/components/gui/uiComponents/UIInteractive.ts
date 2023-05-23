import { UIComponentBase } from './UIComponentBase';
import { IUIInteractive, UIInteractiveStyle } from "./IUIInteractive";
import { Vector2 } from '../../../math/Vector2';
import { Ray } from '../../../math/Ray';
import { GUIPickHelper } from '../GUIPickHelper';
import { Object3D } from '../../../core/entities/Object3D';
import { Vector3 } from '../../../math/Vector3';
// basic class of interactive GUI component
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

    public rayPick(ray: Ray, screenPos: Vector2, screenSize: Vector2): { intersect: boolean; intersectPoint?: Vector3; distance: number } {
        let mesh = this.uiTransform.guiMesh;
        return GUIPickHelper.rayPick(ray, screenPos, screenSize, mesh.space, this._uiTransform, mesh.transform.worldMatrix)
    }

    cloneTo(obj: Object3D) {
        let component = obj.getOrAddComponent(UIInteractive);
        component.copyComponent(this);
        component.enable = this.enable;
        component.interactive = this.interactive;
        component.mouseStyle = this._style;
    }
}
