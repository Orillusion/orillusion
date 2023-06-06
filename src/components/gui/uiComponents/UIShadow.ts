import { View3D } from "../../../core/View3D";
import { Object3D } from "../../../core/entities/Object3D";
import { Color } from "../../../math/Color";
import { clamp } from "../../../math/MathUtil";
import { Vector2 } from "../../../math/Vector2";
import { GUIQuad } from "../core/GUIQuad";
import { UIRenderAble } from "./UIRenderAble";

/**
 * The shadow component for gui
 * @group GPU GUI
 */
export class UIShadow extends UIRenderAble {
    private _shadowQuality: number = 1;
    private _shadowOffset: Vector2;
    private _shadowRadius: number;
    private _shadowColor: Color;
    private _subShadowColor: Color;

    public needUpdateShadow: boolean = false;

    public init(param?: any): void {
        super.init?.(param);
        this._shadowRadius = 2;
        this._shadowQuality = 1;
        this._shadowOffset = new Vector2(4, -4);
        this._shadowColor = new Color(0.1, 0.1, 0.1, 0.8);
        this._subShadowColor = this._shadowColor.clone();
        this.isUIShadow = true;
    }

    public cloneTo(obj: Object3D) {
        let component = obj.getOrAddComponent(UIShadow);
        component.copyComponent(this);
    }

    public copyComponent(from: this): this {
        super.copyComponent(this);
        this._shadowColor = from._shadowColor;
        this._shadowOffset = from._shadowOffset;
        this._shadowRadius = from._shadowRadius;
        this._shadowQuality = from.shadowQuality;
        return this;
    }

    public get shadowColor(): Color {
        return this._shadowColor;
    }

    public set shadowColor(value: Color) {
        this._shadowColor.copyFrom(value);
        this.needUpdateShadow = true;
    }

    public set shadowQuality(value: number) {
        value = clamp(value, 0, 4);
        if (this._shadowQuality != value) {
            this._shadowQuality = value;
            this.needUpdateShadow = true;
        }
    }
    public get shadowQuality() {
        return this._shadowQuality;
    }

    public set shadowOffset(value: Vector2) {
        this._shadowOffset = value;
        this.needUpdateShadow = true;
    }

    public get shadowOffset(): Vector2 {
        this._shadowOffset ||= new Vector2(4, -4);
        return this._shadowOffset;
    }

    public set shadowRadius(value: number) {
        if (this._shadowRadius != value) {
            this._shadowRadius = value;
            this.applyShadow();
        }
    }

    public get shadowRadius(): number {
        return this._shadowRadius;
    }

    public onUpdate(view?: View3D) {
        if (this.needUpdateShadow) {
            this.applyShadow();
            this.needUpdateShadow = false;
        }
    }

    private applyShadow(): void {
        //clear
        this.detachQuads();
        //update shadow
        if (this._shadowSource) {
            if (this._shadowQuality > 0) {
                let quads = this._shadowSource.mainQuads;
                if (quads.length > 0) {
                    for (let quad of quads) {
                        this.createQuadShadow(quad);
                    }
                }
            }
        }

        this._uiTransform.setNeedUpdateUIPanel();
    }

    private createQuadShadow(sourceQuad: GUIQuad) {
        let shadowCount = this._shadowQuality;
        let pi2 = Math.PI * 2;
        this._subShadowColor.copyFrom(this._shadowColor);
        this._subShadowColor.a = 1 / Math.max(1, shadowCount);
        for (let i = 0; i < shadowCount; i++) {
            let item = GUIQuad.spawnQuad();
            let offsetX = 0;
            let offsetY = 0;
            if (i == 0) {
                item.color = this._shadowColor;
            } else {
                let angle = pi2 * (i - 1) / (shadowCount - 1);

                offsetX = Math.sin(angle) * this._shadowRadius;
                offsetY = Math.cos(angle) * this._shadowRadius;
                item.color = this._subShadowColor;
            }

            item.setXY(offsetX + this._shadowOffset.x + sourceQuad.x, offsetY + this._shadowOffset.y + sourceQuad.y);
            item.setSize(sourceQuad.width, sourceQuad.height);
            item.sprite = sourceQuad.sprite;
            item.visible = sourceQuad.visible;
            item.imageType = sourceQuad.imageType;
            this.attachQuad(item);
        }
    }

}