import { VertexGPUBuffer } from "../../gfx/graphics/webGpu/core/buffer/VertexGPUBuffer";
import { ShaderReflection } from "../../gfx/graphics/webGpu/shader/value/ShaderReflectionInfo";
import { VertexAttributeData } from "./VertexAttributeData";
import { GeometryVertexType } from "./GeometryVertexType";
import { VertexBufferLayout, VertexAttribute } from "./VertexAttribute";
import { VertexAttributeSize } from "./VertexAttributeSize";
import { VertexAttributeName } from "./VertexAttributeName";


/**
 * Holds the vertex attribute data of a geometry and manages its backing
 * GPU vertex buffer and attribute layout.
 * @group Geometry
 */
export class GeometryVertexBuffer {

    public vertexCount: number = 0;
    public vertexGPUBuffer: VertexGPUBuffer;
    public geometryType: GeometryVertexType = GeometryVertexType.split;
    /**
     * Set to `true` whenever `vertexGPUBuffer` is replaced by a fresh
     * allocation (first build or a packing-size change). Consumers that
     * captured the GPU buffer handle — e.g. compute pipelines writing
     * deformed/generated vertices — must observe this flag and rebind,
     * otherwise they keep writing into an orphaned buffer while the
     * renderer draws the new one. The owner resets it after handling.
     */
    public bufferChanged: boolean = false;
    private _vertexBufferLayouts: VertexBufferLayout[];
    private _attributeSlotLayouts: VertexAttribute[][];
    private _attributeLocation: { [attribute: string]: number };
    /** Float count the current `vertexGPUBuffer` was allocated with, used
     *  to reuse the same GPU buffer when the packing size is unchanged. */
    private _allocFloatCount: number = -1;

    /**
     * Canonical interleaved packing for `compose` geometry, keyed by
     * attribute NAME and shared by every consuming pass. Built once as the
     * union of all attributes any pass's shader reflection has declared
     * (append-only, so byte offsets never move). Decouples the buffer's
     * physical byte layout — a property of the geometry data — from each
     * pass's VertexState, which assigns its own shader locations via
     * `@location(auto)`. Two passes that disagree on locations (e.g. a
     * color pass with TANGENT vs a shadow pass without) therefore share one
     * stable buffer instead of forcing a re-pack/re-alloc or identical
     * defines. `_composeStride` is the per-vertex float count.
     */
    private _composeCanonical: VertexAttribute[] = [];
    private _composeStride: number = 0;

    /**
     * Canonical packing for `compose_bin` geometry. Unlike `compose`, the
     * byte layout here is fixed by the source interleave (a single pre-packed
     * `all` buffer), so offsets cannot be assigned from shader-reflection
     * order — the loader records the real per-attribute offset/stride via
     * {@link setComposeBinLayout}. `_composeBinStride` is the per-vertex float
     * count (== geometry.vertexDim). When unset, `createComposBinVertexBuffer`
     * falls back to the legacy reflection-order behaviour.
     */
    private _composeBinLayout: VertexAttribute[] = null;
    private _composeBinStride: number = 0;

    /**
     * Record the real interleave layout of a `compose_bin` geometry's packed
     * vertex buffer (attribute name → byte offset within the stride), so each
     * pass's VertexState can be derived independently of how many attributes
     * that pass's shader declares.
     */
    public setComposeBinLayout(layout: VertexAttribute[]) {
        this._composeBinLayout = layout;
        let stride = 0;
        for (let i = 0; i < layout.length; i++) stride += layout[i].stride;
        this._composeBinStride = stride;
    }

    /** The interleave layout recorded by {@link setComposeBinLayout}, or null. */
    public get composeBinLayout(): VertexAttribute[] {
        return this._composeBinLayout;
    }

    constructor() {
        this._vertexBufferLayouts = [];
        this._attributeLocation = {};
        this._attributeSlotLayouts = [];
    }

    public get vertexBufferLayouts() {
        return this._vertexBufferLayouts;
    }

