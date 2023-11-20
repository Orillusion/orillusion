import { EditorInspector } from "../../util/SerializeDecoration";
import { Engine3D } from "../../Engine3D";
import { View3D } from "../../core/View3D";
import { GeometryBase } from "../../core/geometry/GeometryBase";
import { PassGenerate } from "../../gfx/generate/PassGenerate";
import { GlobalBindGroup } from "../../gfx/graphics/webGpu/core/bindGroups/GlobalBindGroup";
import { ShaderReflection } from "../../gfx/graphics/webGpu/shader/value/ShaderReflectionInfo";
import { GPUContext } from "../../gfx/renderJob/GPUContext";
import { EntityCollect } from "../../gfx/renderJob/collect/EntityCollect";
import { ShadowLightsCollect } from "../../gfx/renderJob/collect/ShadowLightsCollect";
import { RTResourceMap } from "../../gfx/renderJob/frame/RTResourceMap";
import { RenderContext } from "../../gfx/renderJob/passRenderer/RenderContext";
import { ClusterLightingBuffer } from "../../gfx/renderJob/passRenderer/cluster/ClusterLightingBuffer";
import { RendererMask, RendererMaskUtil } from "../../gfx/renderJob/passRenderer/state/RendererMask";
import { RendererPassState } from "../../gfx/renderJob/passRenderer/state/RendererPassState";
import { PassType } from "../../gfx/renderJob/passRenderer/state/RendererType";
import { GetCountInstanceID, UUID } from "../../util/Global";
import { Reference } from "../../util/Reference";
import { ComponentBase } from "../ComponentBase";
import { IESProfiles } from "../lights/IESProfiles";
import { Octree } from "../../core/tree/octree/Octree";
import { OctreeEntity } from "../../core/tree/octree/OctreeEntity";
import { Transform } from "../Transform";
import { Material } from "../../materials/Material";
import { RenderLayer } from "../../gfx/renderJob/config/RenderLayer";
import { RenderShaderCompute, ComputeShader } from "../..";


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
    protected _castReflection: boolean = false;
    protected _castGI: boolean = false;
    protected _rendererMask: number = RendererMask.Default;
    protected _inRenderer: boolean = false;
    protected _readyPipeline: boolean = false;
    protected _combineShaderRefection: ShaderReflection;
    protected _ignoreEnvMap?: boolean;
    protected _ignorePrefilterMap?: boolean;
    protected __renderOrder: number = 0;//cameraDepth + _renderOrder
    protected _renderOrder: number = 0;
    public isRenderOrderChange?: boolean;
    public needSortOnCameraZ?: boolean;
    protected _octreeBinder: { octree: Octree, entity: OctreeEntity };

    public preInit: boolean = false;
    /**
     *
     * The layer membership of the object.
     *  The object is only visible when it has at least one common layer with the camera in use.
     * When using a ray projector, this attribute can also be used to filter out unwanted objects in ray intersection testing.
     */
    protected _renderLayer: RenderLayer = RenderLayer.None;
    protected _computes: RenderShaderCompute[];


    public init() {
        this.renderOrder = 0;
        this.rendererMask = RendererMask.Default;
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

    public get renderLayer(): RenderLayer {
        return this._renderLayer;
    }

    public set renderLayer(value: RenderLayer) {
        // for (let i = 0; i < this.object3D.entityChildren.length; i++) {
        //     const element = this.object3D.entityChildren[i];
        //     element.renderLayer = value;
        // }
        this._renderLayer = value;
    }

    public get geometry(): GeometryBase {
        return this._geometry;
    }

    public set geometry(value: GeometryBase) {
        if (this._geometry != value) {
            if (this._geometry) {
                Reference.getInstance().detached(this._geometry, this)
            }
            Reference.getInstance().attached(value, this)
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
        EntityCollect.instance.removeRenderNode(this.transform.scene3D, this);
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
        if (this._geometry && this._materials.length > 0) {
            let index = 0;
            for (let j = 0; j < this._materials.length; j++) {
                const material = this._materials[j];
                let passList = material.getPass(PassType.COLOR);
                for (let i = 0; i < passList.length; i++) {
                    const pass = passList[i];
                    // let shader = RenderShader.getShader(pass.instanceID);
                    if (!pass.shaderReflection) {
                        pass.preCompile(this._geometry);
                    }
                    this._geometry.generate(pass.shaderReflection);
                }
                this.object3D.bound = this._geometry.bounds.clone();
            }
            this._readyPipeline = true;

            let transparent = false;
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

        // if (this.castShadow) {
        for (let i = 0; i < this.materials.length; i++) {
            const mat = this.materials[i];
            if (mat.castShadow) {
                PassGenerate.createShadowPass(this, mat.shader);
            }
        }
        // }

        if (this.castReflection) {
            for (let i = 0; i < this.materials.length; i++) {
                const mat = this.materials[i];
                if (mat.castShadow) {
                    PassGenerate.createShadowPass(this, mat.shader);
                }
            }
        }

        // add if alpha == 1
        let ignoreDepthPass = RendererMaskUtil.hasMask(this.rendererMask, RendererMask.IgnoreDepthPass);
        if (!ignoreDepthPass && Engine3D.setting.render.zPrePass) {
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
    }

    @EditorInspector
    public get castShadow(): boolean {
        return this._castShadow;
    }

    @EditorInspector
    public set castShadow(value: boolean) {
        this._castShadow = value;
    }

    @EditorInspector
    public get castGI(): boolean {
        return this._castGI;
    }

    @EditorInspector
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
        let renderNode = this;
        let worldMatrix = renderNode.transform._worldMatrix;
        for (let i = 0; i < renderNode.materials.length; i++) {
            const material = renderNode.materials[i];
            if (!material || !material.enable)
                continue;

            let passes = material.getPass(passType);

            if (!passes || passes.length == 0)
                continue;

            GPUContext.bindGeometryBuffer(renderContext.encoder, renderNode._geometry);
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
                        RTResourceMap.WriteSplitColorTexture(renderNode.instanceID);
                        renderContext.beginOpaqueRenderPass();

                        GPUContext.bindCamera(renderContext.encoder, view.camera);
                        GPUContext.bindGeometryBuffer(renderContext.encoder, renderNode._geometry);
                    }
                    GPUContext.bindPipeline(renderContext.encoder, renderShader);
                    let subGeometry = renderNode._geometry.subGeometries[i];
                    let lodInfos = subGeometry.lodLevels;
                    let lodInfo = lodInfos[renderNode.lodLevel];

                    if (renderNode.instanceCount > 0) {
                        GPUContext.drawIndexed(renderContext.encoder, lodInfo.indexCount, renderNode.instanceCount, lodInfo.indexStart, 0, 0);
                    } else {
                        GPUContext.drawIndexed(renderContext.encoder, lodInfo.indexCount, 1, lodInfo.indexStart, 0, worldMatrix.index);
                    }
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

        let node = this;
        let worldMatrix = node.object3D.transform._worldMatrix;
        for (let i = 0; i < this.materials.length; i++) {
            const material = this.materials[i];
            // material.applyUniform();
            let passes = material.getPass(passType);
            if (!passes || passes.length == 0)
                return;

            if (this.drawType == 2) {
                for (let matPass of passes) {
                    // if (!matPass.enable)
                    //     continue;

                    if (matPass.pipeline) {
                        GPUContext.bindPipeline(encoder, matPass);
                        GPUContext.draw(encoder, 6, 1, 0, worldMatrix.index);
                    }
                }
            } else {
                GPUContext.bindGeometryBuffer(encoder, node._geometry);
                for (let matPass of passes) {
                    // if (!matPass.enable)
                    //     continue;

                    if (matPass.pipeline) {
                        GPUContext.bindPipeline(encoder, matPass);
                        let subGeometries = node._geometry.subGeometries;
                        const subGeometry = subGeometries[i];
                        let lodInfos = subGeometry.lodLevels;
                        let lodInfo = lodInfos[node.lodLevel];
                        GPUContext.drawIndexed(encoder, lodInfo.indexCount, 1, lodInfo.indexStart, 0, worldMatrix.index);
                    }
                }
            }

        }


    }

    public recordRenderPass2(view: View3D, passType: PassType, rendererPassState: RendererPassState, clusterLightingBuffer: ClusterLightingBuffer, encoder: GPURenderPassEncoder, useBundle: boolean = false) {
        if (!this.enable) return;
        // this.nodeUpdate(view, passType, rendererPassState, clusterLightingBuffer);

        let node = this;
        for (let i = 0; i < this.materials.length; i++) {
            let material = this.materials[i];

            let passes = material.getPass(passType);
            if (!passes || passes.length == 0) return;

            let worldMatrix = node.object3D.transform._worldMatrix;
            for (let j = 0; j < passes.length; j++) {
                const renderShader = passes[j];
                GPUContext.bindPipeline(encoder, renderShader);
                let subGeometries = node._geometry.subGeometries;
                const subGeometry = subGeometries[i];
                let lodInfos = subGeometry.lodLevels;
                let lodInfo = lodInfos[node.lodLevel];
                GPUContext.drawIndexed(encoder, lodInfo.indexCount, 1, lodInfo.indexStart, 0, worldMatrix.index);
            }
        }
    }

    private noticeShaderChange() {
        if (this.enable) {
            this.onEnable();
            this.preInit = false;
        }
    }

    public nodeUpdate(view: View3D, passType: PassType, renderPassState: RendererPassState, clusterLightingBuffer?: ClusterLightingBuffer) {
        this.preInit = true;
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
                        let splitTexture = RTResourceMap.CreateSplitTexture(node.instanceID);
                        renderShader.setTexture("splitTexture_Map", splitTexture);
                    }

                    if (!node._ignoreEnvMap && renderShader.envMap != envMap) {
                        renderShader.setTexture(`envMap`, envMap);
                    }

                    // if (!node._ignorePrefilterMap && renderShader.prefilterMap != envMap) {
                    renderShader.setTexture(`prefilterMap`, envMap);
                    // }

                    if (renderShader.pipeline) {
                        renderShader.apply(node._geometry, renderPassState, () => node.noticeShaderChange());
                        continue;
                    }

                    let bdrflutTex = Engine3D.res.getTexture(`BRDFLUT`);
                    renderShader.setTexture(`brdflutMap`, bdrflutTex);

                    let shadowRenderer = Engine3D.getRenderJob(view).shadowMapPassRenderer;
                    if (shadowRenderer && shadowRenderer.depth2DArrayTexture) {
                        renderShader.setTexture(`shadowMap`, Engine3D.getRenderJob(view).shadowMapPassRenderer.depth2DArrayTexture);
                    }
                    // let shadowLight = ShadowLights.list;
                    // if (shadowLight.length) {
                    let pointShadowRenderer = Engine3D.getRenderJob(view).pointLightShadowRenderer;
                    if (pointShadowRenderer && pointShadowRenderer.cubeArrayTexture) {
                        renderShader.setTexture(`pointShadowMap`, pointShadowRenderer.cubeArrayTexture);
                    }
                    // }

                    let iesTexture = IESProfiles.iesTexture;
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

                    renderShader.apply(node._geometry, renderPassState);
                }
            }
        }
    }

    public beforeDestroy(force?: boolean) {
        Reference.getInstance().detached(this._geometry, this);
        if (!Reference.getInstance().hasReference(this._geometry)) {
            this._geometry.destroy(force);
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
        this._geometry = null;
        this._materials = null;
        this._combineShaderRefection = null;
    }

}
