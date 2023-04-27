import { GeometryBase } from '../../core/geometry/GeometryBase';
import { PassGenerate } from '../../gfx/generate/PassGenerate';
import { ShaderReflection } from '../../gfx/graphics/webGpu/shader/value/ShaderReflectionInfo';
import { EntityCollect } from '../../gfx/renderJob/collect/EntityCollect';
import { GPUContext } from '../../gfx/renderJob/GPUContext';
import { ClusterLightingRender } from '../../gfx/renderJob/passRenderer/cluster/ClusterLightingRender';
import { RendererType } from '../../gfx/renderJob/passRenderer/state/RendererType';
import { RendererMaskUtil, RendererMask } from '../../gfx/renderJob/passRenderer/state/RendererMask';
import { RendererPassState } from '../../gfx/renderJob/passRenderer/state/RendererPassState';
import { MaterialBase } from '../../materials/MaterialBase';
import { ComponentBase } from '../ComponentBase';
import { RenderContext } from '../../gfx/renderJob/passRenderer/RenderContext';
import { Engine3D } from '../../Engine3D';
import { View3D } from '../../core/View3D';
import { GlobalBindGroup } from '../../gfx/graphics/webGpu/core/bindGroups/GlobalBindGroup';
import { RenderShader } from '../../gfx/graphics/webGpu/shader/RenderShader';
import { RTResourceMap } from '../../gfx/renderJob/frame/RTResourceMap';
import { UUID } from '../../util/Global';
import { ComponentType } from '../../util/SerializeDefine';
import { IESProfiles } from '../lights/IESProfiles';

/**
 * @internal
 * @group Components
 */
export class RenderNode extends ComponentBase {
    public instanceCount: number = 0;
    public lodLevel: number = 0;
    public alwaysRender: boolean = false;
    public renderOrder: number = 0;
    public instanceID: string;
    public drawType: number = 0;

    protected _geometry: GeometryBase;
    protected _materials: MaterialBase[] = [];
    protected _castShadow: boolean = true;
    protected _castReflection: boolean = false;
    protected _castGI: boolean = false;
    protected _rendererMask: number = RendererMask.Default;
    protected _inRenderer: boolean = false;
    protected _readyPipeline: boolean = false;
    protected _combineShaderRefection: ShaderReflection;
    protected _ignoreEnvMap?: boolean;
    protected _ignorePrefilterMap?: boolean;

    constructor() {
        super();
        this.componentType = ComponentType.renderNode;
        this.rendererMask = RendererMask.Default;
    }

    public get geometry(): GeometryBase {
        return this._geometry;
    }

    public set geometry(value: GeometryBase) {
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

    public get materials(): MaterialBase[] {
        return this._materials;
    }

    public set materials(value: MaterialBase[]) {
        this._materials = value;
        let transparent = false;
        let sort = 0;
        for (let i = 0; i < value.length; i++) {
            const element = value[i];
            if (element.transparent) {
                transparent = true;
                sort = sort > element.sort ? sort : element.sort;
            }
        }
        this.renderOrder = transparent ? this.renderOrder : sort;

        if (!this._readyPipeline) {
            this.initPipeline();
        }
    }

    protected init() {
        // this.renderPasses = new Map<RendererType, MaterialBase[]>();
        this.instanceID = UUID();
    }

    public addRendererMask(tag: RendererMask) {
        this._rendererMask = RendererMaskUtil.addMask(this._rendererMask, tag);
    }

    public removeRendererMask(tag: RendererMask) {
        this._rendererMask = RendererMaskUtil.removeMask(this._rendererMask, tag);
    }

    protected onEnable(): void {
        if (!this._readyPipeline) {
            this.initPipeline();


        }
        EntityCollect.instance.addRenderNode(this.transform.scene3D, this);
    }


    protected onDisable(): void {
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
            for (let i = 0; i < this._materials.length; i++) {
                const material = this._materials[i];
                let passList = material.addPass(RendererType.COLOR, material);
                for (let i = 0; i < passList.length; i++) {
                    const pass = passList[i];
                    let shader = RenderShader.getShader(pass.shaderID);
                    if (!shader.shaderReflection) {
                        shader.preCompile(this._geometry);
                    }
                    this._geometry.generate(shader.shaderReflection);
                }

                this.object3D.bound = this._geometry.bounds;
            }
            this._readyPipeline = true;

            let transparent = false;
            let sort = 0;
            for (let i = 0; i < this.materials.length; i++) {
                const element = this.materials[i];
                transparent = element.transparent;
                if (element.transparent) {
                    sort = sort > element.sort ? sort : element.sort;
                } else {
                    sort = Math.max(sort - 3000, 0);
                }
                this.castNeedPass(element.getShader());
            }
            this.renderOrder = sort;

            if (this.enable && this.transform && this.transform.scene3D) {
                EntityCollect.instance.addRenderNode(this.transform.scene3D, this);
            }
        }
    }