    /**
     * Vertex buffer layout for a specific pass's pipeline VertexState. For
     * `compose` geometry this is derived per-pass from the pass's shader
     * reflection: each attribute the pass declares is mapped to its own
     * `shaderLocation` but the canonical (by-name) byte offset and the
     * shared canonical `arrayStride`, so a pass simply strides over the
     * attributes it does not read. For `split` / `compose_bin` it falls
     * back to the shared layout (their per-pass decoupling is not done
     * yet). Consumed by RenderShaderPass.createPipeline; draw-time binding
     * still uses {@link vertexBufferLayouts}.
     */
    public getPipelineLayout(shaderReflection: ShaderReflection): VertexBufferLayout[] {
        // Pick the canonical (by-name) packing for the interleaved types.
        let canonical: VertexAttribute[];
        let stride: number;
        if (this.geometryType === GeometryVertexType.compose) {
            canonical = this._composeCanonical;
            stride = this._composeStride;
        } else if (this.geometryType === GeometryVertexType.compose_bin && this._composeBinLayout) {
            canonical = this._composeBinLayout;
            stride = this._composeBinStride;
        } else {
            // split / legacy compose_bin: per-pass decoupling not applicable.
            return this._vertexBufferLayouts;
        }

        let attributes: VertexAttribute[] = [];
        for (let i = 0; i < shaderReflection.attributes.length; i++) {
            const attributeInfo = shaderReflection.attributes[i];
            if (attributeInfo.name == `index`) continue;
            if (attributeInfo.type == `builtin`) continue;
            const c = canonical.find(x => x.name == attributeInfo.name);
            if (!c) continue;
            attributes.push({
                name: attributeInfo.name,
                format: attributeInfo.format,
                offset: c.offset,
                shaderLocation: attributeInfo.location,
                stride: VertexAttributeSize[attributeInfo.format]
            });
        }
        return [{
            name: `composeStruct`,
            arrayStride: stride * 4,
            stepMode: `vertex`,
            attributes: attributes,
            offset: 0,
            size: this.vertexCount * stride * 4
        }];
    }

    /**
     * Allocate the backing GPU vertex buffer, reusing the existing one
     * when the required float count is unchanged so its handle stays
     * stable across the per-pass `generate()` calls. The buffer's
     * interleaved/split packing is a property of the geometry data, not
     * of any single consuming pass, so re-running `generate()` for a
     * different pass must not orphan a buffer that compute consumers
     * already bound. Only a genuine size change forces a new allocation,
     * which is signalled via `bufferChanged`.
     */
    private allocVertexBuffer(floatCount: number) {
        if (this.vertexGPUBuffer && this._allocFloatCount === floatCount) return;
        this.vertexGPUBuffer = new VertexGPUBuffer(floatCount);
        this._allocFloatCount = floatCount;
        this.bufferChanged = true;
    }

    /**
     * Whether `createVertexBuffer` must run for this pass's reflection (on
     * top of the geometry's own `_onChange`). For `compose` this is true
     * only when the reflection introduces an attribute not yet in the
     * canonical packing — after the union converges, repeated passes
     * short-circuit so a compute-written buffer is not re-uploaded with
     * rest-pose data. For `split` / `compose_bin` it preserves the legacy
     * "a declared shader slot is missing from the layout" check.
     */
    public needsRebuild(shaderReflection: ShaderReflection): boolean {
        if (this.geometryType === GeometryVertexType.compose) {
            return shaderReflection.attributes.some(a =>
                a.name !== 'index'
                && (a as any).type !== 'builtin'
                && !this._composeCanonical.some(c => c.name == a.name));
        }
        if (this.geometryType === GeometryVertexType.compose_bin && this._composeBinLayout) {
            // Layout is the full source interleave; a pass declaring a subset
            // never needs a rebuild once the buffer exists.
            return shaderReflection.attributes.some(a =>
                a.name !== 'index'
                && (a as any).type !== 'builtin'
                && !this._composeBinLayout.some(c => c.name == a.name));
        }
        const layouts = this._vertexBufferLayouts;
        return shaderReflection.attributes.some(a =>
            a.name !== 'index'
            && (a as any).type !== 'builtin'
            && layouts?.[a.location] === undefined);
    }

