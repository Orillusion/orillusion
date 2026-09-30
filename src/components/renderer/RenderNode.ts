import { EditorInspector } from "../../util/SerializeDecoration";
import { Engine3D } from "../../Engine3D";
import { View3D } from "../../core/View3D";
import { GeometryBase } from "../../core/geometry/GeometryBase";
import { PassGenerate } from "../../gfx/generate/PassGenerate";
import { GlobalBindGroup } from "../../gfx/graphics/webGpu/core/bindGroups/GlobalBindGroup";
import { ShaderReflection } from "../../gfx/graphics/webGpu/shader/value/ShaderReflectionInfo";
import { EntityCollect } from "../../gfx/renderJob/collect/EntityCollect";
import { RTResourceMap } from "../../gfx/renderJob/frame/RTResourceMap";
import { RenderContext } from "../../gfx/renderJob/passRenderer/RenderContext";
import { ClusterLightingBuffer } from "../../gfx/renderJob/passRenderer/cluster/ClusterLightingBuffer";
import { RendererMask, RendererMaskUtil } from "../../gfx/renderJob/passRenderer/state/RendererMask";
import { RendererPassState } from "../../gfx/renderJob/passRenderer/state/RendererPassState";
import { GetCountInstanceID, UUID } from "../../util/Global";
import { Reference } from "../../util/Reference";
import { ComponentBase } from "../ComponentBase";
import { IESProfilesPool } from "../lights/IESProfiles";
import { Octree } from "../../core/tree/octree/Octree";
import { OctreeEntity } from "../../core/tree/octree/OctreeEntity";
import { Transform } from "../Transform";
import { Material } from "../../materials/Material";
import { BatchMode } from "../../gfx/renderJob/config/BatchMode";
import { RenderShaderCompute } from "../../gfx/graphics/webGpu/compute/RenderShaderCompute";
import { PassType } from "../../gfx/renderJob/passRenderer/state/PassType";
import { ProfilerUtil } from "../../util/ProfilerUtil";
import { bindCtx } from "../../gfx/graphics/webGpu/Context3D";


/**
 * @internal
 * @group Components
 */
export class RenderNode extends ComponentBase {

    public instanceCount: number = 0;
    public lodLevel: number = 0;
    public alwaysRender: boolean = false;
    public instanceID: string;
    public drawType: number = 0;

    protected _geometry: GeometryBase;
    protected _materials: Material[] = [];
    protected _castShadow: boolean = true;
    protected _castReflection: boolean = true;
    protected _castGI: boolean = false;
    protected _rendererMask: number = RendererMask.Default;
    protected _inRenderer: boolean = false;
    protected _readyPipeline: boolean = false;
    protected _combineShaderRefection: ShaderReflection;
    protected _ignoreEnvMap?: boolean;
    protected _ignorePrefilterMap?: boolean;
    protected __renderOrder: number = 0;//cameraDepth + _renderOrder
    protected _renderOrder: number = 0;
    protected _passInit: Map<PassType, boolean> = new Map<PassType, boolean>();
    public isRenderOrderChange?: boolean;
    public needSortOnCameraZ?: boolean;
    protected _octreeBinder: { octree: Octree, entity: OctreeEntity };

    /**
     * Batching mode for this renderer. Drives whether the node is
     * collected into the default per-node opaque/transparent lists or
     * into a batched render-group (see {@link EntityBatchCollect}).
     *
     * Historically this field was named `_renderLayer`; that name was
     * vacated for the bitmask-based layer system, which now lives at
     * {@link ComponentBase.visibleLayer}.
     */
    protected _batchMode: BatchMode = BatchMode.None;

    protected _computes: RenderShaderCompute[];


    public init(param?: any) {
        this.renderOrder = 0;
        // Don't reset rendererMask here — the default initializer
        // (`_rendererMask = RendererMask.Default`) already covers fresh
        // instances, and subclass constructors (e.g. SkinnedMeshRenderer2
        // adding RendererMask.SkinnedMesh) run BEFORE this init via
        // ComponentBase.__init. Overwriting here erases those subclass-
        // added flags and silently breaks pass generation (USE_SKELETON
        // gating in PassGenerate.createShadowPass/createDepthPass).
        this.instanceID = GetCountInstanceID().toString();

        this._computes = [];
    }

