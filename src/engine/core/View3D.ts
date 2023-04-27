import { Engine3D, Graphic3D, Object3D, PickUI, UICanvas } from "../..";
import { CEventListener } from "../event/CEventListener";
import { PickFire } from "../io/PickFire";
import { Vector4 } from "../math/Vector4";
import { Camera3D } from "./Camera3D";
import { Scene3D } from "./Scene3D";

export class View3D extends CEventListener {
    private _camera: Camera3D;
    private _scene: Scene3D;
    private _viewPort: Vector4;
    private _enablePick: boolean = false;
    public pickUI: PickUI;
    public pickFire: PickFire;
    public canvas: UICanvas;

    constructor(x: number = 0, y: number = 0, width: number = 0, height: number = 0) {
        super();
        this._viewPort = new Vector4(x, y, width, height);
        this.enablePick = true;
    }

    public get enablePick(): boolean {
        return this._enablePick;
    }

    public set enablePick(value: boolean) {
        if (this._enablePick != value) {
            this.pickFire = new PickFire(this);
            this.pickFire.start();
        }
        this._enablePick = value;
    }

    public get scene(): Scene3D {
        return this._scene;
    }
    public set scene(value: Scene3D) {
        this._scene = value;
        value.view = this;

        if (value && this.canvas)
            value.addChild(this.canvas.object3D);
    }
    public get camera(): Camera3D {
        return this._camera;
    }
    public set camera(value: Camera3D) {
        this._camera = value;

        if (this.canvas)
            this.canvas.camera = this.camera;
    }
    public get viewPort(): Vector4 {
        return this._viewPort;
    }
    public set viewPort(value: Vector4) {
        this._viewPort = value;
    }

    public enableGUI(): UICanvas {
        let obj = new Object3D();
        obj.name = 'GUIManager';
        obj.serializeTag = 'dont-serialize';
        this.canvas = obj.addComponent(UICanvas);
        this.canvas.camera = this.camera;
        this.scene.addChild(obj);

        this.pickUI = new PickUI();
        this.pickUI.init(this);

        return this.canvas;
    }

    public disableGUI() {
        if (this.canvas.transform.parent) {
            this.canvas.transform.parent.object3D.removeChild(this.canvas.object3D);
        }
    }

    public get graphic3D(): Graphic3D {
        return Engine3D.getRenderJob(this).graphic3D;
    }

}