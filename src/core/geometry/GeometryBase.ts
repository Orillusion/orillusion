import { ShaderReflection } from "../../gfx/graphics/webGpu/shader/value/ShaderReflectionInfo";
import { Vector3 } from "../../math/Vector3";
import { UUID } from "../../util/Global";
import { BoundingBox } from "../bound/BoundingBox";
import { VertexAttributeName } from "./VertexAttributeName";
import { GeometryVertexBuffer } from "./GeometryVertexBuffer";
import { GeometryIndicesBuffer } from "./GeometryIndicesBuffer";
import { GeometryVertexType } from "./GeometryVertexType";
import { VertexAttributeData } from "./VertexAttributeData";
import { ArrayBufferData } from "../../gfx/graphics/webGpu/core/buffer/ArrayBufferData";

export type LodLevel = {
    indexStart: number;
    indexCount: number;
    vertexStart: number;
    index: number;
}


/**
 * geometry split more subGeometry descriptor
 * @group Geometry
 */
export class SubGeometry {
    public lodLevels: LodLevel[];
}


/**
 * @group Geometry
 */
export class GeometryBase {

    public uuid: string;
    public name: string;
    public subGeometries: SubGeometry[] = [];
    public morphTargetsRelative: boolean;
    public morphTargetDictionary: { value: string; key: number };
    private _bounds: BoundingBox;

    private _attributeMap: Map<string, VertexAttributeData>;
    private _attributes: string[];
    private _indicesBuffer: GeometryIndicesBuffer;
    private _vertexBuffer: GeometryVertexBuffer;
    constructor() {
        this.uuid = UUID();

        this._attributeMap = new Map<string, VertexAttributeData>();
        this._attributes = [];



        this._vertexBuffer = new GeometryVertexBuffer();
    }

    public get indicesBuffer(): GeometryIndicesBuffer {
        return this._indicesBuffer;
    }

    public get vertexBuffer(): GeometryVertexBuffer {
        return this._vertexBuffer;
    }

    public get vertexAttributes(): string[] {
        return this._attributes;
    }

    public get vertexAttributeMap(): Map<string, VertexAttributeData> {
        return this._attributeMap;
    }

    public get geometryType(): GeometryVertexType {
        return this._vertexBuffer.geometryType;
    }
    public set geometryType(value: GeometryVertexType) {
        this._vertexBuffer.geometryType = value;
    }

    public get bounds(): BoundingBox {
        if (!this._bounds) {
            this._bounds = new BoundingBox(new Vector3(), new Vector3(1, 1, 1));
            this._bounds.min.x = Number.MAX_VALUE;
            this._bounds.min.y = Number.MAX_VALUE;
            this._bounds.min.z = Number.MAX_VALUE;

            this._bounds.max.x = -Number.MAX_VALUE;
            this._bounds.max.y = -Number.MAX_VALUE;
            this._bounds.max.z = -Number.MAX_VALUE;

            let attributes = this.getAttribute(VertexAttributeName.position);
            if (attributes) {
                for (let i = 0; i < attributes.data.length / 3; i++) {
                    const px = attributes.data[i * 3 + 0];
                    const py = attributes.data[i * 3 + 1];
                    const pz = attributes.data[i * 3 + 2];
                    if (this._bounds.min.x > px) {
                        this._bounds.min.x = px;
                    }
                    if (this._bounds.min.y > py) {
                        this._bounds.min.y = py;
                    }
                    if (this._bounds.min.z > pz) {
                        this._bounds.min.z = pz;
                    }

                    if (this._bounds.max.x < px) {
                        this._bounds.max.x = px;
                    }
                    if (this._bounds.max.y < py) {
                        this._bounds.max.y = py;
                    }
                    if (this._bounds.max.z < pz) {
                        this._bounds.max.z = pz;
                    }
                }
            }
            this._bounds.setFromMinMax(this._bounds.min, this._bounds.max);
        }
        return this._bounds;
    }

    public set bounds(value: BoundingBox) {
        this._bounds = value;
    }

    /**
     * add subGeometry from lod level 
     * @param lodLevels @see LodLevel
     */
    public addSubGeometry(...lodLevels: LodLevel[]) {
        let sub = new SubGeometry();
        sub.lodLevels = lodLevels;
        this.subGeometries.push(sub);
    }

    /**
     * create geometry by shaderReflection
     * @param shaderReflection ShaderReflection
     */
    generate(shaderReflection: ShaderReflection) {
        this._indicesBuffer.upload(this.getAttribute(VertexAttributeName.indices).data);
        this._vertexBuffer.createVertexBuffer(this._attributeMap, shaderReflection);
        this._vertexBuffer.updateAttributes(this._attributeMap);
    }

    public setIndices(data: ArrayBufferData) {
        if (!this._attributeMap.has(VertexAttributeName.indices)) {
            let vertexInfo: VertexAttributeData = {
                attribute: VertexAttributeName.indices,
                data: data,
            }
            this._attributeMap.set(VertexAttributeName.indices, vertexInfo);
            this._indicesBuffer = new GeometryIndicesBuffer();
            this._indicesBuffer.createIndicesBuffer(vertexInfo);
        }
    }

