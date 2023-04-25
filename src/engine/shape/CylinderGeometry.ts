import { GeometryBase } from '../core/geometry/GeometryBase';
import { VertexAttributeName } from '../core/geometry/VertexAttributeName';
import { Vector2 } from '../math/Vector2';
import { Vector3 } from '../math/Vector3';
import { UUID } from '../util/Global';

/**
 * Cylinder geometry
 * @group Geometry
 */
export class CylinderGeometry extends GeometryBase {
    /**
     * The radius of the top of the cylinder
     */
    public radiusTop: number;
    /**
     * The radius of the bottom of the cylinder
     */
    public radiusBottom: number;
    /**
     * The height of the cylinder
     */
    public height: number;
    /**
     * Number of segments around the side of the cylinder
     */
    public radialSegments: number;
    /**
     * The number of segments along the height of the cylindrical side
     */
    public heightSegments: number;
    /**
     * Indicate whether the bottom surface of the cone is open or capped. The default value is false, which means that the bottom surface is capped by default.
     */
    public openEnded: boolean;
    /**
     * Starting angle of the first segment
     */
    public thetaStart: number;
    /**
     * The center angle of the circular sector on the bottom of the cylinder, with a default value of 2 * PI, makes it a complete cylinder.
     */
    public thetaLength: number;

    /**
     *
     * @constructor
     * @param radiusTop 
     * @param radiusBottom 
     * @param height 
     * @param radialSegments 
     * @param heightSegments 
     * @param openEnded 
     * @param thetaStart 
     * @param thetaLength
     */
    constructor(radiusTop = 1, radiusBottom = 1, height = 1, radialSegments = 8, heightSegments = 8, openEnded = false, thetaStart = 0, thetaLength = Math.PI * 2) {
        super();
        this.radiusTop = radiusTop;
        this.radiusBottom = radiusBottom;
        this.height = height;
        this.radialSegments = radialSegments;
        this.heightSegments = heightSegments;
        this.openEnded = openEnded;
        this.thetaStart = thetaStart;
        this.thetaLength = thetaLength;
        this.uuid = UUID();
        this.buildGeometry();
    }

    /**
     * @internal
     * @param start 
     * @param count 
     * @param index 
     */
    private addGroup(start, count, index) {
        this.addSubGeometry({
            indexStart: start,
            indexCount: count,
            vertexStart: start,
            index: index,
        });
    }

    protected buildGeometry(): void {
        const that = this;

        this.radialSegments = Math.floor(this.radialSegments);
        this.heightSegments = Math.floor(this.heightSegments);

        const vertices = [];
        const normals = [];
        const uvs = [];
        const indices = [];

        let index = 0;
        const indexArray = [];
        const halfHeight = this.height / 2;
        let groupStart = 0;

        generateTorso();

        if (this.openEnded === false) {
            if (this.radiusTop > 0) generateCap(true);
            if (this.radiusBottom > 0) generateCap(false);
        }

        let position_arr = new Float32Array(vertices);
        let normal_arr = new Float32Array(normals);
        let uv_arr = new Float32Array(uvs);
        let indices_arr = new Uint16Array(indices);

        this.setAttribute(VertexAttributeName.position, position_arr);
        this.setAttribute(VertexAttributeName.normal, normal_arr);
        this.setAttribute(VertexAttributeName.uv, uv_arr);
        this.setAttribute(VertexAttributeName.TEXCOORD_1, uv_arr);
        this.setIndices(indices_arr);

        function generateTorso() {
            const normal = new Vector3();
            const vertex = new Vector3();

            let groupCount = 0;

            const slope = (that.radiusBottom - that.radiusTop) / that.height;
            for (let y = 0; y <= that.heightSegments; y++) {
                const indexRow = [];

                const v = y / that.heightSegments;

                const radius = v * (that.radiusBottom - that.radiusTop) + that.radiusTop;

                for (let x = 0; x <= that.radialSegments; x++) {
                    const u = x / that.radialSegments;

                    const theta = u * that.thetaLength + that.thetaStart;

                    const sinTheta = Math.sin(theta);
                    const cosTheta = Math.cos(theta);

                    // vertex
                    vertex.x = radius * sinTheta;
                    vertex.y = -v * that.height + halfHeight;
                    vertex.z = radius * cosTheta;
                    vertices.push(vertex.x, vertex.y, vertex.z);

                    // normal
                    normal.set(sinTheta, slope, cosTheta).normalize();
                    normals.push(normal.x, normal.y, normal.z);

                    // uv
                    uvs.push(u, 1 - v);

                    indexRow.push(index++);
                }

                indexArray.push(indexRow);
            }

            for (let x = 0; x < that.radialSegments; x++) {
                for (let y = 0; y < that.heightSegments; y++) {
                    const a = indexArray[y][x];
                    const b = indexArray[y + 1][x];
                    const c = indexArray[y + 1][x + 1];
                    const d = indexArray[y][x + 1];

                    indices.push(a, b, d);
                    indices.push(b, c, d);

                    groupCount += 6;
                }
            }

            that.addGroup(groupStart, groupCount, 0);
            groupStart += groupCount;
        }

        function generateCap(top) {
            const centerIndexStart = index;

            const uv = new Vector2();
            const vertex = new Vector3();

            let groupCount = 0;

            const radius = top === true ? that.radiusTop : that.radiusBottom;
            const sign = top === true ? 1 : -1;

            for (let x = 1; x <= that.radialSegments; x++) {
                vertices.push(0, halfHeight * sign, 0);
                normals.push(0, sign, 0);
                uvs.push(0.5, 0.5);
                index++;
            }

            const centerIndexEnd = index;
            for (let x = 0; x <= that.radialSegments; x++) {
                const u = x / that.radialSegments;
                const theta = u * that.thetaLength + that.thetaStart;

                const cosTheta = Math.cos(theta);
                const sinTheta = Math.sin(theta);

                vertex.x = radius * sinTheta;
                vertex.y = halfHeight * sign;
                vertex.z = radius * cosTheta;
                vertices.push(vertex.x, vertex.y, vertex.z);

                normals.push(0, sign, 0);

                uv.x = cosTheta * 0.5 + 0.5;
                uv.y = sinTheta * 0.5 * sign + 0.5;
                uvs.push(uv.x, uv.y);

                index++;
            }

            for (let x = 0; x < that.radialSegments; x++) {
                const c = centerIndexStart + x;
                const i = centerIndexEnd + x;

                if (top === true) {
                    indices.push(i, i + 1, c);
                } else {
                    indices.push(i + 1, i, c);
                }

                groupCount += 3;
            }
            that.addGroup(groupStart, groupCount, top === true ? 1 : 2);
            groupStart += groupCount;
        }
    }

}
