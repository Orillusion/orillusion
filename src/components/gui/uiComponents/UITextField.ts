import { Object3D } from '../../../core/entities/Object3D';
import { Color } from '../../../math/Color';
import { TextAnchor, TextFieldLayout, TextFieldLine } from './TextFieldLayout';
import { UIComponentBase } from './UIComponentBase';

export class UITextField extends UIComponentBase {
    private _font: string = '微软雅黑';
    private _fontSize: number = 14;
    private _originSize: number = 42;
    private _alignment: TextAnchor = 0;
    private _lineSpacing: number = 1;
    private _text: string = '';
    private readonly _color: Color = new Color(1, 1, 1, 1);

    constructor() {
        super();
    }

    cloneTo(obj: Object3D) {
        let component = obj.getOrAddComponent(UITextField);
        component.copyComponent(this);
        component._font = this._font;
        component._fontSize = this._fontSize;
        component._originSize = this._originSize;
        component._alignment = this._alignment;
        component._lineSpacing = this._lineSpacing;
        component._color.copyFrom(this._color);
        component.text = this.text;
    }

    public get originSize(): number {
        return this._originSize;
    }

    public get font(): string {
        return this._font;
    }

    public set font(value: string) {
        this._font = value;
    }

    public get fontSize(): number {
        return this._fontSize;
    }

    public set fontSize(value: number) {
        if (this._fontSize != value) {
            this._fontSize = value;
            this.layoutText();
        }
    }

    public get text(): string {
        return this._text;
    }

    public set text(value: string) {
        if (this._text != value) {
            if (!value) value = '';
            this._text = value;
            this.layoutText();
        }
    }

    private textLine: TextFieldLine[] = null;
    private layoutProxy: TextFieldLayout = new TextFieldLayout();

    private layoutText() {
        this.detachQuads();
        this.textLine = this.layoutProxy.layout(this);
        for (let i: number = 0, count = this.textLine.length; i < count; i++) {
            let line = this.textLine[i];
            for (let j: number = 0, count = line.quadList.length; j < count; j++) {
                let quad = line.quadList[j];
                if (quad) {
                    this.attachQuad(quad);
                }
            }
        }
        //refresh color;
        this.color = this._color;
        this._uiTransform.setNeedUpdateUIPanel();
        this.onUIComponentVisible && this.onUIComponentVisible(this._visible);
    }

    protected onUIComponentVisible(visible: boolean): void {
        this.applyComponentVisible();
    }

    protected onUITransformVisible(visible: boolean): void {
        this.applyComponentVisible();
    }

    private applyComponentVisible(): void {
        let isHidden = !this._visible || !this._uiTransform.globalVisible;
        for (let quad of this._exlusiveQuads) {
            quad && (quad.visible = !isHidden);
        }
    }

    protected onTransformResize() {
        this.layoutText();
    }

    public get color(): Color {
        return this._color;
    }

    public set color(value: Color) {
        this._color.copyFrom(value);
        for (let quad of this._exlusiveQuads) {
            quad.color.copyFrom(value);
            quad.onChange = true;
        }
    }

    public get alignment(): TextAnchor {
        return this._alignment;
    }

    public set alignment(value: TextAnchor) {
        if (this._alignment != value) {
            this._alignment = value;
            this.layoutText();
        }
    }

    public get lineSpacing(): number {
        return this._lineSpacing;
    }

    public set lineSpacing(value: number) {
        if (this._lineSpacing != value) {
            this._lineSpacing = value;
            this.layoutText();
        }
    }

    public destroy(): void {
        this.detachQuads();
        super.destroy();
    }
}