    public attachSceneOctree(octree: Octree) {
        this._octreeBinder = { octree, entity: new OctreeEntity(this) };
        this.transform.eventDispatcher.addEventListener(Transform.LOCAL_ONCHANGE, this.updateOctreeEntity, this);
    }

    public detachSceneOctree() {
        if (this._octreeBinder) {
            this._octreeBinder.entity?.leaveNode();
            this.transform.eventDispatcher.removeEventListener(Transform.LOCAL_ONCHANGE, this.updateOctreeEntity, this);
            this._octreeBinder = null;
        }
    }

    protected updateOctreeEntity(e?) {
        this._octreeBinder?.entity?.update(this._octreeBinder.octree);
    }

    public copyComponent(from: this): this {
        super.copyComponent(from);
        this.geometry = from._geometry;
        this.materials = from._materials.slice();
        this.drawType = from.drawType;
        this.alwaysRender = from.alwaysRender;
        this.needSortOnCameraZ = from.needSortOnCameraZ;
        this.isRenderOrderChange = from.isRenderOrderChange;
        this.castShadow = from.castShadow;
        this.castGI = from.castGI;
        this.rendererMask = from.rendererMask;
        return this;
    }

    public get batchMode(): BatchMode {
        return this._batchMode;
    }

    public set batchMode(value: BatchMode) {
        this._batchMode = value;
    }

    public get geometry(): GeometryBase {
        return this._geometry;
    }

    public set geometry(value: GeometryBase) {
        if (this._geometry != value) {
            this._readyPipeline = false;

            if (this._geometry) {
                Reference.getInstance().detached(this._geometry, this)
            }
            if (value) {
                Reference.getInstance().attached(value, this)
            }
        }
        this._geometry = value;
    }

    public addMask(mask: RendererMask) {
        this._rendererMask = RendererMaskUtil.addMask(this.rendererMask, mask)
    }

    public removeMask(mask: RendererMask) {
        this._rendererMask = RendererMaskUtil.removeMask(this.rendererMask, mask)
    }

    public hasMask(mask: RendererMask): boolean {
        return RendererMaskUtil.hasMask(this.rendererMask, mask)
    }

    public get rendererMask(): number {
        return this._rendererMask;
    }

    public set rendererMask(value: number) {
        this._rendererMask = value;
    }

    public get renderOrder(): number {
        return this._renderOrder;
    }

    public set renderOrder(value: number) {
        if (value != this._renderOrder) {
            this.isRenderOrderChange = true;
            this.__renderOrder = value;
        }
        this._renderOrder = value;
    }

    @EditorInspector
    public get materials(): Material[] {
        return this._materials;
    }

    public set materials(value: Material[]) {
        this._readyPipeline = false;

        for (let i = 0; i < this._materials.length; i++) {
            let mat = this._materials[i];
            Reference.getInstance().detached(mat, this)
            if (mat.shader && mat.shader.computes)
                this.removeComputes(mat.shader.computes);
        }

        for (let i = 0; i < value.length; i++) {
            let mat = value[i];
            Reference.getInstance().attached(mat, this)
            if (mat.shader && mat.shader.computes)
                this.addComputes(mat.shader.computes);
        }

        this._materials = value;
        let transparent = false;
        let sort = 0;

        for (let i = 0; i < value.length; i++) {
            const element = value[i];
            const passArray = element.getPass(PassType.COLOR);
            const pass = passArray[0];
            if (pass.shaderState.transparent) {
                transparent = true;
                sort = sort > pass.renderOrder ? sort : pass.renderOrder;
            }
        }
        // this.renderOrder = transparent ? this.renderOrder : sort;
        this.renderOrder = sort;

        if (!this._readyPipeline) {
            this.initPipeline();
        }
    }

    private addComputes(computes: RenderShaderCompute[]) {
        this._computes.push(...computes);
    }

    private removeComputes(computes: RenderShaderCompute[]) {
        for (const com of computes) {
            let index = this._computes.indexOf(com);
            if (index != -1) {
                this._computes.splice(index, 1);
            }
        }
    }

    public addRendererMask(tag: RendererMask) {
        this._rendererMask = RendererMaskUtil.addMask(this._rendererMask, tag);
    }

    public removeRendererMask(tag: RendererMask) {
        this._rendererMask = RendererMaskUtil.removeMask(this._rendererMask, tag);
    }

