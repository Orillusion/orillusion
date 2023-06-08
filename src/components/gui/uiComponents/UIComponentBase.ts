import { ComponentBase } from "../../ComponentBase";
import { UITransform } from "./UITransform";

/**
 * The basic component for all GUI component
 * @group GPU GUI
 */
export class UIComponentBase extends ComponentBase {
    protected _uiTransform: UITransform;
    protected _visible: boolean = true;
    public destroy() {
        this._uiTransform.setNeedUpdateUIPanel();
        super.destroy();
    }

    public get uiTransform() {
        return this._uiTransform;
    }

    public get visible(): boolean {
        return this._visible;
    }

    public set visible(value: boolean) {
        if (this._visible != value) {
            this._visible = value;
            this.onUIComponentVisible?.(this._visible);
        }
    }

    init(param?: any) {
        super.init?.(param);
        this._uiTransform = this.object3D.getOrAddComponent(UITransform);
        this._uiTransform.setNeedUpdateUIPanel();
    }

    protected onUITransformVisible?(visible: boolean): void;
    protected onUIComponentVisible?(visible: boolean): void;
    protected onTransformResize?(): void;

    public copyComponent(from: this): this {
        this.visible = from.visible;
        return this;
    }
}
