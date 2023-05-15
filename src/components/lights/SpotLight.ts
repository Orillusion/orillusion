import { Engine3D } from '../../Engine3D';
import { View3D } from '../../core/View3D';
import { clamp, DEGREES_TO_RADIANS, RADIANS_TO_DEGREES } from '../../math/MathUtil';
import { Vector3 } from '../../math/Vector3';
import { UUID } from '../../util/Global';
import { LightBase } from './LightBase';
import { LightType } from './LightData';

/**
 * Spotlight source.
 * Light shines from a point in one direction, and as the light shines further away, the size of the light cone gradually increases.
 * Similar to a desk lamp, chandelier, or flashlight, this light source can produce shadows.
 * @group Lights
 */
export class SpotLight extends LightBase {
    constructor() {
        super();
    }

    public init(): void {
        super.init();
        this.lightData.lightType = LightType.SpotLight;
        if (this.object3D.name == "") {
            this.object3D.name = "SpotLight" + UUID();
        }
    }



    /**
     * Get the inner cone angle of the light source (as a percentage relative to the outer cone angle)
     */
    public get innerAngle(): number {
        return (this.lightData.innerAngle as number) / (this.lightData.outerAngle as number) * 100.0;
    }

    /**
     *
     * Set the inner cone angle of the light source (as a percentage relative to the outer cone angle)
     * @param {value} 0.0 - 100.0
     */
    public set innerAngle(value: number) {
        this.lightData.innerAngle = clamp(value, 0.0, 100.0) / 100.0 * (this.lightData.outerAngle as number);
        this.onChange();
    }

    /**
     * Get the outer cone angle of the light source
     * @return number
     */
    public get outerAngle(): number {
        return (this.lightData.outerAngle as number) * RADIANS_TO_DEGREES * 2;
    }

    /**
     * Set the outer cone angle of the light source
     * @param {value} 1.0 - 179.0
     */
    public set outerAngle(value: number) {
        this.lightData.outerAngle = clamp(value, 1.0, 179.0) * DEGREES_TO_RADIANS * 0.5;
        this.onChange();
    }

    /**
     *
     * Get the radius of the light source
     * @return number
     */
    public get radius(): number {
        return this.lightData.radius as number;
    }

    /**
     *
     * Set the radius of the light source
     * @param {value}
     */
    public set radius(value: number) {
        this.lightData.radius = value;
        this.onChange();
    }

    /**
     * Get the range of the light source
     */
    public get range(): number {
        return this.lightData.range as number;
    }

    /**
     *
     * Set the range of the light source
     * @param {value}
     */
    public set range(value: number) {
        this.lightData.range = value;
        this.onChange();
    }

    /**
     * Get the illumination distance of the light source
     */
    public get at(): number {
        return this.lightData.linear as number;
    }

    /**
     * Set the illumination distance of the light source
     */
    public set at(value: number) {
        this.lightData.linear = value;
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
        super.start();
        this.lightData.lightType = LightType.SpotLight;
    }

    public onUpdate(): void {
        this.transform.updateWorldMatrix(true);
    }

    public onGraphic(view: View3D) {
        let custom = view.graphic3D.createCustomShape(
            `SpotLight_${this.object3D.uuid}`,
            this.transform,
        );

        const range = this.range;
        const outerAngle = this.outerAngle / 2.0;
        custom.buildAxis();

        let angle = (90 - outerAngle) * DEGREES_TO_RADIANS;
        let v0 = range * Math.cos(angle);
        let v1 = range * Math.sin(angle);
        custom.buildLines([Vector3.ZERO, new Vector3(0, v0, v1)]);
        custom.buildLines([Vector3.ZERO, new Vector3(v0, 0, v1)]);

        angle = (90 + outerAngle) * DEGREES_TO_RADIANS;
        v0 = range * Math.cos(angle);
        v1 = range * Math.sin(angle);
        custom.buildLines([Vector3.ZERO, new Vector3(0, v0, v1)]);
        custom.buildLines([Vector3.ZERO, new Vector3(v0, 0, v1)]);
        custom.buildArcLine(Vector3.ZERO, range, 90 - outerAngle, 90 + outerAngle, 16, Vector3.X_AXIS);
        custom.buildArcLine(Vector3.ZERO, range, 90 - outerAngle, 90 + outerAngle, 16, Vector3.Y_AXIS);
        custom.buildCircle(new Vector3(0, 0, range * Math.sin(angle)), range * Math.cos(angle), 32, Vector3.Z_AXIS);
    }

    /**
     * enable GUI debug
     */
    public debug() {
    }

    public debugDraw(show: boolean) {
        // if (this.mShowDebugLine != show) {
        //     if (show) {
        //         this.drawDebugLine();
        //     } else {
        //         //view.graphic3D.Clear(`SpotLight_${this.object3D.uuid}`);
        //     }
        //     this.mShowDebugLine = show;
        // }
    }

}


