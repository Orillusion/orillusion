import { BoundingBox } from '../core/bound/BoundingBox';
import { GeometryBase } from '../core/geometry/GeometryBase';
import { VertexAttributeName } from '../core/geometry/VertexAttributeName';
import { Vector3 } from '../math/Vector3';

/**
 * Box geometry
 * @group Geometry
 */
export class BoxGeometry extends GeometryBase {
    /**
     * box width
     */
    public width: number;
    /**
     * box height
     */
    public height: number;
    /**
     * box depth
     */
    public depth: number;
    /**
     *
     * @constructor
     * @param width {number} box width, default value is 1
     * @param height {number} box height, default value is 1
     * @param depth {number} box depth, default value is 1
     */
    constructor(width: number = 1, height: number = 1, depth: number = 1) {
        super();
        // this.geometrySource = new SerializeGeometrySource().setPrimitive('primitive-box');
        this.width = width;
        this.height = height;
        this.depth = depth;
        // this.name = 'BoxGeometry';
        this.initVertex();
    }

    private initVertex() {
        let halfW = this.width / 2.0;
        let halfH = this.height / 2.0;
        let halfD = this.depth / 2.0;

        this.bounds = new BoundingBox(Vector3.ZERO.clone(), new Vector3(this.width, this.height, this.depth));

        let position_arr = new Float32Array([
            //up
            -halfW,
            halfH,
            halfD,
            halfW,
            halfH,
            halfD,
            halfW,
            halfH,
            -halfD,
            -halfW,
            halfH,
            -halfD,
            -halfW,
            halfH,
            halfD,
            halfW,
            halfH,
            -halfD,
            //buttom
            halfW,
            -halfH,
            halfD,
            -halfW,
            -halfH,
            halfD,
            -halfW,
            -halfH,
            -halfD,
            halfW,
            -halfH,
            -halfD,
            halfW,
            -halfH,
            halfD,
            -halfW,
            -halfH,
            -halfD,
            //left
            -halfW,
            -halfH,
            halfD,
            -halfW,
            halfH,
            halfD,
            -halfW,
            halfH,
            -halfD,
            -halfW,
            -halfH,
            -halfD,
            -halfW,
            -halfH,
            halfD,
            -halfW,
            halfH,
            -halfD,
            //right
            halfW,
            halfH,
            halfD,
            halfW,
            -halfH,
            halfD,
            halfW,
            -halfH,
            -halfD,
            halfW,
            halfH,
            -halfD,
            halfW,
            halfH,
            halfD,
            halfW,
            -halfH,
            -halfD,
            //front
            halfW,
            halfH,
            halfD,
            -halfW,
            halfH,
            halfD,
            -halfW,
            -halfH,
            halfD,
            -halfW,
            -halfH,
            halfD,
            halfW,
            -halfH,
            halfD,
            halfW,
            halfH,
            halfD,
            //back
            halfW,
            -halfH,
            -halfD,
            -halfW,
            -halfH,
            -halfD,
            -halfW,
            halfH,
            -halfD,
            halfW,
            halfH,
            -halfD,
            halfW,
            -halfH,
            -halfD,
            -halfW,
            halfH,
            -halfD,
        ]);

        let normal_arr = new Float32Array([
            //up
            0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,

            //buttom
            0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,

            //left
            -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,

            //right
            1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,

            //front
            0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,

            //back
            0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
        ]);

        let uv_arr = new Float32Array([1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 0, 0, 1, 0, 1, 1, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 0]);

        let indices_arr = [0, 2, 1, 3, 5, 4, 6, 8, 7, 9, 11, 10, 12, 14, 13, 15, 17, 16, 18, 20, 19, 21, 23, 22, 24, 26, 25, 27, 29, 28, 30, 32, 31, 33, 35, 34];
        let indicesData = new Uint16Array(indices_arr.reverse());

        this.setIndices(indicesData);
        this.setAttribute(VertexAttributeName.position, position_arr);
        this.setAttribute(VertexAttributeName.normal, normal_arr);
        this.setAttribute(VertexAttributeName.uv, uv_arr);
        this.setAttribute(VertexAttributeName.TEXCOORD_1, uv_arr);

        this.addSubGeometry({
            indexStart: 0,
            indexCount: indices_arr.length,
            vertexStart: 0,
            index: 0,
        });
    }

}
