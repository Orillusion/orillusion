import { Color } from '../math/Color';
import { Triangle } from '../math/Triangle';
import { Vector2 } from '../math/Vector2';
import { Vector3 } from '../math/Vector3';
/**
 * Pick up result information, including target Object3D, position, UV
 * @internal
 * @group IO
 */
export class PickResult {
    /**
     * the intersection point (local coordinates) on the model.
     */
    public localPosition: Vector3 = new Vector3();

    /**
     * the intersection point (world coordinates) on the model.
     */
    public worldPosition: Vector3 = new Vector3();

    /**
     * the uv on the model.
     * Only when the PickType of the object is UVPick and the model has UV will it be valid
     * @see PickType
     */
    public uv: Vector2 = new Vector2();

    /**
     * the triangle index at the intersection position of mesh
     */
    public faceIndex: number;

    public isIn: boolean = false;
    public t: number = 0;
    public u: number = 0;
    public v: number = 0;

    /**
     * the triangle at the intersection position of mesh
     */
    public triangle: Triangle;

    /**
     * @internal
     * the uv0 at the intersection position of mesh
     */
    public v0: number;

    /**
     * @internal
     * the uv1 at the intersection position of mesh
     */
    public v1: number;

    /**
     * @internal
     */
    public v2: number;

    /**
     * @internal
     */
    public pickList: any;

    /**
    * @internal
    */
    public color: Color; //= new Color();
}
