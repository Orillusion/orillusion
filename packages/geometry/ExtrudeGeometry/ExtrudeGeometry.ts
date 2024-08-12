import { GeometryBase, Vector2, VertexAttributeName } from "@orillusion/core";
import { Shape2D } from "./Shape2D";
import { ShapeUtils } from "./ShapeUtils";

export type ExtrudeGeometryArgs = {
    curveSegments?: number;
    steps?: number;
    depth?: number;
    bevelEnabled?: boolean;
    bevelThickness?: number;
    bevelSize?: number;
    bevelOffset?: number;
    bevelSegments?: number;
}

export class ExtrudeGeometry extends GeometryBase {
    public shapes: Shape2D[];
    public options: ExtrudeGeometryArgs;
    protected verticesArray: number[] = [];
    protected uvArray: number[] = [];

    constructor(shapes?: Shape2D[], options?) {
        super();
        this.options = options;
        this.shapes = shapes;
        if (this.shapes && this.shapes.length > 0) {
            this.buildGeometry(options);
        }
    }

    protected buildGeometry(options: ExtrudeGeometryArgs) {
        this.verticesArray = [];
        this.uvArray = [];

        for (let shape of this.shapes) {
            this.addShape(shape, options);
        }

        const indices = new Uint32Array(this.verticesArray.length / 3);
        for (let i = 0; i < indices.length; i++) {
            indices[i] = i;
        }

        this.setIndices(indices);
        this.setAttribute(VertexAttributeName.position, new Float32Array(this.verticesArray));
        this.setAttribute(VertexAttributeName.normal, new Float32Array(this.verticesArray.length));
        this.setAttribute(VertexAttributeName.uv, new Float32Array(this.uvArray));

        this.computeNormals();
    }

    protected addGroup(start: number, count: number, materialIndex = 0) {
        this.addSubGeometry({
            indexStart: start,
            indexCount: count,
            vertexStart: 0,
            vertexCount: 0,
            firstStart: 0,
            index: 0,
            topology: 0,
        });
    }

