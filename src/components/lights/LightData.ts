import { Color } from '../../math/Color';
import { Vector3 } from '../../math/Vector3';
import { Struct } from '../../util/struct/Struct';

/**
    *Type of light source
    *
    *Type Description|
    * |:---:|:---:|
    *None|
    *PointLight|
    *DirectionLight|
    *SpotLight|
    *SkyLight|
    *RectLight|
 * @group Lights
 */
export enum LightType {
    None,
    PointLight,
    DirectionLight,
    SpotLight,
    SkyLight,
    RectLight,
}

/**
 * Data structure of light sources
 * @internal
 * @group Lights
 */
export class LightData extends Struct {
    public static lightSize: number = 28;

    public index: number = -1;
    /**
     * Light source type
     * @see LightType
     *  */
    public lightType: number = -1;

    /**
    * 
    * Light source radius
    */
    public radius: number = 0.001;

    /**
     *
     * The illumination distance of the light source, which is 0, means that the intensity of the light will not decrease due to the distance
     */
    public linear: number = 8.0;

    public lightPosition: Vector3 = new Vector3();

    public lightMatrixIndex: number = -1;

    /**
     * Light source direction
     */
    public direction: Vector3 = new Vector3();

    public quadratic: number = 0.032;

    /**
    *
    * The color of the light source
    */
    public lightColor: Color = new Color(1, 1, 1, 1);

    /**
     *
     * The intensity of light exposure
     */
    public intensity: number = 1;

    /**
     *
     * Inner cone angle of light source
     */
    public innerAngle: number = 0;
    /**
     *
     * Outer cone angle of light source
     */
    public outerAngle: number = 1;

    /**
     *
     * The size of the light source range and the distance emitted from the center of the light source object. Only Point and Spotlight have this parameter.
     */
    public range: number = 100;

    /**
     *
     * shadow at shadow map index
     */
    public castShadowIndex: number = -1;

    /**
     * Tangent direction of light
     */
    public lightTangent: Vector3 = Vector3.FORWARD;

    /**
     * Whether to use lighting ies
     */
    public iesIndex: number = -1;

    // shadowBias / normalBias arrays are sized and initialized in LightBase.start()
    // once the owning engine's setting.shadow.maxCascades is known.
    public shadowBias: number[] = [];
    public normalBias: number[] = [];

    // Cube shadow-map depth normalization factor (world units). Writer stores
    // `length(worldPos - lightPos) / shadowFar` into the shadow map; sampler
    // uses the same value to decode. Populated by GlobalUniformGroup from the
    // PointLight/SpotLight's shadowCameraFar (fallback = range).
    public shadowFar: number = 0;

    public csmShadowMapNum: number = 0;
    public csmShadowMapIndex: number = -1;

    // Per-light soft-shadow / PCSS light-size multiplier.
    // -1 means "fall back to globalUniform.shadowSoft". Consumed by
    // DirectShadow_frag and PointShadow_frag SOFT branches.
    public softness: number = -1;
}
