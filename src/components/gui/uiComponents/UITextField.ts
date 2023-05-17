import { Object3D } from '../../../core/entities/Object3D';
import { Color } from '../../../math/Color';
import { GUIQuad } from '../core/GUIQuad';
import { TextAnchor, TextFieldLayout, TextFieldLine } from './TextFieldLayout';
import { UIComponentBase } from './UIComponentBase';

export class UITextField extends UIComponentBase {
    private _font: string = '微软雅黑';
    private _fontSize: number = 14;
    private _originSize: number = 42;
    private _alignment: TextAnchor = 0;
    private _lineSpacing: number = 1;
    private _text: string = '';
    private _textQuads: GUIQuad[] = [];
    private readonly _color: Color = new Color(1, 1, 1, 1);

    constructor() {
        super();
    }

    cloneTo(obj: Object3D) {
        let component = obj.getOrAddComponent(UITextField);
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
            this.reLayout();
        }
    }

    public get text(): string {
        return this._text;
    }

    public set text(value: string) {
        if (this._text != value) {
            if (!value) value = '';
            this._text = value;
            this.reLayout();
        }
    }

    public clean(): this {
        while (this._textQuads.length > 0) {
            let quad = this._textQuads.shift();
            quad.sprite = null;
            GUIQuad.quadPool.pushBack(quad);
        }
        return this;
    }

    private textLine: TextFieldLine[] = null;
    private layoutProxy: TextFieldLayout = new TextFieldLayout();

    private reLayout() {
        this.clean();
        this.textLine = this.layoutProxy.layout(this);
        for (let i: number = 0, count = this.textLine.length; i < count; i++) {
            let line = this.textLine[i];
            for (let j: number = 0, count = line.quadList.length; j < count; j++) {
                let quad = line.quadList[j];
                if (quad) {
                    this.addQuad(quad);
                    this._textQuads.push(quad);
                }
            }
        }
        //refresh color;
        this.color = this._color;
        this.uiTransform.markNeedsUpdateGUIMesh();
    }

    protected onTransformResize() {
        super.onTransformResize();
        this.reLayout();
    }

    public get color(): Color {
        return this._color;
    }

    public set color(value: Color) {
        this._color.copyFrom(value);
        for (let quad of this._textQuads) {
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
            this.reLayout();
        }
    }

    public get lineSpacing(): number {
        return this._lineSpacing;
    }

    public set lineSpacing(value: number) {
        if (this._lineSpacing != value) {
            this._lineSpacing = value;
            this.reLayout();
        }
    }
}