    protected addShape(shape: Shape2D, options: ExtrudeGeometryArgs) {
        const verticesArray = this.verticesArray;
        const uvArray = this.uvArray;
        const self = this;

        const curveSegments: number = options.curveSegments !== undefined ? options.curveSegments : 12;
        const steps: number = options.steps !== undefined ? options.steps : 1;
        const depth: number = options.depth !== undefined ? options.depth : 1;

        let bevelEnabled: boolean = options.bevelEnabled !== undefined ? options.bevelEnabled : true;
        let bevelThickness: number = options.bevelThickness !== undefined ? options.bevelThickness : 0.2;
        let bevelSize: number = options.bevelSize !== undefined ? options.bevelSize : bevelThickness - 0.1;
        let bevelOffset: number = options.bevelOffset !== undefined ? options.bevelOffset : 0;
        let bevelSegments: number = options.bevelSegments !== undefined ? options.bevelSegments : 3;

        if (!bevelEnabled) {
            bevelSegments = 0;
            bevelThickness = 0;
            bevelSize = 0;
            bevelOffset = 0;
        }

        const placeholder: number[] = [];
        const shapePoints = shape.extractPoints(curveSegments);
        let vertices = shapePoints.shape;
        const holes = shapePoints.holes;
        const reverse = !ShapeUtils.isClockWise(vertices);

        if (reverse) {
            vertices = vertices.reverse();
            for (let i = 0; i < holes.length; i++) {
                const hole = holes[i];
                if (ShapeUtils.isClockWise(hole)) {
                    holes[i] = hole.reverse();
                }
            }
        }

        const faces = ShapeUtils.triangulateShape(vertices, holes);

        const contour = vertices;
        for (let i = 0; i < holes.length; i++) {
            const hole = holes[i];
            vertices = vertices.concat(hole);
        }

        const vlen = vertices.length, flen = faces.length;

        const contourMovements = [];
        for (let i = 0, j = contour.length - 1, k = i + 1; i < contour.length; i++, j++, k++) {
            if (j === contour.length) j = 0;
            if (k === contour.length) k = 0;
            contourMovements[i] = this.getBevelVec(contour[i], contour[j], contour[k]);
        }

        const holesMovements = [];
        let oneHoleMovements, verticesMovements = contourMovements.concat();
        for (let h = 0, hl = holes.length; h < hl; h++) {
            const ahole = holes[h];
            oneHoleMovements = [];
            for (let i = 0, j = ahole.length - 1, k = i + 1; i < ahole.length; i++, j++, k++) {
                if (j === ahole.length) j = 0;
                if (k === ahole.length) k = 0;
                oneHoleMovements[i] = this.getBevelVec(ahole[i], ahole[j], ahole[k]);
            }
            holesMovements.push(oneHoleMovements);
            verticesMovements = verticesMovements.concat(oneHoleMovements);
        }

        for (let b = 0; b < bevelSegments; b++) {
            const t = b / bevelSegments;
            const z = bevelThickness * Math.cos(t * Math.PI / 2);
            const bs = bevelSize * Math.sin(t * Math.PI / 2) + bevelOffset;

            for (let i = 0; i < contour.length; i++) {
                const vert = this.scalePoint2(contour[i], contourMovements[i], bs);
                v(vert.x, vert.y, - z);
            }

            for (let h = 0, hl = holes.length; h < hl; h++) {
                const ahole = holes[h];
                oneHoleMovements = holesMovements[h];
                for (let i = 0; i < ahole.length; i++) {
                    const vert = this.scalePoint2(ahole[i], oneHoleMovements[i], bs);
                    v(vert.x, vert.y, - z);
                }
            }
        }

        const bs = bevelSize + bevelOffset;
        for (let i = 0; i < vlen; i++) {
            const vert = bevelEnabled ? this.scalePoint2(vertices[i], verticesMovements[i], bs) : vertices[i];
            v(vert.x, vert.y, 0);
        }

        for (let s = 1; s <= steps; s++) {
            for (let i = 0; i < vlen; i++) {
                const vert = bevelEnabled ? this.scalePoint2(vertices[i], verticesMovements[i], bs) : vertices[i];
                v(vert.x, vert.y, depth / steps * s);
            }
        }

        for (let b = bevelSegments - 1; b >= 0; b--) {
            const t = b / bevelSegments;
            const z = bevelThickness * Math.cos(t * Math.PI / 2);
            const bs = bevelSize * Math.sin(t * Math.PI / 2) + bevelOffset;

            for (let i = 0, il = contour.length; i < il; i++) {
                const vert = this.scalePoint2(contour[i], contourMovements[i], bs);
                v(vert.x, vert.y, depth + z);
            }

            for (let h = 0, hl = holes.length; h < hl; h++) {
                const ahole = holes[h];
                oneHoleMovements = holesMovements[h];
                for (let i = 0, il = ahole.length; i < il; i++) {
                    const vert = this.scalePoint2(ahole[i], oneHoleMovements[i], bs);
                    v(vert.x, vert.y, depth + z);
                }
            }
        }

        function buildLidFaces() {
            const start = verticesArray.length / 3;

            if (bevelEnabled) {
                let layer = 0;
                let offset = vlen * layer;

                // Bottom faces
                for (let i = 0; i < flen; i++) {
                    const face = faces[i];
                    f3(face[2] + offset, face[1] + offset, face[0] + offset);
                }

                layer = steps + bevelSegments * 2;
                offset = vlen * layer;

                // Top faces
                for (let i = 0; i < flen; i++) {
                    const face = faces[i];
                    f3(face[0] + offset, face[1] + offset, face[2] + offset);
                }

            } else {
                // Bottom faces
                for (let i = 0; i < flen; i++) {
                    const face = faces[i];
                    f3(face[2], face[1], face[0]);
                }

                // Top faces
                for (let i = 0; i < flen; i++) {
                    const face = faces[i];
                    f3(face[0] + vlen * steps, face[1] + vlen * steps, face[2] + vlen * steps);
                }
            }

            self.addGroup(start, verticesArray.length / 3 - start, 0);
        }

        function buildSideFaces() {
            const start = verticesArray.length / 3;
            let layeroffset = 0;
            sidewalls(contour, layeroffset);
            layeroffset += contour.length;

            for (let h = 0, hl = holes.length; h < hl; h++) {
                const ahole = holes[h];
                sidewalls(ahole, layeroffset);
                layeroffset += ahole.length;
            }

            self.addGroup(start, verticesArray.length / 3 - start, 1);
        }

        function sidewalls(contour: Vector2[], layeroffset: number) {
            let i = contour.length;
            while (--i >= 0) {
                const j = i;
                let k = i - 1;
                if (k < 0) k = contour.length - 1;
                for (let s = 0, sl = (steps + bevelSegments * 2); s < sl; s++) {
                    const slen1 = vlen * s;
                    const slen2 = vlen * (s + 1);

                    const a = layeroffset + j + slen1,
                        b = layeroffset + k + slen1,
                        c = layeroffset + k + slen2,
                        d = layeroffset + j + slen2;

                    f4(a, b, c, d);
                }
            }
        }

        function v(x: number, y: number, z: number) {
            placeholder.push(x);
            placeholder.push(y);
            placeholder.push(z);
        }

        function f3(a: number, b: number, c: number) {
            addVertex(a);
            addVertex(b);
            addVertex(c);

            const nextIndex = verticesArray.length / 3;
            const uvs = WorldUVGenerator.generateTopUV(verticesArray, nextIndex - 3, nextIndex - 2, nextIndex - 1);

            addUV(uvs[0]);
            addUV(uvs[1]);
            addUV(uvs[2]);
        }

        function f4(a: number, b: number, c: number, d: number) {
            addVertex(a);
            addVertex(b);
            addVertex(d);

            addVertex(b);
            addVertex(c);
            addVertex(d);

            const nextIndex = verticesArray.length / 3;
            const uvs = WorldUVGenerator.generateSideWallUV(verticesArray, nextIndex - 6, nextIndex - 3, nextIndex - 2, nextIndex - 1);

            addUV(uvs[0]);
            addUV(uvs[1]);
            addUV(uvs[3]);

            addUV(uvs[1]);
            addUV(uvs[2]);
            addUV(uvs[3]);
        }

        function addVertex(index: number) {
            verticesArray.push(placeholder[index * 3 + 0]);
            verticesArray.push(placeholder[index * 3 + 1]);
            verticesArray.push(placeholder[index * 3 + 2]);
        }

        function addUV(vector2: Vector2) {
            uvArray.push(vector2.x);
            uvArray.push(vector2.y);
        }

        buildLidFaces();

        buildSideFaces();
    }

