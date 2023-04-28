import { Camera3D } from '../../core/Camera3D';
import { UUID } from '../../util/Global';
import { LightBase } from './LightBase';
import { LightType } from './LightData';
/**
 *
 *Directional light source.
 *The light of this light source is parallel, for example, sunlight. This light source can generate shadows.
 * @group Lights
 */
export class DirectLight extends LightBase {
    public shadowCamera: Camera3D;

    constructor() {
        super();
    }

    public init(): void {
        super.init();
        if (this.object3D.name == "") {
            this.object3D.name = "DirectionLight_" + UUID();
        }
        this.radius = 9999999;// Number.MAX_SAFE_INTEGER;
        this.lightData.lightType = LightType.DirectionLight;
        this.lightData.linear = 0;
    }

    public start(): void {
        super.start();
        this.castGI = true;
    }

    /**
     *
     * Get the radius of a directional light source
     */
    public get radius(): number {
        return this.lightData.range as number;
    }

    /**
     * Set the radius of a directional light source
     */
    public set radius(value: number) {
        this.lightData.range = value;
        this.onChange();
    }

    /**
     *
     * Get the radius of a directional light source
     */
    public get indirect(): number {
        return this.lightData.quadratic as number;
    }

    /**
     * Set the radius of a directional light source
     */
    public set indirect(value: number) {
        this.lightData.quadratic = value;
        this.onChange();
    }

    /**
     * Set cast shadow
     * @param value
     **/
    public set castShadow(value: boolean) {
        if (value != this._castShadow) {
            this.onChange();
        }
        this._castShadow = value;
    }

    /**
     * get cast shadow
     * @return boolean
     * */
    public get castShadow(): boolean {
        return this.lightData.castShadowIndex as number >= 0;
    }

    /**
     * enable light debug gui
     */
    public debug() {
    }
}