    public onEnable(): void {
        if (!this._readyPipeline) {
            this.initPipeline();
        }

        EntityCollect.instance.addRenderNode(this.transform.scene3D, this);

        this.updateOctreeEntity();
    }

    public onDisable(): void {
        this._enable = false;
        EntityCollect.instance.removeRenderNode(this.transform.scene3D, this);
        super.onDisable?.();
    }

    /**
     * Recompute renderOrder from current pass states and re-bucket
     * this renderer in EntityCollect (opaque vs transparent map).
     *
     * Called when a material's alphaMode flips at runtime — the
     * pass.renderOrder changes (3000 ↔ 0), but EntityCollect classifies
     * once at addRenderNode time. Without this nudge the renderer
     * stays in its old list and gets drawn through the wrong pipeline
     * (e.g. WBOIT continues drawing a HASH-toggled material).
     *
     * Materials hop into this via Reference.getReference(material)
     * to find every renderer holding them; sample code can also call
     * it directly after manual state changes.
     */
    public refreshRenderClassification(): void {
        if (!this._enable) return;
        const scene = this.transform?.scene3D;
        if (!scene) return;

        let sort = 0;
        for (let i = 0; i < this._materials.length; i++) {
            const passArray = this._materials[i].getPass(PassType.COLOR);
            if (!passArray || passArray.length === 0) continue;
            const pass = passArray[0];
            if (pass.renderOrder >= 3000) {
                sort = sort > pass.renderOrder ? sort : pass.renderOrder;
            }
        }
        this.renderOrder = sort;
        // Re-cast derived passes so an alphaMode/oitMode flip that
        // newly demands a pass (e.g. oitMode going 'sorted' → 'weighted'
        // needs an OIT_ACCUM pass that didn't exist while the material
        // was OPAQUE) lazily creates it. createOITPass is idempotent
        // (it skips when the pass is already there) so this is cheap
        // even when nothing actually changed.
        this.castNeedPass();
        EntityCollect.instance.addRenderNode(scene, this);
    }

    public selfCloneMaterials(key: string): this {
        let newMaterials = [];
        for (let i = 0, c = this.materials.length; i < c; i++) {
            const material = this.materials[i].clone();
            newMaterials.push(material);
        }
        this.materials = newMaterials;

        this._readyPipeline = false;
        this.initPipeline();
        return this;
    }

    protected initPipeline() {
        // Per-instance setting access needs a Context3D; defer until this node
        // is attached to a scene whose view is bound to an engine. onEnable()
        // will retry when the component reaches a scene.
        const ctx = this.transform?.view3D?.engine3D?.context3D;
        if (!ctx) return;

        if (this._geometry && this._materials.length > 0) {
            for (let j = 0; j < this._materials.length; j++) {
                const material = this._materials[j];
                let passList = material.getPass(PassType.COLOR);
                for (let i = 0; i < passList.length; i++) {
                    const pass = passList[i];
                    // let shader = RenderShader.getShader(pass.instanceID);
                    if (!pass.shaderReflection) {
                        bindCtx(pass, ctx);
                        pass.preCompile(this._geometry);
                    }
                    this._geometry.generate(pass.shaderReflection);
                }
                this.object3D.bound = this._geometry.bounds.clone();
            }
            this._readyPipeline = true;

            let sort = 0;
            for (let i = 0; i < this.materials.length; i++) {
                const element = this.materials[i];
                const passArray = element.getPass(PassType.COLOR);
                const pass = passArray[0];
                if (pass.renderOrder >= 3000) {
                    sort = sort > pass.renderOrder ? sort : pass.renderOrder;
                } else {
                    sort = Math.max(sort - 3000, 0);
                }
                this.castNeedPass();
            }
            this.renderOrder = sort;

            if (this.enable && this.transform && this.transform.scene3D) {
                EntityCollect.instance.addRenderNode(this.transform.scene3D, this);
            }

        }
    }

