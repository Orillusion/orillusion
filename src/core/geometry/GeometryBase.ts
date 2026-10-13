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
import { BlendShapeData } from "../../loader/parser/prefab/prefabData/BlendShapeData";
import { Matrix4 } from "../../math/Matrix4";

export type LODDescriptor = {
    indexStart: number;
    indexCount: number;
    vertexStart: number;
    vertexCount: number;
    firstStart: number;
    index: number;
    topology: number;
}


/**
 * geometry split more subGeometry descriptor
 * @group Geometry
 */
export class SubGeometry {
    /** The LOD levels making up this sub-geometry. */
    public lodLevels: LODDescriptor[];
}


/**
 * Base class for all geometries, holding vertex/index attribute data,
 * GPU buffers, bounds and the logic to generate them for rendering.
 * @group Geometry
 */
export class GeometryBase {

    /** Unique identifier of this geometry instance. */
    public instanceID: string;
    /** Human-readable name of this geometry. */
    public name: string;
    /** Sub-geometries with their per-LOD draw descriptors. */
    public subGeometries: SubGeometry[] = [];
    /** Whether morph targets are stored as relative offsets. */
    public morphTargetsRelative: boolean;
    /** Maps morph-target names to their attribute indices. */
    public morphTargetDictionary: { [blenderName: string]: number };
    /** Names of the skin joints used by this geometry. */
    public skinNames: string[];
    /** Inverse bind-pose matrices for skinning. */
    public bindPose: Matrix4[];
    /** Blend-shape (morph target) data for this geometry. */
    public blendShapeData: BlendShapeData;
    /** Number of floats per vertex for interleaved buffers. */
    public vertexDim: number;
    /** Number of vertices in this geometry. */
    public vertexCount: number = 0;

    private _bounds: BoundingBox;
    private _attributeMap: Map<string, VertexAttributeData>;
    private _attributes: string[];
    private _indicesBuffer: GeometryIndicesBuffer;
    private _vertexBuffer: GeometryVertexBuffer;
    private _onChange: boolean = true;
    private _version: number = 0;
    private _wireframeLines: Vector3[];

    constructor() {
        this.instanceID = UUID();
        this._attributeMap = new Map<string, VertexAttributeData>();
        this._attributes = [];
        this._vertexBuffer = new GeometryVertexBuffer();
    }

    /**
     * Change counter for the CPU-side triangle data: bumped by
     * `setIndices` / `setVertexs` / `setAttribute` and whenever positions are
     * re-uploaded through `vertexBuffer.upload`. Code that caches derived
     * data (e.g. `MeshBVH`) compares it to detect stale caches. Editing the
     * position array in place without uploading is not detected.
     */
    public get version(): number {
        return this._version + this._vertexBuffer.positionVersion;
    }

    /** Get the GPU index buffer of this geometry. */
    public get indicesBuffer(): GeometryIndicesBuffer {
        return this._indicesBuffer;
    }

    /** Get the GPU vertex buffer of this geometry. */
    public get vertexBuffer(): GeometryVertexBuffer {
        return this._vertexBuffer;
    }

    /** Get the list of vertex attribute names present on this geometry. */
    public get vertexAttributes(): string[] {
        return this._attributes;
    }

    /** Get the map from attribute name to its vertex attribute data. */
    public get vertexAttributeMap(): Map<string, VertexAttributeData> {
        return this._attributeMap;
    }

    /** Get the vertex layout type of this geometry. */
    public get geometryType(): GeometryVertexType {
        return this._vertexBuffer.geometryType;
    }
    /** Set the vertex layout type of this geometry. */
    public set geometryType(value: GeometryVertexType) {
        this._vertexBuffer.geometryType = value;
    }

