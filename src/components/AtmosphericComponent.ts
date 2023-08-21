import { AtmosphericScatteringSky, AtmosphericScatteringSkySetting } from "../textures/AtmosphericScatteringSky";
import { Transform } from "./Transform";
import { SkyRenderer } from "./renderer/SkyRenderer";

class HistoryData {
    public rotateX: number;
    public rotateY: number;

    public sunX: number;
    public sunY: number;

    constructor() {
        this.reset();
    }

    public reset(): this {
        this.rotateX = this.rotateY = this.sunX = this.sunY = Number.MAX_VALUE;
        return this;
    }

    public isRotateChange(rx: number, ry: number): boolean {
        return Math.abs(this.rotateX - rx) >= 0.001 || Math.abs(this.rotateY - ry) >= 0.001;
    }

    public isSkyChange(x: number, y: number): boolean {
        return Math.abs(this.sunX - x) >= 0.001 || Math.abs(this.sunY - y) >= 0.001;
    }

    public save(x: number, y: number, rx: number, ry: number): this {
        this.sunX = x;
        this.sunY = y;
        this.rotateX = rx;
        this.rotateY = ry;

        return this;
    }
}

/**
 *
 * Atmospheric Sky Box Component
 * @group Components
 */
export class AtmosphericComponent extends SkyRenderer {

    private _atmosphericScatteringSky: AtmosphericScatteringSky;
    private _onChange: boolean = true;
    private _relatedTransform: Transform;
    private _historyData: HistoryData;
    public get sunX() {
        return this._atmosphericScatteringSky.setting.sunX;
    }

    public set sunX(value) {
        if (this._atmosphericScatteringSky.setting.sunX != value) {
            this._atmosphericScatteringSky.setting.sunX = value;
            this._onChange = true;
        }
    }

    public get sunY() {
        return this._atmosphericScatteringSky.setting.sunY;
    }

    public set sunY(value) {
        if (this._atmosphericScatteringSky.setting.sunY != value) {
            this._atmosphericScatteringSky.setting.sunY = value;
            this._onChange = true;
        }
    }

    public get eyePos() {
        return this._atmosphericScatteringSky.setting.eyePos;
    }

    public set eyePos(value) {
        if (this._atmosphericScatteringSky.setting.eyePos != value) {
            this._atmosphericScatteringSky.setting.eyePos = value;
            this._onChange = true;
        }
    }

    public get sunRadius() {
        return this._atmosphericScatteringSky.setting.sunRadius;
    }

    public set sunRadius(value) {
        if (this._atmosphericScatteringSky.setting.sunRadius != value) {
            this._atmosphericScatteringSky.setting.sunRadius = value;
            this._onChange = true;
        }
    }

    public get sunRadiance() {
        return this._atmosphericScatteringSky.setting.sunRadiance;
    }

    public set sunRadiance(value) {
        if (this._atmosphericScatteringSky.setting.sunRadiance != value) {
            this._atmosphericScatteringSky.setting.sunRadiance = value;
            this._onChange = true;
        }
    }

    public get sunBrightness() {
        return this._atmosphericScatteringSky.setting.sunBrightness;
    }

    public set sunBrightness(value) {
        if (this._atmosphericScatteringSky.setting.sunBrightness != value) {
            this._atmosphericScatteringSky.setting.sunBrightness = value;
            this._onChange = true;
        }
    }

    public get displaySun() {
        return this._atmosphericScatteringSky.setting.displaySun;
    }

    public set displaySun(value) {
        if (this._atmosphericScatteringSky.setting.displaySun != value) {
            this._atmosphericScatteringSky.setting.displaySun = value;
            this._onChange = true;
        }
    }


    public init(): void {
        super.init();
        this._historyData = new HistoryData();
        this._atmosphericScatteringSky = new AtmosphericScatteringSky(new AtmosphericScatteringSkySetting());

        let view3D = this.transform.view3D;
        let scene = this.transform.scene3D;
        this.map = this._atmosphericScatteringSky;
        scene.envMap = this._atmosphericScatteringSky;
        this.onUpdate(view3D);
    }

    public start(view?: any): void {
        let scene = this.transform.scene3D;
        this.map = this._atmosphericScatteringSky;
        scene.envMap = this._atmosphericScatteringSky;
        super.start();
    }

    public get relativeTransform() {
        return this._relatedTransform;
    }

    public set relativeTransform(value: Transform) {
        this._relatedTransform = value;
        this._historyData.reset();
    }

    public onUpdate(view?: any) {
        if (this._relatedTransform) {
            this._relatedTransform.rotationZ = 0;
            if (this._historyData.isRotateChange(this._relatedTransform.rotationX, this._relatedTransform.rotationY)) {
                this.sunX = (this._relatedTransform.rotationY + 90) / 360//
                this.sunY = this._relatedTransform.rotationX / 180 + 0.5;
            } else if (this._historyData.isSkyChange(this.sunX, this.sunY)) {
                this._relatedTransform.rotationY = this.sunX * 360 - 90;
                this._relatedTransform.rotationX = (this.sunY - 0.5) * 180;
            }
            this._historyData.save(this.sunX, this.sunY, this._relatedTransform.rotationX, this._relatedTransform.rotationY);
        }

        if (this._onChange) {
            this._onChange = false;
            this._atmosphericScatteringSky.apply();
        }

    }

    public destroy(force?: boolean): void {
        super.destroy(force);
        this._atmosphericScatteringSky.destroy();
        this._atmosphericScatteringSky = null;
        this._onChange = null;
    }
}