    protected scalePoint2(pt: Vector2, vec: Vector2, size: number) {
        return pt.clone().addScaledVector(vec, size);
    }

    protected getBevelVec(inPt: Vector2, inPrev: Vector2, inNext: Vector2) {
        let v_trans_x, v_trans_y, shrink_by;

        const v_prev_x = inPt.x - inPrev.x, v_prev_y = inPt.y - inPrev.y;
        const v_next_x = inNext.x - inPt.x, v_next_y = inNext.y - inPt.y;

        const v_prev_lensq = (v_prev_x * v_prev_x + v_prev_y * v_prev_y);

        const collinear0 = (v_prev_x * v_next_y - v_prev_y * v_next_x);

        if (Math.abs(collinear0) > Number.EPSILON) {
            const v_prev_len = Math.sqrt(v_prev_lensq);
            const v_next_len = Math.sqrt(v_next_x * v_next_x + v_next_y * v_next_y);

            const ptPrevShift_x = (inPrev.x - v_prev_y / v_prev_len);
            const ptPrevShift_y = (inPrev.y + v_prev_x / v_prev_len);

            const ptNextShift_x = (inNext.x - v_next_y / v_next_len);
            const ptNextShift_y = (inNext.y + v_next_x / v_next_len);

            const sf = ((ptNextShift_x - ptPrevShift_x) * v_next_y - (ptNextShift_y - ptPrevShift_y) * v_next_x) / (v_prev_x * v_next_y - v_prev_y * v_next_x);

            v_trans_x = (ptPrevShift_x + v_prev_x * sf - inPt.x);
            v_trans_y = (ptPrevShift_y + v_prev_y * sf - inPt.y);

            const v_trans_lensq = (v_trans_x * v_trans_x + v_trans_y * v_trans_y);
            if (v_trans_lensq <= 2) {
                return new Vector2(v_trans_x, v_trans_y);
            } else {
                shrink_by = Math.sqrt(v_trans_lensq / 2);
            }

        } else {
            let direction_eq = false;
            if (v_prev_x > Number.EPSILON) {
                if (v_next_x > Number.EPSILON) {
                    direction_eq = true;
                }
            } else {
                if (v_prev_x < - Number.EPSILON) {
                    if (v_next_x < - Number.EPSILON) {
                        direction_eq = true;
                    }
                } else {
                    if (Math.sign(v_prev_y) === Math.sign(v_next_y)) {
                        direction_eq = true;
                    }
                }
            }

            if (direction_eq) {
                v_trans_x = - v_prev_y;
                v_trans_y = v_prev_x;
                shrink_by = Math.sqrt(v_prev_lensq);
            } else {
                v_trans_x = v_prev_x;
                v_trans_y = v_prev_y;
                shrink_by = Math.sqrt(v_prev_lensq / 2);
            }
        }

        return new Vector2(v_trans_x / shrink_by, v_trans_y / shrink_by);
    }
}

