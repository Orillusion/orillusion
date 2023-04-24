import { Quaternion } from '../../../math/Quaternion';
import { Vector3 } from '../../../math/Vector3';

/**
 * Bone and joint data
 * @internal
 * @group Animation
 */
export class Joint {
    /**
     * Name of bone joint
     */
    public name: string = '';

    /**
     * Bone joint index
     */
    public index: number = 0;

    /**
     * The parent of a bone joint
     */
    public parent: Joint = null;

    /**
     * Bone joint child object
     */
    public children: Array<Joint> = [];

    /**
     * The scaling value of the bone joint
     */
    public scale: Vector3 = new Vector3();

    /**
     * The rotation Angle of the bone and joint
     */
    public rotation: Quaternion = new Quaternion();

    /**
     * The position of the bone joint
     */
    public translation: Vector3 = new Vector3();

    constructor(name: string = '') {
        this.name = name;
    }
}
