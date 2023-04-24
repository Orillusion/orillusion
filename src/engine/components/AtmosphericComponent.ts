import { SkyRenderer } from "../..";
import { AtmosphericScatteringSky, AtmosphericScatteringSkySetting } from "../textures/AtmosphericScatteringSky";

/**
 *
 * Atmospheric Sky Box Component
 * @group Components
 */
export class AtmosphericComponent extends SkyRenderer {

    private _atmosphericScatteringSky: AtmosphericScatteringSky;

    public get sunX() {
        return this._atmosphericScatteringSky.setting.sunX;
    }

    public set sunX(value) {
        this._atmosphericScatteringSky.setting.sunX = value;
        this._atmosphericScatteringSky.apply();
    }

    public get sunY() {
        return this._atmosphericScatteringSky.setting.sunY;
    }

    public set sunY(value) {
        this._atmosphericScatteringSky.setting.sunY = value;
        this._atmosphericScatteringSky.apply();
    }

    public get eyePos() {
        return this._atmosphericScatteringSky.setting.eyePos;
    }

    public set eyePos(value) {
        this._atmosphericScatteringSky.setting.eyePos = value;
        this._atmosphericScatteringSky.apply();
    }

    public get sunRadius() {
        return this._atmosphericScatteringSky.setting.sunRadius;
    }

    public set sunRadius(value) {
        this._atmosphericScatteringSky.setting.sunRadius = value;
        this._atmosphericScatteringSky.apply();
    }

    public get sunRadiance() {
        return this._atmosphericScatteringSky.setting.sunRadiance;
    }

    public set sunRadiance(value) {
        this._atmosphericScatteringSky.setting.sunRadiance = value;
        this._atmosphericScatteringSky.apply();
    }

    public get sunBrightness() {
        return this._atmosphericScatteringSky.setting.sunBrightness;
    }

    public set sunBrightness(value) {
        this._atmosphericScatteringSky.setting.sunBrightness = value;
        this._atmosphericScatteringSky.apply();
    }

    public get displaySun() {
        return this._atmosphericScatteringSky.setting.displaySun;
    }

    public set displaySun(value) {
        this._atmosphericScatteringSky.setting.displaySun = value;
        this._atmosphericScatteringSky.apply();
    }

    protected init(): void {
        super.init();
        this._atmosphericScatteringSky = new AtmosphericScatteringSky(new AtmosphericScatteringSkySetting());
    }

    protected start(): void {
        let scene = this.transform.scene3D;
        this.map = this._atmosphericScatteringSky;
        scene.envMap = this._atmosphericScatteringSky;
        super.start();
    }

    protected onEnable(): void {

    }

    protected onDisable(): void {

    }

    public debug() {
    }
}