    /** Get the bounding box of this geometry, computing it from positions on first access. */
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
            if (attributes && attributes.data) {
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

    /** Set the bounding box of this geometry. */
    public set bounds(value: BoundingBox) {
        this._bounds = value;
    }


    /**
     * add subGeometry from lod level 
     * @param lodLevels @see LODDescriptor
     */
    public addSubGeometry(...lodLevels: LODDescriptor[]): SubGeometry {
        let sub = new SubGeometry();
        sub.lodLevels = lodLevels;
        this.subGeometries.push(sub);
        return sub;
    }

    /**
     * Build the GPU vertex buffer + buffer-layout array from this
     * geometry's attribute data, driven by the consuming pass's
     * `ShaderReflection`. The layout array is indexed by shader slot
     * (`attribute.location`), so the LAYOUT contents depend on which
     * attributes the shader actually declares.
     *
     * Originally this was gated purely on `_onChange` — i.e. ran once
     * after the geometry's attribute data was set. That broke
     * multi-pass materials: when a single geometry is consumed by a
     * color pass that declares N attributes (say position / normal /
     * uv) AND a depth pass that declares N+1 (adding TEXCOORD_1 at
     * slot 3 via VertexAttributes #include), the color pass ran
     * first, populated slots 0..N-1, and cleared `_onChange`. The
     * depth pass's `generate` call was then a no-op, so the pipeline
     * built with `vertexBufferLayouts` was missing slot N — WebGPU
     * rejects it with "Vertex attribute slot X used in shader is not
     * present in VertexState".
     *
     * The fix: rebuild also when the incoming reflection requires a
     * slot the current layout array doesn't yet have. The data is
     * already in `_attributeMap`; `createVertexBuffer` will pick up
     * the missing slot. We keep the `_onChange` short-circuit for the
     * normal "shader requirements unchanged" case so dynamic geometry
     * updates don't pay a per-frame `createVertexBuffer` cost.
     */
    generate(shaderReflection: ShaderReflection) {
        if (!this._onChange) {
            // A pass may need a buffer rebuild even when the geometry data
            // is unchanged — its reflection can require an attribute the
            // current packing doesn't hold yet. GeometryVertexBuffer decides
            // this per layout type (canonical-by-name for compose, slot
            // presence for split/compose_bin).
            if (!this._vertexBuffer?.needsRebuild(shaderReflection)) return;
        }
        this._onChange = false;
        this._indicesBuffer.upload(this.getAttribute(VertexAttributeName.indices).data);
        this._vertexBuffer.createVertexBuffer(this._attributeMap, shaderReflection);
        this._vertexBuffer.updateAttributes(this._attributeMap);
        this.vertexCount = this._vertexBuffer.vertexCount;
    }

    /**
     * Set the index data of this geometry, creating its index buffer.
     * @param data the index buffer data
     */
    public setIndices(data: ArrayBufferData) {
        this._version++;
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

    /**
     * Set the position (vertex) data of this geometry.
     * @param data the position buffer data
     */
    public setVertexs(data: ArrayBufferData) {
        this._version++;
        let vertexInfo: VertexAttributeData = {
            attribute: VertexAttributeName.position,
            data: data,
        }
        this._attributeMap.set(vertexInfo.attribute, vertexInfo);
        this._attributes.push(vertexInfo.attribute);
    }

    /**
     * Set the data of a named vertex attribute (or indices/position).
     * @param attribute the attribute name
     * @param data the attribute buffer data
     */
    public setAttribute(attribute: VertexAttributeName | string, data: ArrayBufferData) {
        if (attribute == VertexAttributeName.indices) {
            this.setIndices(data);
        } else if (attribute == VertexAttributeName.position) {
            this.setVertexs(data);
        } else {
            this._version++;
            let vertexInfo: VertexAttributeData = {
                attribute: attribute,
                data: data,
            }
            this._attributeMap.set(attribute, vertexInfo);
            this._attributes.push(attribute);
        }
    }

    /**
     * Get the data of a named vertex attribute.
     * @param attribute the attribute name
     */
    public getAttribute(attribute: VertexAttributeName | string): VertexAttributeData {
        return this._attributeMap.get(attribute) as VertexAttributeData;
    }

    /**
     * Whether this geometry has the given named attribute.
     * @param attribute the attribute name
     */
    public hasAttribute(attribute: VertexAttributeName | string): boolean {
        return this._attributeMap.has(attribute);
    }

    /**
     * Generate (and cache) the line list describing this geometry's wireframe.
     * @returns the wireframe line vertices, or null if not available
     */
    public genWireframe(): Vector3[] {
        if (this._wireframeLines) return this._wireframeLines;
        if (this.geometryType == GeometryVertexType.split || this.geometryType == GeometryVertexType.compose) {
            let positionAttribute = this.getAttribute(VertexAttributeName.position);
            let indexAttribute = this.getAttribute(VertexAttributeName.indices);
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
                this._wireframeLines = lines;
                return lines;
            }
        } else if (this.geometryType == GeometryVertexType.compose_bin) {
            let vertexAttribute = this.getAttribute(VertexAttributeName.all);
            let strip = this.vertexDim;

            let indexAttribute = this.getAttribute(VertexAttributeName.indices);
            if (indexAttribute && vertexAttribute && indexAttribute.data.length > 0) {
                let vertexData = vertexAttribute.data;
                let lines = [];
                for (let i = 0; i < indexAttribute.data.length / 3; i++) {
                    const i1 = indexAttribute.data[i * 3 + 0]; // start by 0
                    const i2 = indexAttribute.data[i * 3 + 1]; // start by 1
                    const i3 = indexAttribute.data[i * 3 + 2]; // start by 2

                    let p1 = new Vector3(vertexData[i1 * strip + 0], vertexData[i1 * strip + 1], vertexData[i1 * strip + 2]);
                    let p2 = new Vector3(vertexData[i2 * strip + 0], vertexData[i2 * strip + 1], vertexData[i2 * strip + 2]);
                    let p3 = new Vector3(vertexData[i3 * strip + 0], vertexData[i3 * strip + 1], vertexData[i3 * strip + 2]);

                    lines.push(p1, p2);
                    lines.push(p2, p3);
                    lines.push(p3, p1);
                }
                this._wireframeLines = lines;
                return lines;
            }
        }

        return null;
    }

    /**
     * Run the compute step on this geometry's index and vertex buffers.
     */
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

    /**
     * Compute per-vertex normals from the position and index data and upload them.
     * @returns this geometry for chaining
     */
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

            Vector3.cross(crossA, crossB, crossRet);
            let normal = crossRet.normalize();

            normalAttrData.data[index1 * 3] = normalAttrData.data[index2 * 3] = normalAttrData.data[index3 * 3] = normal.x;
            normalAttrData.data[index1 * 3 + 1] = normalAttrData.data[index2 * 3 + 1] = normalAttrData.data[index3 * 3 + 1] = normal.y;
            normalAttrData.data[index1 * 3 + 2] = normalAttrData.data[index2 * 3 + 2] = normalAttrData.data[index3 * 3 + 2] = normal.z;
        }

        // normal attr need to be upload
        this._vertexBuffer.upload(VertexAttributeName.normal, normalAttrData);

        return this;
    }

    /**
     * Whether this geometry is a built-in primitive.
     */
    public isPrimitive(): boolean {
        return false;// this.geometrySource != null && this.geometrySource.type != 'none';
    }

    /**
     * Release the buffers and data held by this geometry.
     * @param force whether to force-destroy
     */
    destroy(force?: boolean) {
        this.instanceID = null;
        this.name = null;
        this.subGeometries = null;
        this.morphTargetDictionary = null;

        this._bounds?.destroy();
        this._bounds = null;

        this._attributeMap = null;
        this._attributes = null;

        this._indicesBuffer?.destroy();
        this._vertexBuffer?.destroy();

        this._indicesBuffer = null;
        this._vertexBuffer = null;
    }
}