    protected castNeedPass(shader: RenderShader) {
        if (this.castGI) {
            for (let i = 0; i < this.materials.length; i++) {
                const mat = this.materials[i];
                PassGenerate.createGIPass(this, mat);
            }
        }

        if (this.castShadow) {
            for (let i = 0; i < this.materials.length; i++) {
                const mat = this.materials[i];
                if (mat.shaderState.castShadow) {
                    PassGenerate.createShadowPass(this, mat);
                }
            }
        }

        if (this.castReflection) {
            for (let i = 0; i < this.materials.length; i++) {
                const mat = this.materials[i];
                if (mat.shaderState.castShadow) {
                    PassGenerate.createShadowPass(this, mat);
                }
            }
        }


        // add if alpha == 1
        let ignoreDepthPass = RendererMaskUtil.hasMask(this.rendererMask, RendererMask.IgnoreDepthPass);
        if (!ignoreDepthPass && Engine3D.setting.render.zPrePass && shader.shaderState.useZ) {
            for (let i = 0; i < this.materials.length; i++) {
                const mat = this.materials[i];
                PassGenerate.createDepthPass(this, mat);
            }
        } else {
            for (let i = 0; i < this.materials.length; i++) {
                const mat = this.materials[i];
                mat.removePass(RendererType.DEPTH, 0);
            }
        }
    }

    public get castShadow(): boolean {
        return this._castShadow;
    }

    public set castShadow(value: boolean) {
        this._castShadow = value;
    }

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



