import { GeometryBase } from "../core/geometry/GeometryBase";
import { VertexAttributeName } from "../core/geometry/VertexAttributeName";

/**
 * Plane geometry
 * @group Geometry
 */
export class TriGeometry extends GeometryBase {


    private faceCount: number = 0;
    /**
     *
     * @constructor
     */
    constructor(count: number) {
        super();
        this.faceCount = count;
        this.buildGeometry();
    }

    private buildGeometry(): void {
        let indices_arr = new Uint32Array(this.faceCount * 3);
        let position_arr = new Float32Array(this.faceCount * 3 * 3);
        let normal_arr = new Float32Array(this.faceCount * 3 * 3);
        let uv_arr = new Float32Array(this.faceCount * 3 * 2);
        let meshIndexList = new Float32Array(this.faceCount * 3 * 1);

        // for (let index = 0; index < this.faceCount * 3; index++) {
        //     position_arr[index * 3 + 0] = Math.random() * 100;
        //     position_arr[index * 3 + 1] = Math.random() * 100;
        //     position_arr[index * 3 + 2] = Math.random() * 100;
        // }

        for (let index = 0; index < this.faceCount; index++) {
            let i1 = index * 3 + 0;
            let i2 = index * 3 + 1;
            let i3 = index * 3 + 2;
            indices_arr[i1] = i1;
            indices_arr[i2] = i2;
            indices_arr[i3] = i3;
        }

        this.setIndices(indices_arr);
        this.setAttribute(VertexAttributeName.position, position_arr);
        this.setAttribute(VertexAttributeName.normal, normal_arr);
        this.setAttribute(VertexAttributeName.uv, uv_arr);
        this.setAttribute(VertexAttributeName.TEXCOORD_1, uv_arr);
        this.setAttribute(VertexAttributeName.vIndex, meshIndexList);

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
