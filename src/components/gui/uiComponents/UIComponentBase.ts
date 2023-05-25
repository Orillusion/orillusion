import { ComponentBase } from "../../ComponentBase";
import { GUIQuad } from "../core/GUIQuad";
import { UITransform } from "./UITransform";

export class UIComponentBase extends ComponentBase {
    protected _uiTransform: UITransform;
    protected _visible: boolean = true;
    protected readonly _exlusiveQuads: GUIQuad[] = [];

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
        this._uiTransform.setNeedUpdateUIPanel();
    }

    protected onUITransformVisible?(visible: boolean): void;
    protected onUIComponentVisible?(visible: boolean): void;
    protected onTransformResize?(): void;

    public destroy() {
        this.detachQuads();
        this._uiTransform.setNeedUpdateUIPanel();
        super.destroy();
    }

    protected attachQuad(quad: GUIQuad): this {
        this._exlusiveQuads.push(quad);
        this._uiTransform.quads.push(quad);
        return this;
    }

    protected detachQuads(): this {
        let allQuads = this._uiTransform.quads;
        while (this._exlusiveQuads.length > 0) {
            let quad = this._exlusiveQuads.shift();
            if (quad) {
                quad.sprite = null;
                GUIQuad.quadPool.pushBack(quad);
                let index = allQuads.indexOf(quad);
                if (index >= 0) {
                    allQuads.splice(index, 1);
                }
            }
        }
        return this;
    }

    public copyComponent(from: this): this {
        this.visible = from.visible;
        return this;
    }
}