    protected castNeedPass() {
        if (this.castGI) {
            for (let i = 0; i < this.materials.length; i++) {
                const mat = this.materials[i];
                PassGenerate.createGIPass(this, mat.shader);
            }
        }

        for (let i = 0; i < this.materials.length; i++) {
            const mat = this.materials[i];
            if (mat.castShadow) {
                PassGenerate.createShadowPass(this, mat.shader);
            }
        }

        if (this.castReflection) {
            for (let i = 0; i < this.materials.length; i++) {
                const mat = this.materials[i];
                if (mat.castReflection) {
                    PassGenerate.createReflectionPass(this, mat.shader);
                }
            }
        }

        let ignoreDepthPass = RendererMaskUtil.hasMask(this.rendererMask, RendererMask.IgnoreDepthPass);
        const zPrePass = this.transform.view3D?.engine3D?.setting.render.zPrePass ?? false;
        if (!ignoreDepthPass && zPrePass) {
            for (let i = 0; i < this.materials.length; i++) {
                const mat = this.materials[i];
                PassGenerate.createDepthPass(this, mat.shader);
            }
        } else {
            for (let i = 0; i < this.materials.length; i++) {
                const mat = this.materials[i];
                mat.shader.removeShaderByIndex(PassType.DEPTH, 0);
            }
        }

        // Per-object motion vectors: same gating as the depth prepass
        // (opaque, depth-writing materials only).
        const objectMotionVectors = this.transform.view3D?.engine3D?.setting.render.objectMotionVectors ?? false;
        if (!ignoreDepthPass && objectMotionVectors) {
            for (let i = 0; i < this.materials.length; i++) {
                PassGenerate.createVelocityPass(this, this.materials[i].shader);
            }
        }

        // P2: WBOIT pass generation for materials marked
        // `oitMode === 'weighted'`. Only meaningful when the engine
        // has `setting.render.useOIT === true` — otherwise the
        // TransparentOITFeature isn't in the graph and the generated
        // pass would never run. Generation still happens unconditionally
        // (cheap, idempotent) so flipping useOIT at runtime in dev
        // tooling doesn't require re-creating materials.
        for (let i = 0; i < this.materials.length; i++) {
            const mat = this.materials[i];
            if (mat.oitMode === 'weighted') {
                PassGenerate.createOITPass(this, mat.shader);
            } else if (mat.oitMode === 'depth-peel') {
                // Dual Depth Peeling derived passes (3 sub-pass types
                // per material: depth peel / front color / back color).
                // Same lazy/idempotent contract as createOITPass — call
                // costs nothing once the passes exist.
                PassGenerate.createDepthPeelPasses(this, mat.shader);
            }
        }
    }

    @EditorInspector
    public get castShadow(): boolean {
        return this._castShadow;
    }

    public set castShadow(value: boolean) {
        this._castShadow = value;
    }

    /**
     * Shadow cache classification.
     *
     * - `'auto'` (default): renderer is drawn to the shadow map every frame
     *   as part of the single-pass render — matches historical behaviour.
     * - `'static'`: renderer is drawn only to the cached static depth layer,
     *   rebuilt lazily when the light moves or the scene explicitly marks
     *   the static cache dirty. Use for buildings, terrain, prop meshes that
     *   don't move.
     * - `'dynamic'`: renderer is drawn every frame on top of the copied-in
     *   static layer. Use for characters, physics objects, anything that
     *   moves.
     *
     * Only consulted when `engine.setting.shadow.enableStaticCache === true`;
     * otherwise all renderers behave as `'auto'`.
     */
    public shadowCacheMode: 'auto' | 'static' | 'dynamic' = 'auto';

    @EditorInspector
    public get castGI(): boolean {
        return this._castGI;
    }

    public set castGI(value: boolean) {
        this._castGI = value;
    }

    public get castReflection(): boolean {
        return this._castReflection;
    }

    public set castReflection(value: boolean) {
        this._castReflection = value;
    }

