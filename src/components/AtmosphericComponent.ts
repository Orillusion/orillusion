import { Color, View3D } from "..";
import { AtmosphericScatteringSky, AtmosphericScatteringSkySetting } from "../textures/AtmosphericScatteringSky";
import { SkyRenderer } from "./renderer/SkyRenderer";

/**
 *
 * Atmospheric Sky Box Component
 * @group Components
 */
export class AtmosphericComponent extends SkyRenderer {

    private _atmosphericScatteringSky: AtmosphericScatteringSky;
    private _onChange: boolean = true;

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

    // public get skyColor(): Color {
    //     return this._atmosphericScatteringSky.setting.skyColor;
    // }

    // public set skyColor(value: Color) {
    //     this._atmosphericScatteringSky.setting.skyColor = value;
    //     this._onChange = true;
    // }

    public init(): void {
        super.init();
        this._atmosphericScatteringSky = new AtmosphericScatteringSky(new AtmosphericScatteringSkySetting());
    }

    public start(): void {
        let scene = this.transform.scene3D;
        this.map = this._atmosphericScatteringSky;
        scene.envMap = this._atmosphericScatteringSky;
        super.start();
    }

    public onUpdate(view?: View3D) {
        if (this._onChange) {
            console.log("change sky");

            this._onChange = false;
            this._atmosphericScatteringSky.apply();
        }
    }
}
