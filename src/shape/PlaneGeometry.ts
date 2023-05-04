import { BoundingBox } from "../core/bound/BoundingBox";
import { GeometryBase } from "../core/geometry/GeometryBase";
import { VertexAttributeName } from "../core/geometry/VertexAttributeName";
import { Vector3 } from "../math/Vector3";

/**
 * Plane geometry
 * @group Geometry
 */
export class PlaneGeometry extends GeometryBase {
    /**
     * Width of the plane
     */
    public width: number;
    /**
     * Height of the plane
     */
    public height: number;
    /**
     * Number of width segments of a plane
     */
    public segmentW: number;
    /**
     * Number of height segments of a plane
     */
    public segmentH: number;
    /**
     * Define the normal vector of a plane
     */
    public up: Vector3;

    /**
     *
     * @constructor
     * @param width Width of the plane
     * @param height Height of the plane
     * @param segmentW Number of width segments of a plane
     * @param segmentH Number of height segments of a plane
     * @param up Define the normal vector of a plane
     */
    constructor(width: number, height: number, segmentW: number = 1, segmentH: number = 1, up: Vector3 = Vector3.Y_AXIS) {
        super();
        // this.geometrySource = new SerializeGeometrySource().setPrimitive('primitive-plane');
        this.width = width;
        this.height = height;
        this.segmentW = segmentW;
        this.segmentH = segmentH;
        this.up = up;
        this.buildGeometry(this.up);
    }

    private buildGeometry(axis: Vector3): void {
        //3 3 3 2 2 4
        var x: number, y: number;
        var numIndices: number;
        var base: number;
        var tw: number = this.segmentW + 1;
        var numVertices: number = (this.segmentH + 1) * tw;

        this.bounds = new BoundingBox(Vector3.ZERO.clone(), new Vector3(this.width, 1.0, this.height));
        numIndices = this.segmentH * this.segmentW * 6;

        let vertexCount = (this.segmentW + 1) * (this.segmentH + 1);
        let position_arr = new Float32Array(vertexCount * 3);
        let normal_arr = new Float32Array(vertexCount * 3);
        let uv_arr = new Float32Array(vertexCount * 2);
        let indices_arr = new Uint16Array(this.segmentW * this.segmentH * 2 * 3);

        numIndices = 0;
        var indexP: number = 0;
        var indexN: number = 0;
        var indexU: number = 0;
        for (var yi: number = 0; yi <= this.segmentH; ++yi) {
            for (var xi: number = 0; xi <= this.segmentW; ++xi) {
                x = (xi / this.segmentW - 0.5) * this.width;
                y = (yi / this.segmentH - 0.5) * this.height;
                switch (axis) {
                    case Vector3.Y_AXIS:
                        position_arr[indexP++] = x;
                        position_arr[indexP++] = 0;
                        position_arr[indexP++] = y;

                        normal_arr[indexN++] = 0;
                        normal_arr[indexN++] = 1;
                        normal_arr[indexN++] = 0;
                        break;
                    case Vector3.Z_AXIS:
                        position_arr[indexP++] = x;
                        position_arr[indexP++] = -y;
                        position_arr[indexP++] = 0;

                        normal_arr[indexN++] = 0;
                        normal_arr[indexN++] = 0;
                        normal_arr[indexN++] = -1;
                        break;
                    case Vector3.X_AXIS:
                        position_arr[indexP++] = 0;
                        position_arr[indexP++] = x;
                        position_arr[indexP++] = y;

                        normal_arr[indexN++] = 1;
                        normal_arr[indexN++] = 0;
                        normal_arr[indexN++] = 0;
                        break;
                    default:
                        position_arr[indexP++] = x;
                        position_arr[indexP++] = 0;
                        position_arr[indexP++] = y;

                        normal_arr[indexN++] = 0;
                        normal_arr[indexN++] = 1;
                        normal_arr[indexN++] = 0;
                        break;
                }

                uv_arr[indexU++] = xi / this.segmentW;
                uv_arr[indexU++] = yi / this.segmentH;

                if (xi != this.segmentW && yi != this.segmentH) {
                    base = xi + yi * tw;
                    indices_arr[numIndices++] = (base + 1); //1
                    indices_arr[numIndices++] = base; //0
                    indices_arr[numIndices++] = (base + tw); //2

                    indices_arr[numIndices++] = (base + 1); //1
                    indices_arr[numIndices++] = (base + tw); //2
                    indices_arr[numIndices++] = (base + tw + 1); //3
                }
            }
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
            index: 0,
        });
    }

}
