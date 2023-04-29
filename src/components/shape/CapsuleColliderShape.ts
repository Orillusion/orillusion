import { ColliderShape, ColliderShapeType } from './ColliderShape';
/**
 * Capsule collision body.
 * Composed of two hemispheres connected to a cylinder.
 * @group Collider
 */
export class CapsuleColliderShape extends ColliderShape {
    /**
     * The radius of the local width of the collision body.
     */
    public radius: number = 2.5;
    /**
     * The total height of the collision body.
     */
    public height: number = 10;

    constructor() {
        super();
        this._shapeType = ColliderShapeType.Capsule;
    }
    // constructor(center: Vector3, radius: number, height: number) {
    //   super(center, new Vector3(radius, radius, radius));
    //   this.radius = radius;
    //   this.height = height;
    // }
}
