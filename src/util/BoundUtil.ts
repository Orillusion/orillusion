import { Vector3 } from '../math/Vector3';
import { BoundingBox } from '../core/bound/BoundingBox';
import { Object3D } from '../core/entities/Object3D';
import { MeshRenderer } from '../components/renderer/MeshRenderer';
import { Matrix4 } from '../math/Matrix4';

export class BoundUtil {
    private static readonly maxVector = new Vector3(Number.MAX_VALUE * 0.1, Number.MAX_VALUE * 0.1, Number.MAX_VALUE * 0.1);
    private static readonly minVector = this.maxVector.clone().multiplyScalar(-1);
    private static readonly genMeshMaxVector = Vector3.ZERO.clone();
    private static readonly genMeshMinVector = Vector3.ZERO.clone();
    private static readonly genMeshVectorList8: Vector3[] = [new Vector3(), new Vector3(), new Vector3(), new Vector3(), new Vector3(), new Vector3(), new Vector3(), new Vector3()];

    /**
     * Merge the bounding boxes that have been added to the world matrix based on the mesh of the children node
     */
    public static genMeshBounds(obj: Object3D, bound?: BoundingBox) {
        let tempMin = this.genMeshMinVector;
        let tempMax = this.genMeshMaxVector;
        let tempPoints = this.genMeshVectorList8;

        bound ||= new BoundingBox(Vector3.ZERO, Vector3.ZERO);
        bound.setFromMinMax(this.maxVector, this.minVector);

        let cmpts = obj.getComponents(MeshRenderer);
        for (const cmpt of cmpts) {
            if (cmpt && cmpt.geometry) {
                let matrix = cmpt.object3D.transform.worldMatrix;
                tempMin.copy(cmpt.geometry.bounds.min);
                tempMax.copy(cmpt.geometry.bounds.max);

                tempPoints[0].set(tempMin.x, tempMin.y, tempMin.z); // 000
                tempPoints[1].set(tempMin.x, tempMin.y, tempMax.z); // 001
                tempPoints[2].set(tempMin.x, tempMax.y, tempMin.z); // 010
                tempPoints[3].set(tempMin.x, tempMax.y, tempMax.z); // 011
                tempPoints[4].set(tempMax.x, tempMin.y, tempMin.z); // 100
                tempPoints[5].set(tempMax.x, tempMin.y, tempMax.z); // 101
                tempPoints[6].set(tempMax.x, tempMax.y, tempMin.z); // 110
                tempPoints[7].set(tempMax.x, tempMax.y, tempMax.z); // 111

                for (const p of tempPoints) {
                    matrix.transformPoint(p, p);
                    bound.expandByPoint(p);
                }
            }
        }

        tempMax.copyFrom(bound.max);
        tempMin.copyFrom(bound.min);

        bound.setFromMinMax(tempMin, tempMax);

        return bound;
    }


    public static transformBound(matrix: Matrix4, source: BoundingBox, bound?: BoundingBox) {
        let tempMin = this.genMeshMinVector.copyFrom(source.min);
        let tempMax = this.genMeshMaxVector.copyFrom(source.max);
        let tempPoints = this.genMeshVectorList8;

        bound ||= new BoundingBox(Vector3.ZERO, Vector3.ZERO);
        bound.setFromMinMax(this.maxVector, this.minVector);

        tempPoints[0].set(tempMin.x, tempMin.y, tempMin.z); // 000
        tempPoints[1].set(tempMin.x, tempMin.y, tempMax.z); // 001
        tempPoints[2].set(tempMin.x, tempMax.y, tempMin.z); // 010
        tempPoints[3].set(tempMin.x, tempMax.y, tempMax.z); // 011
        tempPoints[4].set(tempMax.x, tempMin.y, tempMin.z); // 100
        tempPoints[5].set(tempMax.x, tempMin.y, tempMax.z); // 101
        tempPoints[6].set(tempMax.x, tempMax.y, tempMin.z); // 110
        tempPoints[7].set(tempMax.x, tempMax.y, tempMax.z); // 111

        for (const p of tempPoints) {
            matrix.transformPoint(p, p);
            bound.expandByPoint(p);
        }

        tempMax.copyFrom(bound.max);
        tempMin.copyFrom(bound.min);

        bound.setFromMinMax(tempMin, tempMax);

        return bound;
    }
}