    public renderPass(view: View3D, passType: PassType, renderContext: RenderContext) {
        if (!this._geometry)
            return;
        let renderNode = this;
        let worldMatrix = renderNode.transform._worldMatrix;
        const gpu = view.engine3D.context3D.gpuContext;

        const nCount = Math.max(renderNode.materials.length, renderNode._geometry.subGeometries.length);

        for (let i = 0; i < nCount; i++) {
            const material = i >= renderNode.materials.length ? renderNode.materials[0] : renderNode.materials[i];
            if (!material || !material.enable)
                continue;

            let passes = material.getPass(passType);

            if (!passes || passes.length == 0)
                continue;

            gpu.bindGeometryBuffer(renderContext.encoder, renderNode._geometry);
            ProfilerUtil.viewCount_vertex(view, PassType[passType], renderNode._geometry.vertexCount);

            for (let j = 0; j < passes.length; j++) {
                if (!passes || passes.length == 0)
                    continue;
                let matPass = passes[j];
                // if (!matPass.enable)
                //     continue;

                // for (let j = passes.length > 1 ? 1 : 0 ; j < passes.length; j++) {
                const renderShader = matPass;

                if (renderShader.pipeline) {
                    if (renderShader.shaderState.splitTexture) {
                        renderContext.endRenderPass();
                        RTResourceMap.WriteSplitColorTexture(view.engine3D.context3D, renderNode.instanceID);
                        renderContext.beginOpaqueRenderPass();

                        gpu.bindCamera(renderContext.encoder, view.camera);
                        gpu.bindGeometryBuffer(renderContext.encoder, renderNode._geometry);
                    }

                    let noneShare = gpu.bindPipeline(renderContext.encoder, renderShader);
                    if (noneShare) {
                        ProfilerUtil.viewCount_pipeline(view, PassType[passType]);
                    }
                    let subGeometry = i >= renderNode._geometry.subGeometries.length ? renderNode._geometry.subGeometries[0] : renderNode._geometry.subGeometries[i];
                    let lodInfos = subGeometry.lodLevels;
                    let lodInfo = lodInfos[renderNode.lodLevel];

                    if (renderNode.instanceCount > 0) {
                        ProfilerUtil.viewCount_instance(view, PassType[passType], renderNode.instanceCount);
                        ProfilerUtil.viewCount_indices(view, PassType[passType], lodInfo.indexCount);
                        ProfilerUtil.viewCount_tri(view, PassType[passType], lodInfo.indexCount / 3 * renderNode.instanceCount);
                        gpu.drawIndexed(renderContext.encoder, lodInfo.indexCount, renderNode.instanceCount, lodInfo.indexStart, 0, 0);
                    } else {
                        ProfilerUtil.viewCount_indices(view, PassType[passType], lodInfo.indexCount);
                        ProfilerUtil.viewCount_tri(view, PassType[passType], lodInfo.indexCount / 3);
                        gpu.drawIndexed(renderContext.encoder, lodInfo.indexCount, 1, lodInfo.indexStart, 0, worldMatrix.index);
                    }
                    ProfilerUtil.viewCount_draw(view, PassType[passType],);
                }
            }
        }
    }

    /**
     * render pass at passType
     * @param pass
     * @param encoder
     * @returns
     */
    public renderPass2(view: View3D, passType: PassType, rendererPassState: RendererPassState, clusterLightingBuffer: ClusterLightingBuffer, encoder: GPURenderPassEncoder, useBundle: boolean = false) {
        if (!this.enable)
            return;
        // this.nodeUpdate(view, passType, rendererPassState, clusterLightingBuffer);
        if (!this._geometry)
            return;

        let node = this;
        let worldMatrix = node.object3D.transform._worldMatrix;
        const gpu = view.engine3D.context3D.gpuContext;
        // Iterate by the larger of materials/subGeometries so that
        // single-material geometries with multiple subGeometries (e.g.
        // CylinderGeometry's torso + two caps) draw every sub-mesh.
        // Reusing materials[0] mirrors the legacy `renderPass` path.
        const subGeometries = node._geometry.subGeometries;
        const nCount = Math.max(this.materials.length, subGeometries.length);
        for (let i = 0; i < nCount; i++) {
            const material = i >= this.materials.length ? this.materials[0] : this.materials[i];
            if (!material.castShadow && passType == PassType.SHADOW)
                continue;
            // material.applyUniform();
            let passes = material.getPass(passType);
            if (!passes || passes.length == 0)
                continue;

            if (this.drawType == 2) {
                for (let matPass of passes) {
                    // if (!matPass.enable)
                    //     continue;
                    if (matPass.pipeline) {
                        gpu.bindPipeline(encoder, matPass);
                        gpu.draw(encoder, 6, 1, 0, worldMatrix.index);
                    }
                }
            } else {
                gpu.bindGeometryBuffer(encoder, node._geometry);
                for (let matPass of passes) {
                    // if (!matPass.enable)
                    //     continue;
                    if (matPass.pipeline) {
                        gpu.bindPipeline(encoder, matPass);
                        const subGeometry = i >= subGeometries.length ? subGeometries[0] : subGeometries[i];
                        let lodInfos = subGeometry.lodLevels;
                        let lodInfo = lodInfos[node.lodLevel];
                        if (this.instanceCount > 0) {
                            gpu.drawIndexed(encoder, lodInfo.indexCount, this.instanceCount, lodInfo.indexStart, 0, 0);
                        } else {
                            gpu.drawIndexed(encoder, lodInfo.indexCount, 1, lodInfo.indexStart, 0, worldMatrix.index);
                        }
                    }
                }
            }

        }


    }