class WorldUVGenerator {
    public static generateTopUV(vertices: any, indexA: number, indexB: number, indexC: number): Vector2[] {
        const a_x = vertices[indexA * 3];
        const a_y = vertices[indexA * 3 + 1];
        const b_x = vertices[indexB * 3];
        const b_y = vertices[indexB * 3 + 1];
        const c_x = vertices[indexC * 3];
        const c_y = vertices[indexC * 3 + 1];

        return [
            new Vector2(a_x, a_y),
            new Vector2(b_x, b_y),
            new Vector2(c_x, c_y)
        ];
    }

    public static generateSideWallUV(vertices: any, indexA: number, indexB: number, indexC: number, indexD: number): Vector2[] {
        const a_x = vertices[indexA * 3];
        const a_y = vertices[indexA * 3 + 1];
        const a_z = vertices[indexA * 3 + 2];
        const b_x = vertices[indexB * 3];
        const b_y = vertices[indexB * 3 + 1];
        const b_z = vertices[indexB * 3 + 2];
        const c_x = vertices[indexC * 3];
        const c_y = vertices[indexC * 3 + 1];
        const c_z = vertices[indexC * 3 + 2];
        const d_x = vertices[indexD * 3];
        const d_y = vertices[indexD * 3 + 1];
        const d_z = vertices[indexD * 3 + 2];

        if (Math.abs(a_y - b_y) < Math.abs(a_x - b_x)) {
            return [
                new Vector2(a_x, 1 - a_z),
                new Vector2(b_x, 1 - b_z),
                new Vector2(c_x, 1 - c_z),
                new Vector2(d_x, 1 - d_z)
            ];
        }

        return [
            new Vector2(a_y, 1 - a_z),
            new Vector2(b_y, 1 - b_z),
            new Vector2(c_y, 1 - c_z),
            new Vector2(d_y, 1 - d_z)
        ];
    }
}
