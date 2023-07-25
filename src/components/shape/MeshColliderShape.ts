import { GeometryBase, Matrix4, Ray, Triangle, Vector3, ColliderShape, ColliderShapeType, HitInfo } from '@orillusion/core';


/**
 * Mesh collision body
 * @group Collider
 */
export class MeshColliderShape extends ColliderShape {
    /**
     * meshComponent
     */
    public mesh: GeometryBase;

    private static triangle: Triangle;
    private _pickRet: HitInfo;

    constructor() {
        super();
        this._shapeType = ColliderShapeType.Mesh;
    }

    public rayPick(ray: Ray, fromMatrix: Matrix4): HitInfo {
        if (this.mesh) {
            MeshColliderShape.triangle ||= new Triangle(new Vector3(), new Vector3(), new Vector3());

            let positionAttribute = this.mesh.getAttribute(`position`);
            let indexAttribute = this.mesh.getAttribute(`indices`);

            let helpMatrix = ColliderShape.helpMatrix;
            helpMatrix.copyFrom(fromMatrix).invert();

            let helpRay = ColliderShape.helpRay.copy(ray);
            helpRay.applyMatrix(helpMatrix);

            helpRay.intersectBox(this.mesh.bounds);
            let pick = helpRay.intersectBox(this.mesh.bounds, ColliderShape.v3_help_0);
            if (!pick) {
                return null;
            }

            if (indexAttribute && positionAttribute && indexAttribute.data.length > 0) {

                let vertexData = positionAttribute.data;
                for (let i = 0, c = indexAttribute.data.length / 3; i < c; i++) {

                    let offsetIndex = i * 3;
                    const i1 = indexAttribute.data[offsetIndex + 0] * 3;
                    const i2 = indexAttribute.data[offsetIndex + 1] * 3;
                    const i3 = indexAttribute.data[offsetIndex + 2] * 3;

                    let triangle = MeshColliderShape.triangle;

                    let p1 = triangle.v1.set(vertexData[i1 + 0], vertexData[i1 + 1], vertexData[i1 + 2]);
                    let p2 = triangle.v2.set(vertexData[i2 + 0], vertexData[i2 + 1], vertexData[i2 + 2]);
                    let p3 = triangle.v3.set(vertexData[i3 + 0], vertexData[i3 + 1], vertexData[i3 + 2]);

                    triangle.set(p1, p2, p3);

                    let pick = helpRay.intersectTriangle(helpRay.origin, helpRay.direction, triangle);

                    if (pick) {
                        this._pickRet ||= { intersectPoint: new Vector3(), distance: 0 };
                        this._pickRet.intersectPoint = pick;
                        this._pickRet.distance = Vector3.distance(helpRay.origin, pick);
                        return this._pickRet;
                    }

                }
            }
        }

        return null;
    }

}
