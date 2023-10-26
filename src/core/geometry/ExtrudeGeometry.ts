import { Matrix4 } from "../../math/Matrix4";
import { Vector3 } from "../../math/Vector3";
import { BoundingBox } from "../bound/BoundingBox";
import { GeometryBase } from "./GeometryBase";
import { VertexAttributeName } from "./VertexAttributeName";

class Section {
    public normal: Vector3;
    public fixNormal: Vector3;
    public center: Vector3;
    public rotateShape: Vector3[];
    public distance: number = 0;
    public readonly index: number;
    constructor(i: number) {
        this.index = i;
        this.rotateShape = [];
    }
}

export class ExtrudeGeometry extends GeometryBase {
    vScale: number;
    uNegate: boolean;
    sections: Section[];

    /**
     * for the points of start and end:
     * Please ensure that you do not actively clone the starting point to the end of the shape array;
     * closed: true.
     *       if you want them closed, it'll auto clone start point.
     * closed: false.
     *  
     * @param shaderReflection ShaderReflection
     */
    build(shape: Vector3[], isShapeClosed: boolean, path: Vector3[], vScale: number = 1.0, uNegate: boolean = true): this {
        if (path.length < 2) {
            throw new Error('path length is not enough');
        }
        this.vScale = vScale;
        this.uNegate = uNegate;
        shape = shape.slice();//clone array
        isShapeClosed && shape.push(shape[0]);
        this.sections = this.buildSections(shape, path);
        this.buildGeometry(shape, this.sections);
        this.bounds = new BoundingBox(Vector3.ZERO.clone(), new Vector3(100, 100, 100));
        return this;
    }

    private buildSections(shape: Vector3[], path: Vector3[]): Section[] {
        let curPoint: Vector3;
        let nextPoint: Vector3;
        let normal: Vector3;
        let sections: Section[] = [];
        let sectionCount = path.length;

        //calc normal and distance
        for (let i = 0; i < sectionCount; i++) {
            let section = new Section(i);
            curPoint = path[i];
            nextPoint = path[i + 1];
            section.center = curPoint.clone();

            if (nextPoint == null) {
                section.normal = normal.clone();
                section.distance = 0;
            } else {
                normal = nextPoint.subtract(curPoint);
                section.distance = normal.length;
                section.normal = normal.normalize();
            }
            sections.push(section);
        }

        //fix normal
        sections[0].fixNormal = sections[0].normal.clone();
        for (let i = 1; i < sectionCount; i++) {
            let lastSection = sections[i - 1];
            let curSection = sections[i];
            curSection.fixNormal = curSection.normal.add(lastSection.normal).normalize();
        }

        //calc rotation and section 
        let matrixRotate: Matrix4 = new Matrix4().identity();
        for (let i = 0; i < sectionCount; i++) {
            let curSection = sections[i];

            let fromDirection: Vector3;
            let sourceShape: Vector3[];

            if (i == 0) {
                fromDirection = Vector3.UP;
                sourceShape = shape;
            } else {
                let lastSection = sections[i - 1];
                fromDirection = lastSection.fixNormal;
                sourceShape = lastSection.rotateShape;
            }
            Matrix4.fromToRotation(fromDirection, curSection.fixNormal, matrixRotate);
            for (let i = 0, count = shape.length; i < count; i++) {
                let newPoint = matrixRotate.multiplyPoint3(sourceShape[i]);
                curSection.rotateShape.push(newPoint);
            }
        }

        return sections;
    }

    private buildGeometry(shape: Vector3[], sections: Section[]): this {
        let sectionCount = sections.length;
        let shapeVertexCount = shape.length;
        let totalVertexCount = sectionCount * shapeVertexCount;
        let segmentCount = sectionCount - 1;

        let position_arr = new Float32Array(totalVertexCount * 3);
        let normal_arr = new Float32Array(totalVertexCount * 3);
        let uv_arr = new Float32Array(totalVertexCount * 2);
        let indices_arr = new Uint32Array(segmentCount * (shapeVertexCount - 1) * 6);

        let quadCount = shapeVertexCount - 1;

        //
        let vDistance = 0;
        let uDistance = 0;
        let uList: number[] = [0];
        for (let i = 1; i < shapeVertexCount; i++) {
            uDistance += shape[i - 1].subtract(shape[i]).length;
            uList.push(uDistance);
        }

        for (let i = 0; i < sectionCount; i++) {
            let section = sections[i];
            for (let j = 0; j < shapeVertexCount; j++) {
                //position
                let pos_offset = (i * shapeVertexCount + j) * 3;
                let vertex = section.rotateShape[j].add(section.center);
                position_arr[pos_offset] = vertex.x;
                position_arr[pos_offset + 1] = vertex.y;
                position_arr[pos_offset + 2] = vertex.z;
                normal_arr[pos_offset + 1] = 1;

                //uv
                let uv_offset = (i * shapeVertexCount + j) * 2;
                let u = uList[j] / uDistance;
                uv_arr[uv_offset] = this.uNegate ? (1 - u) : u;
                uv_arr[uv_offset + 1] = vDistance * this.vScale;
            }
            vDistance += section.distance;
        }

        let index = 0;
        for (let i = 0; i < segmentCount; i++) {
            let vertexOffset = i * shapeVertexCount;
            for (let j = 0; j < quadCount; j++) {
                //right bottom
                let vertex_rb = j;
                //left bottom
                let vertex_lb = (j + 1);
                //right top
                let vertex_rt = vertex_rb + shapeVertexCount;
                //left top
                let vertex_lt = vertex_lb + shapeVertexCount;

                indices_arr[index++] = vertex_rb + vertexOffset;
                indices_arr[index++] = vertex_lb + vertexOffset;
                indices_arr[index++] = vertex_rt + vertexOffset;

                indices_arr[index++] = vertex_lb + vertexOffset;
                indices_arr[index++] = vertex_lt + vertexOffset;
                indices_arr[index++] = vertex_rt + vertexOffset;
            }
        }

        //
        this.setIndices(indices_arr);
        this.setAttribute(VertexAttributeName.position, position_arr);
        this.setAttribute(VertexAttributeName.normal, normal_arr);
        this.setAttribute(VertexAttributeName.uv, uv_arr);
        this.setAttribute(VertexAttributeName.TEXCOORD_1, uv_arr);
        //
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
        return this;
    }


}