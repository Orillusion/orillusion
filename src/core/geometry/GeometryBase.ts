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

    public isPrimitive(): boolean {
        return false;// this.geometrySource != null && this.geometrySource.type != 'none';
    }
}