    public recordRenderPass2(view: View3D, passType: PassType, rendererPassState: RendererPassState, clusterLightingBuffer: ClusterLightingBuffer, encoder: GPURenderPassEncoder, useBundle: boolean = false) {
        if (!this.enable) return;
        // this.nodeUpdate(view, passType, rendererPassState, clusterLightingBuffer);

        let node = this;
        const gpu = view.engine3D.context3D.gpuContext;
        // See renderPass2 above — iterate by max(materials, subGeometries)
        // so cap subGeometries on single-material meshes still get recorded
        // into the bundle (otherwise the shadow bundle path misses them).
        const subGeometries = node._geometry.subGeometries;
        const nCount = Math.max(this.materials.length, subGeometries.length);
        for (let i = 0; i < nCount; i++) {
            const material = i >= this.materials.length ? this.materials[0] : this.materials[i];

            let passes = material.getPass(passType);
            if (!passes || passes.length == 0) continue;

            let worldMatrix = node.object3D.transform._worldMatrix;
            for (let j = 0; j < passes.length; j++) {
                const renderShader = passes[j];
                gpu.bindPipeline(encoder, renderShader);
                const subGeometry = i >= subGeometries.length ? subGeometries[0] : subGeometries[i];
                let lodInfos = subGeometry.lodLevels;
                let lodInfo = lodInfos[node.lodLevel];
                gpu.drawIndexed(encoder, lodInfo.indexCount, 1, lodInfo.indexStart, 0, worldMatrix.index);
            }
        }
    }

    private noticeShaderChange() {
        if (this.enable) {
            this.onEnable();
            this._passInit.forEach((v, k) => {
                this._passInit.set(k, false);
            })
        }
    }

    preInit(_rendererType: PassType): boolean {
        return this._passInit.get(_rendererType);
    }

