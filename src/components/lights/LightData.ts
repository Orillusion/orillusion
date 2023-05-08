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
 * @group Lights
 */
export enum LightType {
    None,
    PointLight,
    DirectionLight,
    SpotLight,
    SkyLight,
}

/**
 * Data structure of light sources
 * @internal
 * @group Lights
 */
export class LightData extends Struct {
    public static lightSize: number = 24;

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
    public radius: number = 0.5;

    /**
     *
     * The illumination distance of the light source, which is 0, means that the intensity of the light will not decrease due to the distance
     */
    public linear: number = 1.0;

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
}
