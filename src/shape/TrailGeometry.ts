import { BoundingBox } from "../core/bound/BoundingBox";
import { GeometryBase } from "../core/geometry/GeometryBase";
import { VertexAttributeName } from "../core/geometry/VertexAttributeName";
import { Vector3 } from "../math/Vector3";

/**
 * Plane geometry
 * @group Geometry
 */
export class TrailGeometry extends GeometryBase {

    /**
     * Number of trail segments of a plane
     */
    public segment: number;
    private row: number = 0;
    /**
     *
     * @constructor
     */
    constructor(segment: number) {
        super();
        this.segment = segment;
        this.buildGeometry();
    }

    private buildGeometry(): void {
        this.row = this.segment + 1;
        let indices_arr = new Uint32Array(this.segment * 6);
        let position_arr = new Float32Array(this.row * 3 * 2);
        let normal_arr = new Float32Array(this.row * 3 * 2);
        let uv_arr = new Float32Array(this.row * 2 * 2);

        for (let i = 0; i < this.row; i++) {
            position_arr[i * 3 * 2 + 0] = 0;
            position_arr[i * 3 * 2 + 1] = 0;
            position_arr[i * 3 * 2 + 2] = 0;

            position_arr[i * 3 * 2 + 3] = 0;
            position_arr[i * 3 * 2 + 4] = 0;
            position_arr[i * 3 * 2 + 5] = 0;

            normal_arr[i * 3 * 2 + 0] = 0;
            normal_arr[i * 3 * 2 + 1] = 0;
            normal_arr[i * 3 * 2 + 2] = 1;

            normal_arr[i * 3 * 2 + 3] = 0;
            normal_arr[i * 3 * 2 + 4] = 0;
            normal_arr[i * 3 * 2 + 5] = 1;

            uv_arr[i * 2 * 2 + 0] = 0;
            uv_arr[i * 2 * 2 + 1] = i / this.segment;

            uv_arr[i * 2 * 2 + 2] = 1;
            uv_arr[i * 2 * 2 + 3] = i / this.segment;

            let c = i * 2;
            let f0 = c;
            let f1 = c + 1;
            let f2 = c + 2;
            let f3 = c + 3;

            indices_arr[i * 6 + 0] = f0;
            indices_arr[i * 6 + 1] = f1;
            indices_arr[i * 6 + 2] = f2;

            indices_arr[i * 6 + 3] = f1;
            indices_arr[i * 6 + 4] = f3;
            indices_arr[i * 6 + 5] = f2;
        }

        // c = i * 2
        //c -> (c + 1) -> (c + 2)
        //(c + 2) -> (c + 1) -> (c + 3)

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
            topology: 0
        });
    }

}
