import { Engine3D } from '../../Engine3D';
import { View3D } from '../../core/View3D';
import { Vector3 } from '../../math/Vector3';
import { UUID } from '../../util/Global';
import { LightBase } from './LightBase';
import { LightType } from './LightData';
/**
 *Point light source.
 *A single point light source that illuminates all directions.
 *A common example is to simulate the light emitted by a light bulb, where a point light source cannot create shadows.
 * @group Lights
 */
export class PointLight extends LightBase {

    constructor() {
        super();
    }

    public init(): void {
        super.init();
        this.lightData.lightType = LightType.PointLight;
        if (this.object3D.name == "") {
            this.object3D.name = "PointLight" + UUID();
        }
    }


    /**
     *
     * Get the range of the light source
     * @return {number}
     */
    public get range(): number {
        return this.lightData.range as number;
    }
    /**
     *
     * Set the range of the light source
     * @param {number}
     */
    public set range(value: number) {
        this.lightData.range = value;
        this.onChange();
    }

    /**
     *
     * Get the illumination distance of the light source
     * @type {number}
     * @memberof PointLight
     */
    public get at(): number {
        return this.lightData.linear as number;
    }

    /**
     *
     * Set the illumination distance of the light source
     * @param {value} It will decay linearly from the maximum value to the current light position at a distance of 0, 
     * with a default value of 0. This means that the intensity of the light will not decrease due to distance
     * @memberof PointLight
     */
    public set at(value: number) {
        this.lightData.linear = value;
        this.onChange();
    }

    /**
     * Get the radius to control the light
     */
    public get radius(): number {
        return this.lightData.radius as number;
    }

    /**
     * Set the radius of the control light
     */
    public set radius(value: number) {
        this.lightData.radius = value;
        this.onChange();
    }

    /**
     * Get the radius to control the light
     */
    public get quadratic(): number {
        return this.lightData.quadratic as number;
    }

    /**
     * Set the radius of the control light
     */
    public set quadratic(value: number) {
        this.lightData.quadratic = value;
        this.onChange();
    }

    /**
     * Cast Light Shadow
     * @param value 
     *  */
    public set castShadow(value: boolean) {
        if (value != this._castShadow) {
            this.onChange();
        }
        this._castShadow = value;
    }

    public start(): void {
        this.transform.rotationX = 90;
        super.start();
    }

    public onUpdate(): void {
        this.transform.updateWorldMatrix(true);
    }

    public onGraphic(view?: View3D): void {
        let custom = view.graphic3D.createCustomShape(
            `PointLight_${this.object3D.uuid}`,
            this.transform,
        );
        custom.buildAxis();
        custom.buildCircle(Vector3.ZERO, this.range, 32, Vector3.X_AXIS);
        custom.buildCircle(Vector3.ZERO, this.range, 32, Vector3.Y_AXIS);
        custom.buildCircle(Vector3.ZERO, this.range, 32, Vector3.Z_AXIS);
    }

    /**
     *  enable GUI debug
     */
    public debug() {
    }

    public debugDraw(show: boolean) {
        // if (this.mShowDebugLine != show) {
        //     if (show) {
        //         this.drawDebugLine();
        //     } else {
        //         let view = this.transform.view3D;
        //         view.graphic3D.Clear(`PointLight_${this.object3D.uuid}`);
        //     }
        //     this.mShowDebugLine = show;
        // }
    }

}

