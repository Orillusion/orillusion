import { BoundingBox, Vector3 } from "..";
import { GeometryBase } from "../core/geometry/GeometryBase";
import { VertexAttributeName } from "../core/geometry/VertexAttributeName";

/**
 * Sphere Geometry
 * @group Geometry
 */
export class SphereGeometry extends GeometryBase {
    public shape_vertices = [];
    public shape_indices = [];

    /**
     * radius of sphere
     */
    public radius: number;
    /**
     * Define the number of horizontal segments
     */
    public widthSegments: number;
    /**
     * Define the number of vertical segments
     */
    public heightSegments: number;
    /**
     * The starting point radian of the equatorial line of a sphere
     */
    public phiStart: number;
    /**
     * The arc length of the equatorial line of a sphere
     */
    public phiLength: number;
    /**
     * The radian of the starting point of the sphere's meridian
     */
    public thetaStart: number;
    /**
     * Arc length of sphere meridian
     */
    public thetaLength: number;

    /**
     *
     * @constructor
     * @param radius radius of sphere
     * @param widthSegments Define the number of horizontal segments
     * @param heightSegments Define the number of vertical segments
     * @param phiStart  The starting point radian of the equatorial line of a sphere
     * @param phiLength The arc length of the equatorial line of a sphere
     * @param thetaStart The radian of the starting point of the sphere's meridian
     * @param thetaLength Arc length of sphere meridian
     */
    constructor(radius, widthSegments, heightSegments, phiStart?, phiLength?, thetaStart?, thetaLength?) {
        super();
        // this.geometrySource = new SerializeGeometrySource().setPrimitive('primitive-sphere');
        // this.v_Stride = 1 + 3 + 3 + 3 + 2 + 2 + 4;
        // this.vertexFormat = VertexFormat.INDEX | VertexFormat.POSITION | VertexFormat.NORMAL | VertexFormat.TANGENT | VertexFormat.UV0 | VertexFormat.UV1 | VertexFormat.COLOR;

        this.radius = radius;
        this.widthSegments = widthSegments;
        this.heightSegments = heightSegments;
        this.phiStart = phiStart;
        this.phiLength = phiLength;
        this.thetaStart = thetaStart;
        this.thetaLength = thetaLength;

        this.buildGeometry();
    }

    protected buildGeometry(): void {
        var i: number,
            j: number,
            triIndex: number = 0;
        let _segmentsH = this.heightSegments;
        let _segmentsW = this.widthSegments;
        let _radius = this.radius;
        var vertexCount: number = (_segmentsH + 1) * (_segmentsW + 1);
        let position_arr = new Float32Array(vertexCount * 3);
        let normal_arr = new Float32Array(vertexCount * 3);
        let uv_arr = new Float32Array(vertexCount * 2);
        let indice_arr = new Uint16Array(_segmentsW * _segmentsH * 2 * 3);

        let pi = 0;
        let ni = 0;
        let ui = 0;
        for (j = 0; j <= _segmentsH; ++j) {
            var horAngle: number = (Math.PI * j) / _segmentsH;
            var z: number = -_radius * Math.cos(horAngle);
            var ringRadius: number = _radius * Math.sin(horAngle);

            for (i = 0; i <= _segmentsW; ++i) {
                var verAngle: number = (2 * Math.PI * i) / _segmentsW;
                var x: number = ringRadius * Math.cos(verAngle);
                var y: number = ringRadius * Math.sin(verAngle);
                var normLen: number = 1 / Math.sqrt(x * x + y * y + z * z);
                let index = i * _segmentsW + j;
                position_arr[pi++] = x;
                position_arr[pi++] = y;
                position_arr[pi++] = z;

                normal_arr[ni++] = x * normLen;
                normal_arr[ni++] = y * normLen;
                normal_arr[ni++] = z * normLen;

                uv_arr[ui++] = i / _segmentsW;
                uv_arr[ui++] = j / _segmentsH;

                if (i > 0 && j > 0) {
                    var a: number = (_segmentsW + 1) * j + i;
                    var b: number = (_segmentsW + 1) * j + i - 1;
                    var c: number = (_segmentsW + 1) * (j - 1) + i - 1;
                    var d: number = (_segmentsW + 1) * (j - 1) + i;

                    if (j == _segmentsH) {
                        indice_arr[triIndex++] = a;
                        indice_arr[triIndex++] = c;
                        indice_arr[triIndex++] = d;
                    } else if (j == 1) {
                        indice_arr[triIndex++] = a;
                        indice_arr[triIndex++] = b;
                        indice_arr[triIndex++] = c;
                    } else {
                        indice_arr[triIndex++] = a;
                        indice_arr[triIndex++] = b;
                        indice_arr[triIndex++] = c;
                        indice_arr[triIndex++] = a;
                        indice_arr[triIndex++] = c;
                        indice_arr[triIndex++] = d;
                    }
                }
            }
        }

        // let att_info: GeometryAttribute = {};
        // att_info[VertexAttributeName.position] = { name: VertexAttributeName.position, data: position_arr };
        // att_info[VertexAttributeName.normal] = { name: VertexAttributeName.normal, data: normal_arr };
        // att_info[VertexAttributeName.uv] = { name: VertexAttributeName.uv, data: uv_arr };
        // att_info[VertexAttributeName.TEXCOORD_1] = { name: VertexAttributeName.TEXCOORD_1, data: uv_arr };
        // this.vertexBuffer.addAttribute(VertexAttributeName.position, VertexAttributeLocation.position, VertexAttributeStride.position, position_arr);
        // this.vertexBuffer.addAttribute(VertexAttributeName.normal, VertexAttributeLocation.normal, VertexAttributeStride.normal, normal_arr);
        // this.vertexBuffer.addAttribute(VertexAttributeName.uv, VertexAttributeLocation.uv, VertexAttributeStride.uv, uv_arr);
        // this.vertexBuffer.addAttribute(VertexAttributeName.TEXCOORD_1, VertexAttributeLocation.TEXCOORD_1, VertexAttributeStride.TEXCOORD_1, uv_arr);
        // att_info[VertexAttributeName.indices] = { name: VertexAttributeName.indices, data: indice_arr };
        // this.setAttributes('default-sphereGeometry', att_info);
        // this.vertexBuffer = new CompositeVertexGeometryBuffer();
        // this.indexBuffer = new IndexGeometryBuffer(indice_arr.length, indice_arr);
        // GeometryUtil.composite(this, [VertexAttributeName.position, VertexAttributeName.normal, VertexAttributeName.uv, VertexAttributeName.TEXCOORD_1]);

        this.setIndices(indice_arr);
        this.setAttribute(VertexAttributeName.position, position_arr);
        this.setAttribute(VertexAttributeName.normal, normal_arr);
        this.setAttribute(VertexAttributeName.uv, uv_arr);
        this.setAttribute(VertexAttributeName.TEXCOORD_1, uv_arr);

        this.addSubGeometry({
            indexStart: 0,
            indexCount: indice_arr.length,
            vertexStart: 0,
            index: 0,
        });

        this.bounds = new BoundingBox(Vector3.ZERO, new Vector3(this.radius * 2, this.radius * 2, this.radius * 2))
    }

}