    public createVertexBuffer(vertexDataInfos: Map<string, VertexAttributeData>, shaderReflection: ShaderReflection) {
        switch (this.geometryType) {
            case GeometryVertexType.split:
                this.createSplitVertexBuffer(vertexDataInfos, shaderReflection);
                break;
            case GeometryVertexType.compose:
                this.createComposeVertexBuffer(vertexDataInfos, shaderReflection);
                break;
            case GeometryVertexType.compose_bin:
                this.createComposBinVertexBuffer(vertexDataInfos, shaderReflection);
                break;
        }
    }

    private createSplitVertexBuffer(vertexDataInfos: Map<string, VertexAttributeData>, shaderReflection: ShaderReflection) {
        let vertexOffset = 0;
        for (let i = 0; i < shaderReflection.attributes.length; i++) {
            const attributeInfo = shaderReflection.attributes[i];

            if (attributeInfo.name == `index`) continue;
            this._attributeLocation[attributeInfo.name] = attributeInfo.location;

            let attributeLayout: VertexAttribute = {
                name: attributeInfo.name,
                format: attributeInfo.format,
                offset: 0,
                shaderLocation: attributeInfo.location,
                stride: VertexAttributeSize[attributeInfo.format]
            }

            this._attributeSlotLayouts[attributeInfo.location] = [attributeLayout];

            let vertexInfo = vertexDataInfos.get(attributeInfo.name);
            if (!vertexInfo) {
                vertexInfo = {
                    attribute: attributeInfo.name,
                    data: new Float32Array(attributeInfo.size * this.vertexCount)
                }
                vertexDataInfos.set(attributeInfo.name, vertexInfo);
            }

            let len = vertexInfo.data.length / attributeLayout.stride;
            if (this.vertexCount != 0 && this.vertexCount != len) {
                console.error(" vertex count not match attribute count");
            }
            this.vertexCount = len;

            this._vertexBufferLayouts[attributeInfo.location] = {
                name: attributeInfo.name,
                arrayStride: attributeInfo.size * 4,
                stepMode: `vertex`,
                attributes: this._attributeSlotLayouts[attributeInfo.location],
                offset: vertexOffset * 4,
                size: this.vertexCount * attributeInfo.size * 4
            }

            vertexOffset += this.vertexCount * attributeInfo.size;
        }

        this.allocVertexBuffer(vertexOffset);
    }

    private createComposeVertexBuffer(vertexDataInfos: Map<string, VertexAttributeData>, shaderReflection: ShaderReflection) {
        // Vertex count from any attribute that already carries data.
        for (let i = 0; i < shaderReflection.attributes.length; i++) {
            const attributeInfo = shaderReflection.attributes[i];
            if (attributeInfo.name == `index` || attributeInfo.type == `builtin`) continue;
            const info = vertexDataInfos.get(attributeInfo.name);
            if (info && info.data) {
                let len = info.data.length / VertexAttributeSize[attributeInfo.format];
                if (this.vertexCount != 0 && this.vertexCount != len) {
                    console.error(" vertex count not match attribute count");
                }
                this.vertexCount = len;
            }
        }

        // Register this pass's attributes into the canonical by-name packing.
        // Append-only: a new attribute grows the stride at the end, so byte
        // offsets of already-packed attributes never move. Missing attribute
        // data is zero-filled so shaders that read it (e.g. a uv the geometry
        // lacks) sample zeros — the existing contract.
        for (let i = 0; i < shaderReflection.attributes.length; i++) {
            const attributeInfo = shaderReflection.attributes[i];
            if (attributeInfo.name == `index` || attributeInfo.type == `builtin`) continue;
            const size = VertexAttributeSize[attributeInfo.format];
            if (!this._composeCanonical.some(c => c.name == attributeInfo.name)) {
                this._composeCanonical.push({
                    name: attributeInfo.name,
                    format: attributeInfo.format,
                    offset: this._composeStride * 4,
                    shaderLocation: this._composeCanonical.length,
                    stride: size
                });
                this._composeStride += size;
            }
            if (!vertexDataInfos.get(attributeInfo.name)) {
                vertexDataInfos.set(attributeInfo.name, {
                    attribute: attributeInfo.name,
                    data: new Float32Array(size * this.vertexCount)
                });
            }
        }

        // Draw-time layout (single interleaved buffer). Indexed by name via
        // _attributeLocation so upload()/updateAttributes write at canonical
        // offsets; the attributes array is unused by setVertexBuffer.
        this._attributeSlotLayouts[0] = this._composeCanonical;
        this._attributeLocation = {};
        for (let k = 0; k < this._composeCanonical.length; k++) {
            this._attributeLocation[this._composeCanonical[k].name] = k;
        }

        this._vertexBufferLayouts[0] = {
            name: `composeStruct`,
            arrayStride: this._composeStride * 4,
            stepMode: `vertex`,
            attributes: this._composeCanonical,
            offset: 0,
            size: this.vertexCount * this._composeStride * 4
        }

        this.allocVertexBuffer(this.vertexCount * this._composeStride);
    }