    public nodeUpdate(view: View3D, passType: PassType, renderPassState: RendererPassState, clusterLightingBuffer?: ClusterLightingBuffer) {
        let node = this;
        let envMap = view.scene.envMap;

        for (let j = 0; j < node.materials.length; j++) {
            let material = node.materials[j];
            let passes = material.getPass(passType);
            if (passes) {
                for (let i = 0; i < passes.length; i++) {
                    const pass = passes[i];
                    const renderShader = pass;

                    if (renderShader.shaderState.splitTexture) {
                        let splitTexture = RTResourceMap.CreateSplitTexture(view.engine3D.context3D, node.instanceID);
                        renderShader.setTexture("splitTexture_Map", splitTexture);
                    }

                    if (!node._ignoreEnvMap && renderShader.envMap != envMap) {
                        renderShader.setTexture(`envMap`, envMap);
                    }

                    // if (!node._ignorePrefilterMap && renderShader.prefilterMap != envMap) {
                    if (!renderShader.prefilterMap) {
                        renderShader.setTexture(`prefilterMap`, envMap);
                    }
                    // }

                    let reflectionEntries = GlobalBindGroup.getReflectionEntries(view.scene);
                    if (reflectionEntries && reflectionEntries.reflectionMap) {
                        // Set the texture and the storage-buffer
                        // independently. The previous gating
                        // `if (!renderShader.reflectionMap)` skipped
                        // BOTH whenever the texture was already set.
                        // For derived passes (e.g. an OIT pass whose
                        // texture clone in createOITPass copied the
                        // reflectionMap reference), the gate flipped
                        // false and the storage buffer never got bound
                        // → reBuild's getGroupLayout crashed reading
                        // `reflectionBuffer`. Each binding is now
                        // gated only on its own state.
                        if (!renderShader.reflectionMap) {
                            renderShader.setTexture(`reflectionMap`, reflectionEntries.reflectionMap);
                        }
                        if (!renderShader.getStorageBuffer(`reflectionBuffer`)) {
                            renderShader.setStorageBuffer(`reflectionBuffer`, reflectionEntries.storageGPUBuffer);
                        }
                    }

                    if (renderShader.pipeline) {
                        renderShader.apply(view.engine3D.context3D, node._geometry, renderPassState, () => node.noticeShaderChange());
                        continue;
                    }

                    let bdrflutTex = Engine3D.resFor(view.engine3D?.context3D).getTexture(`BRDFLUT`);
                    renderShader.setTexture(`brdflutMap`, bdrflutTex);

                    // v2 shadow map binding: read the depth-array textures
                    // through the graph pool. The legacy paths
                    // `renderJob.shadowMapPassRenderer / pointLightShadowRenderer`
                    // were v1 ForwardRenderJob fields that no longer exist
                    // after the v2 rewrite — leaving them in place silently
                    // skipped the setTexture calls so the lit pipeline's
                    // bind group came up 2 entries short of its layout
                    // ("BindGroupLayout 26 vs 24" errors at first frame).
                    const graph = view.renderGraph;
                    if (graph) {
                        if (graph.pool.has('_MainShadowMap')) {
                            const depth2DArrayTexture = graph.pool.get('_MainShadowMap');
                            if (depth2DArrayTexture) {
                                renderShader.setTexture(`shadowMap`, depth2DArrayTexture as any);
                            }
                        }
                        if (graph.pool.has('_PointShadowCubeArray')) {
                            const cubeArrayTexture = graph.pool.get('_PointShadowCubeArray');
                            if (cubeArrayTexture) {
                                renderShader.setTexture(`pointShadowMap`, cubeArrayTexture as any);
                            }
                        }
                    }

                    let iesTexture = IESProfilesPool.for(view.engine3D.context3D).iesTexture;
                    if (iesTexture) {
                        renderShader.setTexture(`iesTextureArrayMap`, iesTexture);
                    }

                    if (renderPassState.irradianceBuffer && renderPassState.irradianceBuffer.length > 0) {
                        renderShader.setTexture(`irradianceMap`, renderPassState.irradianceBuffer[0]);
                        renderShader.setTexture(`irradianceDepthMap`, renderPassState.irradianceBuffer[1]);
                    }

                    let lightUniformEntries = GlobalBindGroup.getLightEntries(view.scene);
                    if (lightUniformEntries) {
                        renderShader.setStorageBuffer(`lightBuffer`, lightUniformEntries.storageGPUBuffer);
                        if (lightUniformEntries.irradianceVolume) {
                            renderShader.setUniformBuffer(`irradianceData`, lightUniformEntries.irradianceVolume.irradianceVolumeBuffer);
                        }
                    }

                    if (clusterLightingBuffer) {
                        renderShader.setStorageBuffer(`clustersUniform`, clusterLightingBuffer.clustersUniformBuffer);
                        renderShader.setStorageBuffer(`lightAssignBuffer`, clusterLightingBuffer.lightAssignBuffer);
                        renderShader.setStorageBuffer(`assignTable`, clusterLightingBuffer.assignTableBuffer);
                        renderShader.setStorageBuffer(`clusterBuffer`, clusterLightingBuffer.clusterBuffer);
                    }

                    renderShader.apply(view.engine3D.context3D, node._geometry, renderPassState);

                    this._passInit.set(passType, true);
                }
            }
        }
    }

    public beforeDestroy(force?: boolean) {
        // SkyRenderer (and subclasses like AtmosphericComponent) build their
        // geometry lazily in onEnable(), so removing the component before the
        // render loop starts leaves `_geometry` undefined here.
        if (this._geometry) {
            Reference.getInstance().detached(this._geometry, this);
            if (!Reference.getInstance().hasReference(this._geometry)) {
                this._geometry.destroy(force);
            }
        }

        for (let i = 0; i < this._materials.length; i++) {
            const mat = this._materials[i];
            Reference.getInstance().detached(mat, this);
            if (!Reference.getInstance().hasReference(mat)) {
                mat.destroy(force);
            }
        }
        super.beforeDestroy(force);
    }

    public destroy(force?: boolean) {
        super.destroy(force);
        this._geometry = undefined;
        this._materials.length = 0;
        this._combineShaderRefection = undefined;
    }

}
