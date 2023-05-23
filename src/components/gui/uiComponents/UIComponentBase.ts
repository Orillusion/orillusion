import { ComponentBase } from "../../ComponentBase";
import { GUIQuad } from "../core/GUIQuad";
import { UITransform } from "./UITransform";

export class UIComponentBase extends ComponentBase {
    protected _uiTransform: UITransform;
    protected _visible: boolean = true;
    public get uiTransform() {
        return this._uiTransform;
    }

    public get visible(): boolean {
        return this._visible;
    }

    public set visible(value: boolean) {
        if (this._visible != value) {
            this._visible = value;
            this.onUIComponentVisible && this.onUIComponentVisible(this._visible);
        }
    }

    init(param?: any) {
        super.init(param);
        this._uiTransform = this.object3D.getOrAddComponent(UITransform);
        this._uiTransform.eventDispatcher.addEventListener(UITransform.Resize, this.onTransformResize, this);
    }

    protected onUITransformVisible?(visible: boolean): void;
    protected onUIComponentVisible?(visible: boolean): void;

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

    public copyComponent(from: this): this {
        this.visible = from.visible;
        return this;
    }
}