    private createComposBinVertexBuffer(vertexDataInfos: Map<string, VertexAttributeData>, shaderReflection: ShaderReflection) {
        const att_all = vertexDataInfos.get(VertexAttributeName.all);

        // Preferred path: the loader recorded the real interleave layout, so
        // the stride is the source vertex dim and every attribute keeps its
        // true byte offset regardless of which subset a pass declares.
        if (this._composeBinLayout && this._composeBinStride > 0) {
            const stride = this._composeBinStride;
            this.vertexCount = att_all.data.length / stride;

            this._attributeSlotLayouts[0] = this._composeBinLayout;
            this._attributeLocation = {};
            for (let k = 0; k < this._composeBinLayout.length; k++) {
                this._attributeLocation[this._composeBinLayout[k].name] = k;
            }

            this._vertexBufferLayouts[0] = {
                name: `composeStruct`,
                arrayStride: stride * 4,
                stepMode: `vertex`,
                attributes: this._composeBinLayout,
                offset: 0,
                size: this.vertexCount * stride * 4
            }

            this.allocVertexBuffer(this.vertexCount * stride);
            return;
        }

        // Legacy fallback: derive offsets from shader-reflection order (only
        // correct when the reflection declares the full interleave in order).
        this._attributeSlotLayouts[0] = [];
        let attributeOffset = 0;
        for (let i = 0; i < shaderReflection.attributes.length; i++) {
            const attributeInfo = shaderReflection.attributes[i];
            if (attributeInfo.name == `index`) continue;
            if (attributeInfo.type == `builtin`) continue;
            this._attributeLocation[attributeInfo.name] = attributeInfo.location;

            let attributeLayout: VertexAttribute = {
                name: attributeInfo.name,
                format: attributeInfo.format,
                offset: attributeOffset * 4,
                shaderLocation: attributeInfo.location,
                stride: VertexAttributeSize[attributeInfo.format]
            }
            this._attributeSlotLayouts[0][attributeInfo.location] = attributeLayout;

            let vertexInfo = vertexDataInfos.get(attributeInfo.name);
            if (!vertexInfo) {
                vertexInfo = {
                    attribute: attributeInfo.name,
                    data: new Float32Array(attributeInfo.size * this.vertexCount)
                }
                vertexDataInfos.set(attributeInfo.name, vertexInfo);
            }
            if (vertexInfo.data) {
                let len = vertexInfo.data.length / attributeLayout.stride;
                if (this.vertexCount != 0 && this.vertexCount != len) {
                    console.error(" vertex count not match attribute count");
                }
                this.vertexCount = len;
            }
            attributeOffset += attributeInfo.size;
        }

        let len = att_all.data.length / attributeOffset;
        this.vertexCount = len;

        this._vertexBufferLayouts[0] = {
            name: `composeStruct`,
            arrayStride: attributeOffset * 4,
            stepMode: `vertex`,
            attributes: this._attributeSlotLayouts[0],
            offset: 0,
            size: this.vertexCount * attributeOffset * 4
        }

        this.allocVertexBuffer(this.vertexCount * attributeOffset);
    }

