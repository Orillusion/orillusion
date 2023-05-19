import { ComponentBase } from "../../ComponentBase";
import { GUIQuad } from "../core/GUIQuad";
import { UITransform } from "./UITransform";

export class UIComponentBase extends ComponentBase {
    protected _uiTransform: UITransform;

    public get uiTransform() {
        return this._uiTransform;
    }

    init(param?: any) {
        super.init(param);
        this._uiTransform = this.object3D.getOrAddComponent(UITransform);
        this._uiTransform.eventDispatcher.addEventListener(UITransform.Resize, this.onTransformResize, this);
    }

    //Called when component size changes
    protected onTransformResize(): void { }

    public destroy() {
        this._uiTransform.eventDispatcher.removeEventListener(UITransform.Resize, this.onTransformResize, this);
        super.destroy();
    }

    public addQuad(quad: GUIQuad): this {
        this._uiTransform.quads.push(quad);
        return this;
    }

    public clean(): this {
        this._uiTransform.quads.length = 0;
        return this;
    }
}
