import { UUID } from '../../util/Global';
import { RegisterComponent } from '../../util/SerializeDecoration';
import { LightBase } from './LightBase';
import { LightType } from './LightData';

/**
 * Rectangular area light.
 *
 * A flat `width` × `height` panel that emits from one face, along the
 * object's forward axis — a window, a softbox, a ceiling panel or a screen.
 * Unlike a point or spot light it has a real size: nearby surfaces receive
 * soft, wrap-around diffuse light and glossy surfaces show a rectangular
 * highlight.
 *
 * `intensity` is the panel's radiance, so making the panel larger makes the
 * scene brighter (like a real softbox). `range` fades the contribution to
 * zero and bounds the light for cluster culling.
 *
 * Limitations: no shadows, and the light itself is not drawn — add an unlit
 * quad at the same transform if the panel should be visible.
 * @group Lights
 */
@RegisterComponent(RectLight, 'RectLight')
export class RectLight extends LightBase {
    private _width: number = 2;
    private _height: number = 1;

    constructor() {
        super();
    }

    public init(): void {
        super.init();
        this.lightData.lightType = LightType.RectLight;
        this.lightData.range = 20;
        this.lightData.intensity = 5;
        this.syncSize();
        if (this.object3D.name == "") {
            this.object3D.name = "RectLight" + UUID();
        }
    }

    public start(): void {
        super.start();
        this.lightData.lightType = LightType.RectLight;
        this.syncSize();
    }

    // The shader reads the half extents from the two spot-cone slots, which a
    // rect light does not otherwise use.
    private syncSize() {
        this.lightData.innerAngle = this._width * 0.5;
        this.lightData.outerAngle = this._height * 0.5;
        this.onChange();
    }

    /** Panel width in world units (along the object's right axis). */
    public get width(): number {
        return this._width;
    }

    public set width(value: number) {
        this._width = Math.max(value, 1e-4);
        this.syncSize();
    }

    /** Panel height in world units (along the object's up axis). */
    public get height(): number {
        return this._height;
    }

    public set height(value: number) {
        this._height = Math.max(value, 1e-4);
        this.syncSize();
    }

    /** Distance from the panel centre at which the light has faded to zero. */
    public get range(): number {
        return this.lightData.range as number;
    }

    public set range(value: number) {
        this.lightData.range = value;
        this.onChange();
    }

    /** Rect lights do not cast shadows; the flag is ignored. */
    public set castShadow(value: boolean) {
        this._castShadow = false;
    }

    public get castShadow(): boolean {
        return false;
    }

    public debug() {
    }

    public debugDraw(show: boolean) {
    }
}
