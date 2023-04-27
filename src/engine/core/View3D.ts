import { Engine3D } from "../Engine3D";
import { CEventListener } from "../event/CEventListener";
import { Graphic3D } from "../gfx/renderJob/passRenderer/graphic/Graphic3DRender";
import { PickFire } from "../io/PickFire";
import { Vector4 } from "../math/Vector4";
import { Camera3D } from "./Camera3D";
import { Scene3D } from "./Scene3D";

export class View3D extends CEventListener {
    private _camera: Camera3D;
    private _scene: Scene3D;
    private _viewPort: Vector4;
    private _enablePick: boolean = false;
    public pickFire: PickFire;

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
    }
    public get camera(): Camera3D {
        return this._camera;
    }
    public set camera(value: Camera3D) {
        this._camera = value;
    }
    public get viewPort(): Vector4 {
        return this._viewPort;
    }
    public set viewPort(value: Vector4) {
        this._viewPort = value;
    }

    public get graphic3D(): Graphic3D {
        return Engine3D.getRenderJob(this).graphic3D;
    }

}