    public renderPass(view: View3D, passType: RendererType, renderContext: RenderContext) {
        let renderNode = this;
        for (let i = 0; i < renderNode.materials.length; i++) {
            const material = renderNode.materials[i];
            let passes = material.renderPasses.get(passType);

            if (!passes || passes.length == 0) continue;

            GPUContext.bindGeometryBuffer(renderContext.encoder, renderNode._geometry);
            let worldMatrix = renderNode.object3D.transform._worldMatrix;
            for (let j = 0; j < passes.length; j++) {
                if (!passes || passes.length == 0) continue;
                let matPass = passes[j];
                if (!matPass.enable) continue;

                // for (let j = passes.length > 1 ? 1 : 0 ; j < passes.length; j++) {
                const renderShader = matPass.renderShader;
                if (renderShader.shaderState.splitTexture) {

                    renderContext.endRenderPass();
                    RTResourceMap.WriteSplitColorTexture(renderNode.instanceID);
                    renderContext.beginRenderPass();

                    GPUContext.bindCamera(renderContext.encoder, view.camera);
                    GPUContext.bindGeometryBuffer(renderContext.encoder, renderNode._geometry);
                }
                GPUContext.bindPipeline(renderContext.encoder, renderShader);
                let subGeometries = renderNode._geometry.subGeometries;
                for (let k = 0; k < subGeometries.length; k++) {
                    const subGeometry = subGeometries[k];
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
    public renderPass2(view: View3D, passType: RendererType, rendererPassState: RendererPassState, clusterLightingRender: ClusterLightingRender, encoder: GPURenderPassEncoder, useBundle: boolean = false) {
        if (!this.enable) return;
        this.nodeUpdate(view, passType, rendererPassState, clusterLightingRender);

        let node = this;
        for (let i = 0; i < this.materials.length; i++) {
            const material = this.materials[i];
            let passes = material.renderPasses.get(passType);
            if (!passes || passes.length == 0) return;
            let matPass = passes[i];
            if (!matPass.enable) continue;

            let worldMatrix = node.object3D.transform._worldMatrix;
            if (this.drawType == 2) {
                for (let i = 0; i < passes.length; i++) {
                    let renderShader = passes[i].renderShader;
                    GPUContext.bindPipeline(encoder, renderShader);
                    GPUContext.draw(encoder, 6, 1, 0, worldMatrix.index);
                }
            } else {
                GPUContext.bindGeometryBuffer(encoder, node._geometry);
                for (let i = 0; i < passes.length; i++) {
                    let renderShader = passes[i].renderShader;

                    GPUContext.bindPipeline(encoder, renderShader);
                    let subGeometries = node._geometry.subGeometries;
                    for (let k = 0; k < subGeometries.length; k++) {
                        const subGeometry = subGeometries[k];
                        let lodInfos = subGeometry.lodLevels;
                        let lodInfo = lodInfos[node.lodLevel];
                        GPUContext.drawIndexed(encoder, lodInfo.indexCount, 1, lodInfo.indexStart, 0, worldMatrix.index);
                    }
                }
            }

        }


    }

    public recordRenderPass2(view: View3D, passType: RendererType, rendererPassState: RendererPassState, clusterLightingRender: ClusterLightingRender, encoder: GPURenderPassEncoder, useBundle: boolean = false) {
        if (!this.enable) return;
        this.nodeUpdate(view, passType, rendererPassState, clusterLightingRender);

        let node = this;
        for (let i = 0; i < this.materials.length; i++) {
            let material = this.materials[i];

            let passes = material.renderPasses.get(passType);
            if (!passes || passes.length == 0) return;

            let worldMatrix = node.object3D.transform._worldMatrix;
            for (let i = 0; i < passes.length; i++) {
                const renderShader = passes[i].renderShader;

                GPUContext.bindPipeline(encoder, renderShader);
                let subGeometries = node._geometry.subGeometries;
                for (let k = 0; k < subGeometries.length; k++) {
                    const subGeometry = subGeometries[k];
                    let lodInfos = subGeometry.lodLevels;
                    let lodInfo = lodInfos[node.lodLevel];
                    GPUContext.drawIndexed(encoder, lodInfo.indexCount, 1, lodInfo.indexStart, 0, worldMatrix.index);
                }
            }
        }

    }

    private noticeShaderChange() {
        if (this.enable) {
            this.onEnable();
        }
    }

    public nodeUpdate(view: View3D, passType: RendererType, renderPassState: RendererPassState, clusterLightingRender?: ClusterLightingRender) {

        let node = this;
        for (let i = 0; i < this.materials.length; i++) {
            let material = this.materials[i];
            let passes = material.renderPasses.get(passType);
            if (passes) {
                for (let i = 0; i < passes.length; i++) {
                    const pass = passes[i];// RenderShader.getShader(passes[i].shaderID);
                    const renderShader = pass.renderShader;// RenderShader.getShader(passes[i].shaderID);

                    if (renderShader.shaderState.splitTexture) {
                        let splitTexture = RTResourceMap.CreateSplitTexture(this.instanceID);
                        renderShader.setTexture("splitTexture_Map", splitTexture);
                    }

                    // renderShader.setUniformVector3("center", this.transform.worldPosition);

                    // if(scene3D.envMapChange){
                    if (!this._ignoreEnvMap) {
                        renderShader.setTexture(`envMap`, view.scene.envMap);
                    }
                    if (!this._ignorePrefilterMap) {
                        renderShader.setTexture(`prefilterMap`, view.scene.envMap);
                    }
                    // }

                    if (renderShader.pipeline) {
                        renderShader.apply(this._geometry, pass, renderPassState, () => this.noticeShaderChange());
                        continue;
                    }

                    let bdrflutTex = Engine3D.res.getTexture(`BRDFLUT`);
                    renderShader.setTexture(`brdflutMap`, bdrflutTex);

                    if (Engine3D.getRenderJob(view).shadowMapPassRenderer.depth2DTextureArray) {
                        renderShader.setTexture(`shadowMap`, Engine3D.getRenderJob(view).shadowMapPassRenderer.depth2DTextureArray);
                    }

                    // let shadowLight = ShadowLights.list;
                    // if (shadowLight.length) {
                    renderShader.setTexture(`pointShadowMap`, Engine3D.getRenderJob(view).pointLightShadowRenderer.cubeTextureArray);
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
                            renderShader.setStructStorageBuffer(`irradianceData`, lightUniformEntries.irradianceVolume.irradianceVolumeBuffer);
                        }
                    }


                    if (clusterLightingRender) {
                        renderShader.setStorageBuffer(`clustersUniform`, clusterLightingRender.clustersUniformBuffer);
                        renderShader.setStorageBuffer(`lightAssignBuffer`, clusterLightingRender.lightAssignBuffer);
                        renderShader.setStorageBuffer(`assignTable`, clusterLightingRender.assignTableBuffer);
                        renderShader.setStorageBuffer(`clusterBuffer`, clusterLightingRender.clusterBuffer);
                    }

                    renderShader.apply(this._geometry, pass, renderPassState);
                }
            }
        }
    }

}
