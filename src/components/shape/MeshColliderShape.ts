import { MeshComponent } from '../renderer/MeshComponent';
import { ColliderShape, ColliderShapeType } from './ColliderShape';
/**
 * Mesh collision body
 * @group Collider
 */
export class MeshColliderShape extends ColliderShape {
    /**
     * meshComponent
     */
    public mesh: MeshComponent;

    constructor() {
        super();
        this._shapeType = ColliderShapeType.Mesh;
    }
    // constructor(mesh: MeshComponent) {
    //   super(new Vector3(0, 0, 0), new Vector3(0, 0, 0));
    //   this.mesh = mesh;
    // }
}
