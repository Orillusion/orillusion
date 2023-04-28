import { BoundingBox } from "../core/bound/BoundingBox";
import { GeometryBase } from "../core/geometry/GeometryBase";
import { VertexAttributeName } from "../core/geometry/VertexAttributeName";
import { Vector3 } from "../math/Vector3";

/**
 * Torus Geometry
 * @group Geometry
 */
export class TorusGeometry extends GeometryBase {
    /**
     * Radius of torus
     */
    public radius: number;

    /**
     * Pipe radius
     */
    public tube: number;

    /**
     * Number of torus segments.
     */
    public radialSegments: number;

    /**
     * Number of pipeline segments.
     */
    public tubularSegments: number;

    /**
     *
     * @constructor
     * @param radius {number} Radius of torus, default value is 0.4
     * @param tube {number} Pipe radius, default value is 0.1.
     * @param radialSegments {number}Number of torus segments, default value is 32.
     * @param tubularSegments {number} Number of pipeline segments, defualt value is 32.
     */
    constructor(radius: number = 0.4, tube: number = 0.1, radialSegments: number = 32, tubularSegments: number = 32) {
        super();
        // this.geometrySource = new SerializeGeometrySource().setPrimitive('primitive-torus');
        this.radius = radius;
        this.tube = tube;
        this.radialSegments = radialSegments;
        this.tubularSegments = tubularSegments;
        // this.name = 'TorusGeometry';
        this.initVertex();
    }

    private initVertex() {

        const arc = 2.0 * Math.PI;
        const radius = this.radius;
        const tube = this.tube;
        const radialSegments = this.radialSegments;
        const tubularSegments = this.tubularSegments;

        this.bounds = new BoundingBox(Vector3.ZERO.clone(), new Vector3(radius * 2, tube * 2, radius * 2));

        var vertexCount: number = (radialSegments + 1) * (tubularSegments + 1);
        let position_arr = new Float32Array(vertexCount * 3);
        let normal_arr = new Float32Array(vertexCount * 3);
        let uv_arr = new Float32Array(vertexCount * 2);
        let indicesData = new Uint16Array(radialSegments * tubularSegments * 2 * 3);

        let pi = 0;
        let ni = 0;
        let ui = 0;
        let triIndex = 0;
        for (let j = 0; j <= radialSegments; j++) {
            for (let i = 0; i <= tubularSegments; i++) {
                const u = i / tubularSegments;
                const v = j / radialSegments;

                const u1 = u * arc;
                const v1 = v * Math.PI * 2;

                position_arr[pi++] = (radius + tube * Math.cos(v1)) * Math.sin(u1);
                position_arr[pi++] = tube * Math.sin(v1);
                position_arr[pi++] = (radius + tube * Math.cos(v1)) * Math.cos(u1);

                normal_arr[ni++] = Math.sin(u1) * Math.cos(v1);
                normal_arr[ni++] = Math.sin(v1);
                normal_arr[ni++] = Math.cos(u1) * Math.cos(v1);

                uv_arr[ui++] = u;
                uv_arr[ui++] = v;

                if ((i < tubularSegments) && (j < radialSegments)) {
                    const segment = tubularSegments + 1;
                    const a = segment * j + i;
                    const b = segment * (j + 1) + i;
                    const c = segment * (j + 1) + i + 1;
                    const d = segment * j + i + 1;

                    indicesData[triIndex++] = a;
                    indicesData[triIndex++] = d;
                    indicesData[triIndex++] = b;

                    indicesData[triIndex++] = d;
                    indicesData[triIndex++] = c;
                    indicesData[triIndex++] = b;
                }
            }
        }

        this.setIndices(indicesData);
        this.setAttribute(VertexAttributeName.position, position_arr);
        this.setAttribute(VertexAttributeName.normal, normal_arr);
        this.setAttribute(VertexAttributeName.uv, uv_arr);
        this.setAttribute(VertexAttributeName.TEXCOORD_1, uv_arr);

        this.addSubGeometry({
            indexStart: 0,
            indexCount: indicesData.length,
            vertexStart: 0,
            index: 0,
        });

    }

}