    /**
     * Bumped whenever position data is re-uploaded (`position`, or the packed
     * `all` buffer), so CPU-side consumers such as `MeshBVH` can tell that
     * the vertices moved. See `GeometryBase.version`.
     */
    public positionVersion: number = 0;

    public upload(attribute: string, vertexDataInfo: VertexAttributeData) {
        if (attribute === VertexAttributeName.position || attribute === VertexAttributeName.all) this.positionVersion++;
        if (!this.vertexGPUBuffer) return;
        switch (this.geometryType) {
            case GeometryVertexType.split:
                {
                    let location = this._attributeLocation[attribute];
                    let vertexBufferLayout = this._vertexBufferLayouts[location];
                    this.vertexGPUBuffer.node.setFloat32Array(vertexBufferLayout.offset / 4, vertexDataInfo.data as Float32Array);
                }
                break;
            case GeometryVertexType.compose:
                {
                    for (let i = 0; i < this.vertexCount; i++) {
                        const attributeLayout = this._attributeSlotLayouts[0][this._attributeLocation[attribute]];
                        for (let k = 0; k < attributeLayout.stride; k++) {
                            let atData = vertexDataInfo.data[i * attributeLayout.stride + k];
                            let index = i * (this._vertexBufferLayouts[0].arrayStride / 4) + (attributeLayout.offset / 4) + k;
                            this.vertexGPUBuffer.node.setFloat(atData, index);
                        }
                    }
                }
                break;
            case GeometryVertexType.compose_bin:
                this.vertexGPUBuffer.node.setFloat32Array(0, vertexDataInfo.data as Float32Array);
                break;
        }
        this.vertexGPUBuffer?.apply();
    }

    public updateAttributes(vertexDataInfos: Map<string, VertexAttributeData>) {
        switch (this.geometryType) {
            case GeometryVertexType.split:
                {
                    for (let i = 0; i < this._vertexBufferLayouts.length; i++) {
                        const vertexBufferLayout = this._vertexBufferLayouts[i];
                        let attributeData = vertexDataInfos.get(vertexBufferLayout.name);
                        this.vertexGPUBuffer.node.setFloat32Array(vertexBufferLayout.offset / 4, attributeData.data as Float32Array);
                    }
                }
                break;
            case GeometryVertexType.compose:
                {
                    for (let i = 0; i < this.vertexCount; i++) {
                        this._attributeSlotLayouts.forEach((v) => {
                            for (let j = 0; j < v.length; j++) {
                                const attributeLayout = v[j];
                                let attributeData = vertexDataInfos.get(attributeLayout.name);
                                for (let k = 0; k < attributeLayout.stride; k++) {
                                    let atData = attributeData.data[i * attributeLayout.stride + k];
                                    let index = i * (this._vertexBufferLayouts[0].arrayStride / 4) + (attributeLayout.offset / 4) + k;
                                    this.vertexGPUBuffer.node.setFloat(atData, index);
                                }
                            }
                        });
                    }
                }
                break;

            case GeometryVertexType.compose_bin:
                {
                    let attributeData = vertexDataInfos.get(VertexAttributeName.all);
                    this.vertexGPUBuffer.node.setFloat32Array(0, attributeData.data as Float32Array);
                }
                break;
        }
        this.vertexGPUBuffer.apply();
    }

    public compute() {

    }

    public destroy() {
        this.vertexCount = null;
        this.geometryType = null;
        this._vertexBufferLayouts = null;
        this._attributeSlotLayouts = null;
        this._attributeLocation = null;

        if (this.vertexGPUBuffer)
            this.vertexGPUBuffer.destroy();
        this.vertexGPUBuffer = null;
        this._allocFloatCount = -1;
        this.bufferChanged = false;
        this._composeCanonical = null;
        this._composeStride = 0;
        this._composeBinLayout = null;
        this._composeBinStride = 0;
    }
}