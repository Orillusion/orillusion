import { UIComponentBase } from "./UIComponentBase";
import { GUIQuad } from "../core/GUIQuad";

/**
 * The basic class of render able GUI component
 * @group GPU GUI
 */
export class UIRenderAble extends UIComponentBase {
    protected _mainQuads: GUIQuad[];
    protected _shadowRender: UIRenderAble;
    protected _shadowSource: UIRenderAble;
    public isUIShadow?: boolean;
    public isShadowless?: boolean;//no shadow
    public needUpdateShadow: boolean;

    init(param?: any): void {
        super.init?.(param);
        this._mainQuads = [];
    }

    public destroy() {
        this.detachQuads();
        this._shadowRender?.setShadowSource(null);
        this._shadowSource?.setShadowRenderer(null);
        super.destroy();
        this._shadowRender = null;
        this._shadowSource = null;
    }

    public start(): void {
        super.start?.();
        if (this.isUIShadow) {
            this.autoBindShadow(null, this);
        } else if (!this.isShadowless) {
            this.autoBindShadow(this, null);
        }
        this.setShadowDirty();
    }

    protected setShadowDirty(): void {
        this._shadowRender && (this._shadowRender.needUpdateShadow = true);
    }

    public get mainQuads() {
        return this._mainQuads;
    }

    public setShadowRenderer(value: UIRenderAble) {
        this._shadowRender = value;
    }

    public setShadowSource(value: UIRenderAble) {
        this._shadowSource = value;
    }

    public getShadowRender(): UIRenderAble {
        return this._shadowRender;
    }

    protected autoBindShadow(source: UIRenderAble, shadow: UIRenderAble): boolean {
        let values = this.object3D.components.values();
        if (!source) {
            for (let i of values) {
                let item = i as any as UIRenderAble;
                if (item.isShadowless || item.isUIShadow) continue;
                if (item.mainQuads) {
                    source = item;
                    break;
                }
            }
        }

        if (!shadow) {
            for (let i of values) {
                let item = i as any as UIRenderAble;
                if (item.isUIShadow && item.mainQuads) {
                    shadow = item;
                    break;
                }
            }
        }

        if (source && shadow) {
            source.setShadowRenderer(shadow);
            shadow.setShadowSource(source);
            return true;
        }
        return false;
    }

    protected recycleQuad(quad?: GUIQuad): GUIQuad {
        if (quad && this._mainQuads) {
            let index = this._mainQuads.indexOf(quad);
            if (index >= 0) {
                this._mainQuads.splice(index, 1);
                GUIQuad.recycleQuad(quad);
            } else {
                quad = null;
            }
        }
        return quad;
    }

    protected attachQuad(quad: GUIQuad): this {
        this._mainQuads && this._mainQuads.push(quad);
        return this;
    }

    protected detachQuads(): this {
        if (this._mainQuads) {
            while (this._mainQuads.length > 0) {
                let quad = this._mainQuads.shift();
                this.recycleQuad(quad);
            }
        }

        return this;
    }

    public copyComponent(from: this): this {
        super.copyComponent(from);
        this.isUIShadow = from.isUIShadow;
        this.isShadowless = from.isShadowless;
        return this;
    }
}