    public setAttribute(attribute: string, data: ArrayBufferData) {
        if (attribute == VertexAttributeName.indices) {
            this.setIndices(data);
        } else {
            let vertexInfo: VertexAttributeData = {
                attribute: attribute,
                data: data,
            }
            this._attributeMap.set(attribute, vertexInfo);
            this._attributes.push(attribute);
        }
    }

    public getAttribute(attribute: string): VertexAttributeData {
        return this._attributeMap.get(attribute) as VertexAttributeData;
    }

    public hasAttribute(attribute: string): boolean {
        return this._attributeMap.has(attribute);
    }

    public genWireframe(): Vector3[] {
        let positionAttribute = this.getAttribute(`position`);
        let indexAttribute = this.getAttribute(`indices`);
        if (indexAttribute && positionAttribute && indexAttribute.data.length > 0) {
            let vertexData = positionAttribute.data;
            let lines = [];
            for (let i = 0; i < indexAttribute.data.length / 3; i++) {
                const i1 = indexAttribute.data[i * 3 + 0];
                const i2 = indexAttribute.data[i * 3 + 1];
                const i3 = indexAttribute.data[i * 3 + 2];

                let p1 = new Vector3(vertexData[i1 * 3 + 0], vertexData[i1 * 3 + 1], vertexData[i1 * 3 + 2]);
                let p2 = new Vector3(vertexData[i2 * 3 + 0], vertexData[i2 * 3 + 1], vertexData[i2 * 3 + 2]);
                let p3 = new Vector3(vertexData[i3 * 3 + 0], vertexData[i3 * 3 + 1], vertexData[i3 * 3 + 2]);

                lines.push(p1, p2);
                lines.push(p2, p3);
                lines.push(p3, p1);
            }
            return lines;
        }
        return null;
    }

    public compute() {
        if (this._indicesBuffer) {
            this._indicesBuffer.compute();
        }

        if (this._vertexBuffer) {
            this._vertexBuffer.compute();
        }
    }

    private static crossA: Vector3 = Vector3.UP.clone();
    private static crossB: Vector3 = Vector3.UP.clone();
    private static crossRet: Vector3 = Vector3.UP.clone();

    private static point1: Vector3 = Vector3.UP.clone();
    private static point2: Vector3 = Vector3.UP.clone();
    private static point3: Vector3 = Vector3.UP.clone();

    // compute normal by vertex position
    public computeNormals(): this {
        let posAttrData = this.getAttribute(VertexAttributeName.position);
        let normalAttrData = this.getAttribute(VertexAttributeName.normal);
        let indexAttrData = this.getAttribute(VertexAttributeName.indices);

        if (!posAttrData || !normalAttrData || !indexAttrData) {
            return this;

        }
        let trianglesCount = indexAttrData.data.length / 3;
        let point1 = GeometryBase.point1;
        let point2 = GeometryBase.point2;
        let point3 = GeometryBase.point3;
        let crossA = GeometryBase.crossA;
        let crossB = GeometryBase.crossB;
        let crossRet = GeometryBase.crossRet;

        for (let i = 0; i < trianglesCount; i++) {
            let index1 = indexAttrData.data[i * 3];
            let index2 = indexAttrData.data[i * 3 + 1];
            let index3 = indexAttrData.data[i * 3 + 2];

            point1.set(posAttrData.data[index1 * 3], posAttrData.data[index1 * 3 + 1], posAttrData.data[index1 * 3 + 2]);
            point2.set(posAttrData.data[index2 * 3], posAttrData.data[index2 * 3 + 1], posAttrData.data[index2 * 3 + 2]);
            point3.set(posAttrData.data[index3 * 3], posAttrData.data[index3 * 3 + 1], posAttrData.data[index3 * 3 + 2]);

            Vector3.sub(point1, point2, crossA).normalize();
            Vector3.sub(point1, point3, crossB).normalize();

            let normal = Vector3.cross(crossA, crossB, crossRet).normalize();

            normalAttrData.data[index1 * 3] = normalAttrData.data[index2 * 3] = normalAttrData.data[index3 * 3] = normal.x;
            normalAttrData.data[index1 * 3 + 1] = normalAttrData.data[index2 * 3 + 1] = normalAttrData.data[index3 * 3 + 1] = normal.y;
            normalAttrData.data[index1 * 3 + 2] = normalAttrData.data[index3 * 3 + 2] = normalAttrData.data[index3 * 3 + 2] = normal.z;
        }

        // normal attr need to be upload
        this._vertexBuffer.upload(VertexAttributeName.normal, normalAttrData);

        return this;
    }

    public isPrimitive(): boolean {
        return false;// this.geometrySource != null && this.geometrySource.type != 'none';
    }

    destroy(force?: boolean) {
        this.uuid = null;
        this.name = null;
        this.subGeometries = null;
        this.morphTargetDictionary = null;

        this._bounds.destroy();
        this._bounds = null;

        this._attributeMap = null;
        this._attributes = null;

        this._indicesBuffer.destroy();
        this._vertexBuffer.destroy();

        this._indicesBuffer = null;
        this._vertexBuffer = null;
    }
}
