import { BoundingBox } from '../../core/bound/BoundingBox';
import { EntityCollect } from '../../gfx/renderJob/collect/EntityCollect';
import { Color } from '../../math/Color';
import { Vector3 } from '../../math/Vector3';
import { ComponentBase } from '../ComponentBase';
import { Transform } from '../Transform';
import { GILighting } from './GILighting';
import { LightData } from './LightData';
import { ShadowLightsCollect } from '../../gfx/renderJob/collect/ShadowLightsCollect';
import { IESProfiles } from './IESProfiles';
import { ILight } from './ILight';

/**
 * @internal
 * @group Lights
 */
export class LightBase extends ComponentBase implements ILight {
    /**
     * light name
     */
    public name: string;
    /**
     * light size
     */
    public size: number = 1;

    /**
     * light source data
     */
    public lightData: LightData;

    /**
     * fix light direction
     */
    public dirFix: number = 1;

    /**
     * Callback function when binding changes
     */
    public bindOnChange: () => void;

    public needUpdateShadow: boolean = true;

    /**
     * Whether to enable real-time rendering of shadows
     */
    public realTimeShadow: boolean = true;

    protected _castGI: boolean = false;
    protected _castShadow: boolean = false;
    private _iesProfiles: IESProfiles;

    constructor() {
        super();
    }

    public init(): void {
        this.transform.object3D.bound = new BoundingBox(new Vector3(), new Vector3());

        this.lightData = new LightData();
        this.lightData.lightMatrixIndex = this.transform.worldMatrix.index;
    }

    protected onChange() {
        if (this.bindOnChange) this.bindOnChange();
        this.transform.object3D.bound.setFromCenterAndSize(this.transform.worldPosition, new Vector3(this.size, this.size, this.size));
        if (this._castGI) {
            EntityCollect.instance.state.giLightingChange = true;
        }
        if (this._castShadow) {
            this.needUpdateShadow = true;
            ShadowLightsCollect.addShadowLight(this);
        } else {
            ShadowLightsCollect.removeShadowLight(this);
        }
    }

    public start(): void {
        this.transform.onScaleChange = () => this.onScaleChange();
        this.transform.onRotationChange = () => this.onRotChange();
        this.onRotChange();
        this.onScaleChange();
    }

    protected onRotChange() {
        if (this.dirFix == 1) {
            this.lightData.direction.copyFrom(this.transform.forward);
        } else {
            this.lightData.direction.copyFrom(this.transform.back);
        }
        this.lightData.lightTangent.copyFrom(this.transform.up);
        this.onChange();
    }

    protected onScaleChange() {
        this.onChange();
    }

    public onEnable(): void {
        this.onChange();
        EntityCollect.instance.addLight(this.transform.scene3D, this);
    }

    public onDisable(): void {
        this.onChange();
        EntityCollect.instance.removeLight(this.transform.scene3D, this);
    }

    public set iesProfiles(iesProfiles: IESProfiles) {
        this._iesProfiles = iesProfiles;
        this.lightData.iesIndex = iesProfiles.index;
        IESProfiles.use = true;
        this.onChange();
    }

    public get iesProfile(): IESProfiles {
        return this._iesProfiles;
    }

    /**
     * Get the red component of the lighting color
     */
    public get r(): number {
        return this.lightData.lightColor.r;
    }

    /**
     * Set the red component of the lighting color
     */
    public set r(value: number) {
        this.lightData.lightColor.r = value;
        this.onChange();
    }

    /**
     * Get the green component of the lighting color
     */
    public get g(): number {
        return this.lightData.lightColor.g;
    }

    /**
     * Set the green component of the lighting color
     */
    public set g(value: number) {
        this.lightData.lightColor.g = value;
        this.onChange();
    }

    /**
     * Get the blue component of the lighting color
     */
    public get b(): number {
        return this.lightData.lightColor.b;
    }
    /**
     * Set the blue component of the lighting color
     */
    public set b(value: number) {
        this.lightData.lightColor.b = value;
        this.onChange();
    }
    /**
     * Get light source color
     * @return Color
     */
    public get lightColor(): Color {
        return this.lightData.lightColor;
    }
    /**
     * Set light source color
     * @param Color
     */
    public set lightColor(value: Color) {
        this.lightData.lightColor = value;
        this.onChange();
    }
    /**
     * Get Illumination intensity of light source
     * @return number
     */
    public get intensity(): number {
        return this.lightData.intensity as number;
    }
    /**
     * Set Illumination intensity of light source
     * @param value
     */
    public set intensity(value: number) {
        this.lightData.intensity = value;
        this.onChange();
    }
    /**
     * get cast shadow
     * @return boolean
     *  */
    public get castShadow(): boolean {
        return this.lightData.castShadowIndex as number >= 0;
    }

    /**
     * get shadow index at shadow map list
     */
    public get shadowIndex(): number {
        return this.lightData.castShadowIndex as number;
    }
    /**
     * set cast shadow 
     * @param value is true , that can cast shadow
     *  */
    public set castShadow(value: boolean) {
        if (value) this.onChange();
    }

    /**
    * get gi is enable 
    * @return boolean
    *  */
    public get castGI(): boolean {
        return this._castGI;
    }
    /**
     * set gi is enable 
     * @param value  
     *  */
    public set castGI(value: boolean) {
        if (value) {
            GILighting.add(this);
        } else {
            GILighting.remove(this);
        }
        this._castGI = value;
        if (value) this.onChange();
    }

    /**
     * light source direction
     * @return Vector3
     *  */
    public get direction(): Vector3 {
        return this.lightData.direction;
    }

    public destroy(): void {
        this.bindOnChange = null;
        this.transform.eventDispatcher.removeEventListener(Transform.ROTATION_ONCHANGE, this.onRotChange, this);
        this.transform.eventDispatcher.removeEventListener(Transform.SCALE_ONCHANGE, this.onScaleChange, this);
        super.destroy();
    }

}
