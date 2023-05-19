import { Object3D } from "../../../core/entities/Object3D";
import { CEvent } from "../../../event/CEvent";
import { Matrix3 } from "../../../math/Matrix3";
import { ComponentBase } from "../../ComponentBase";
import { GUIMesh } from "../core/GUIMesh";
import { GUIQuad } from "../core/GUIQuad";
import { IUIInteractive } from "./IUIInteractive";
import { UIPanel } from "./UIPanel";
import { ViewPanel } from "./ViewPanel";
import { WorldPanel } from "./WorldPanel";

let help_matrix3: Matrix3;

export class UITransform extends ComponentBase {
    public useParentPivot: boolean = false;
    public parent: UITransform;
    public pivotX: number = 0.5;
    public pivotY: number = 0.5;

    private _width: number = 1;
    private _height: number = 1;
    public guiMesh: GUIMesh;

    public static readonly Resize: string = 'GUITransformResize';

    private _resizeEvent = new CEvent(UITransform.Resize);

    protected _uiInteractiveList: IUIInteractive[];

    public get uiInteractiveList() {
        return this._uiInteractiveList;
    }

    public addUIInteractive(item: IUIInteractive): this {
        this._uiInteractiveList ||= [];
        this._uiInteractiveList.push(item);
        return this;
    }

    public removeUIInteractive(item: IUIInteractive): IUIInteractive {
        if (this._uiInteractiveList) {
            let index = this._uiInteractiveList.indexOf(item);
            if (index >= 0) {
                this._uiInteractiveList.slice(index, 1);
                return item;
            }
        }
        return null;
    }

    public onParentChange(parent: Object3D) {
        this.parent = parent ? parent.getComponent(UITransform) : null;
    }

    public get width() {
        return this._width;
    }

    public get height() {
        return this._height;
    }

    public resize(width: number, height: number): boolean {
        if (this._width != width || this._height != height) {
            this._width = width;
            this._height = height;
            this.onChange = true;
            this.eventDispatcher.dispatchEvent(this._resizeEvent);
            return true;
        }
        return false;
    }

    public get x() {
        return this.object3D.x;
    }

    public set x(value: number) {
        if (value != this.object3D.x) {
            this.object3D.x = value;
            this.onChange = true;
        }
    }

    public get y() {
        return this.object3D.y;
    }

    public set y(value: number) {
        if (value != this.object3D.y) {
            this.object3D.y = value;
            this.onChange = true;
        }
    }

    public get z() {
        return this.object3D.z;
    }

    public set z(value: number) {
        if (value != this.object3D.z) {
            this.object3D.z = value;
            this.onChange = true;
        }
    }

    public get scaleX(): number {
        return this.object3D.scaleX;
    }

    public set scaleX(value: number) {
        this.onChange = true;
        this.object3D.scaleX = value;
    }

    public get scaleY(): number {
        return this.object3D.scaleY;
    }

    public set scaleY(value: number) {
        this.onChange = true;
        this.object3D.scaleY = value;
    }

    public quads: GUIQuad[] = [];

    private _localMatrix: Matrix3;
    private _worldMatrix: Matrix3;

    private _onChange: boolean = true;
    public needUpdateQuads = true;

    public get onChange() {
        return this._onChange;
    }

    private _tempTransforms: UITransform[] = [];

    public set onChange(value: boolean) {
        if (this._onChange != value) {
            if (value) {
                this._tempTransforms.length = 0;
                //notice: The component list contains corresponding components that belong to the current Object 3D
                let components = this.object3D.getComponents(UITransform, this._tempTransforms, true);
                for (let component of components) {
                    component['_onChange'] = true;
                    component.needUpdateQuads = true;
                }
            }
        }
    }

    onEnable(): void {
        this.markNeedsUpdateGUIMesh();
        this.onChange = true;
    }

    onDisable(): void {
        this.markNeedsUpdateGUIMesh();
        this.onChange = true;
    }

    public markNeedsUpdateGUIMesh(): void {
        let panel: UIPanel;
        panel = this.object3D.getComponentFromParent(WorldPanel);
        if (!panel) {
            panel = this.object3D.getComponentFromParent(ViewPanel);
        }
        if (panel) {
            panel.needUpdateGeometry = true;
        }
    }

    constructor() {
        super();
        this._localMatrix = new Matrix3();
        this._worldMatrix = new Matrix3();
    }

    public cloneTo(obj: Object3D) {
        let component = obj.getOrAddComponent(UITransform);

        component.x = this.x;
        component.y = this.y;
        component.z = this.z;

        component.resize(this.width, this.height);

        component.pivotX = this.pivotX;
        component.pivotY = this.pivotY;

        component.scaleX = this.scaleX;
        component.scaleY = this.scaleY;
    }

    public matrix(): Matrix3 {
        let mtx = this._localMatrix;
        let rot = this.object3D.rotationZ;
        mtx.updateScaleAndRotation(this.object3D.scaleX, this.object3D.scaleY, rot, rot);
        mtx.tx = this.object3D.x;
        mtx.ty = this.object3D.y;

        //if (this.pivotX != 0 || this.pivotY!= 0 )
        //    m.$preMultiplyInto(help_mat3_0.setTo(1, 0, 0, 1, -this.pivotX / 1.5, -this.pivotY / 1.5), m);

        if (this.pivotX != 0.5 || this.pivotY != 0.5) {
            help_matrix3 ||= new Matrix3().identity();
            mtx.mul(help_matrix3.setTo(1, 0, 0, 1, -(this.pivotX - 0.5) * this.width, -(this.pivotY - 0.5) * this.height));
        }

        // if (this.useParentPivot) {
        //   m.$preMultiplyInto(help_mat3_0.setTo(1, 0, 0, 1, uiTransParent.pivotX, uiTransParent.pivotY), m);
        // }
        return mtx;
    }

    public getWorldMatrix(): Matrix3 {
        let self = this;
        let worldMtx = self._worldMatrix;
        if (!this._onChange)
            return worldMtx;

        worldMtx.copyFrom(self.matrix());
        if (self.parent) {
            worldMtx.mul(self.parent.getWorldMatrix());
        }
        self._onChange = false;
        return worldMtx;
    }
}
