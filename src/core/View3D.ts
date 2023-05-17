import { Object3D } from "..";
import { GUIPick } from "../components/gui/GUIPick";
import { GUICanvas } from "../components/gui/core/GUICanvas";
import { CEventListener } from "../event/CEventListener";
import { ShadowLightsCollect } from "../gfx/renderJob/collect/ShadowLightsCollect";
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
    private _enable: boolean = true;
    public pickFire: PickFire;
    public guiPick: GUIPick;
    public readonly canvasList: GUICanvas[];

    /**
    * Graphics renderers (lines, rectangles, etc.)
    */
    public graphic3D: Graphic3D;

    constructor(x: number = 0, y: number = 0, width: number = 0, height: number = 0) {
        super();
        this.canvasList = [];
        this._viewPort = new Vector4(x, y, width, height);
        this.enablePick = true;
        this.graphic3D = new Graphic3D();
    }

    public get enable(): boolean {
        return this._enable;
    }

    public set enable(value: boolean) {
        this._enable = value;
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

        ShadowLightsCollect.createBuffer(value);

        if (this.graphic3D)
            value.addChild(this.graphic3D);

        if (value) {
            this.canvasList.forEach(canvas => {
                canvas && value.addChild(canvas.object3D);
            });
        }
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

    public enableUICanvas(index: number = 0): GUICanvas {
        let canvas = this.canvasList[index];
        if (!canvas) {
            let obj = new Object3D();
            obj.name = 'Canvas ' + index;
            canvas = obj.addComponent(GUICanvas);
            this.canvasList[index] = canvas;
        }

        this.scene.addChild(canvas.object3D);

        if (!this.guiPick) {
            this.guiPick = new GUIPick();
            this.guiPick.init(this);
        }

        return canvas;
    }

    public disableUICanvas(index: number = 0) {
        let canvas = this.canvasList[index];
        if (canvas && canvas.object3D) {
            canvas.object3D.removeFromParent();
        }
    }

    // public get graphic3D(): Graphic3D {
    //     return Engine3D.getRenderJob(this).graphic3D;
    // }

}