import { GeometryBase } from "../core/geometry/GeometryBase";
import { VertexAttributeName } from "../core/geometry/VertexAttributeName";

/**
 * vox geometry
 * @group Geometry
 */
export class VoxGeometry extends GeometryBase {

    protected count: number = 0;

    /**
     *
     * @constructor
     */
    constructor(count: number) {
        super();
        this.count = count;
        this.buildGeometry();
    }

    private buildGeometry(): void {
        let indices_arr = new Uint32Array(this.count * 36);
        let position_arr = new Float32Array(this.count * 36 * 3);
        let normal_arr = new Float32Array(this.count * 36 * 3);
        let color_arr = new Float32Array(this.count * 36 * 4);
        let uv_arr = new Float32Array(this.count * 36 * 2);

        let maxCount = this.count * 12;
        for (let index = 0; index < maxCount; index++) {
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
        this.setAttribute(VertexAttributeName.color, color_arr);
        this.setAttribute(VertexAttributeName.uv, uv_arr);

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
