import { BoundingBox } from "../core/bound/BoundingBox";
import { GeometryBase } from "../core/geometry/GeometryBase";
import { VertexAttributeName } from "../core/geometry/VertexAttributeName";
import { Vector3 } from "../math/Vector3";

/**
 * Plane geometry
 * @group Geometry
 */
export class StripeGeometry extends GeometryBase {

    segments: [Vector3, Vector3][];
    /**
     *
     * @constructor
     * @param width Width of the plane
     * @param height Height of the plane
     * @param segmentW Number of width segments of a plane
     * @param segmentH Number of height segments of a plane
     * @param up Define the normal vector of a plane
     */
    constructor(segments: [Vector3, Vector3][]) {
        super();
        // this.geometrySource = new SerializeGeometrySource().setPrimitive('primitive-plane');
        this.segments = segments;
        this.buildGeometry();
    }

    private buildGeometry(): void {

        this.bounds = new BoundingBox();
        let numIndices = (this.segments.length - 1) * 2 * 3;

        let vertexCount = this.segments.length * 2;
        let position_arr = new Float32Array(vertexCount * 3);
        let normal_arr = new Float32Array(vertexCount * 3);
        let uv_arr = new Float32Array(vertexCount * 2);
        let indices_arr = new Uint16Array(numIndices);
        //210 123

        let index = 0;
        for (let item of this.segments) {
            position_arr[index++] = item[0].x;
            position_arr[index++] = item[0].y;
            position_arr[index++] = item[0].z;
            position_arr[index++] = item[1].x;
            position_arr[index++] = item[1].y;
            position_arr[index++] = item[1].z;
        }

        index = 0;
        let offset = 0;
        while (index < numIndices) {
            indices_arr[index++] = 2 + offset;
            indices_arr[index++] = 1 + offset;
            indices_arr[index++] = 0 + offset;
            indices_arr[index++] = 1 + offset;
            indices_arr[index++] = 2 + offset;
            indices_arr[index++] = 3 + offset;

            offset += 2;
        }

        this.setIndices(indices_arr);
        this.setAttribute(VertexAttributeName.position, position_arr);
        this.setAttribute(VertexAttributeName.normal, normal_arr);
        this.setAttribute(VertexAttributeName.uv, uv_arr);
        this.setAttribute(VertexAttributeName.TEXCOORD_1, uv_arr);

        this.addSubGeometry({
            indexStart: 0,
            indexCount: indices_arr.length,
            vertexStart: 0,
            vertexCount: 0,
            firstStart: 0,
            index: 0,
            topology: 0,
        });

        this.computeNormals();
    }

}
