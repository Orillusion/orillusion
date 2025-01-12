import { Camera3D } from '../../../../core/Camera3D';
import { CubeCamera } from '../../../../core/CubeCamera';
import { Engine3D } from '../../../../Engine3D';
import { EntityCollect } from '../../collect/EntityCollect';
import { GPUContext } from '../../GPUContext';
import { OcclusionSystem } from '../../occlusion/OcclusionSystem';
import { RendererBase } from '../RendererBase';
import { PassType } from '../state/PassType';
import { View3D } from '../../../../core/View3D';
import { GBufferFrame } from '../../frame/GBufferFrame';
import { ClusterLightingBuffer } from '../cluster/ClusterLightingBuffer';
import { RenderContext } from '../RenderContext';
import { RenderNode } from '../../../../components/renderer/RenderNode';
import { RendererMask } from '../state/RendererMask';
import { PreFilteredEnvironment_cs } from '../../../../assets/shader/compute/PreFilteredEnvironment_cs';
import { ComputeShader } from '../../../graphics/webGpu/shader/ComputeShader';
import { VirtualTexture } from '../../../../textures/VirtualTexture';
import { GPUTextureFormat } from '../../../graphics/webGpu/WebGPUConst';
import { UniformGPUBuffer } from '../../../graphics/webGpu/core/buffer/UniformGPUBuffer';
import { GlobalBindGroup } from '../../../graphics/webGpu/core/bindGroups/GlobalBindGroup';
import { Time } from '../../../../util/Time';

/**
 * @internal
 * @group Post
 */
export class ReflectionRenderer extends RendererBase {
    private cubeCamera: CubeCamera;
    public gBuffer: GBufferFrame;

    public sizeW: number = 0;
    public sizeH: number = 0;

    public probeSize = 64;
    public probeCount = 32;
    public mipCount = 8;
    public preFilteredEnvironmentCompute: ComputeShader;
    public outTexture: VirtualTexture;
    public preFilteredEnvironmentUniform: UniformGPUBuffer;

    private onChange: boolean = true;
    private needUpdate: boolean = true;
    /**
     * 
     * @param volume 
     */
    constructor() {
        super();

        this.passType = PassType.REFLECTION;

        this.cubeCamera = new CubeCamera(0.01, 5000);
        let mipmap = 1;// TextureMipmapGenerator.getMipmapCount(this.sizeW, this.sizeH);

        this.probeSize = Engine3D.setting.reflectionSetting.reflectionProbeSize;
        this.probeCount = Engine3D.setting.reflectionSetting.reflectionProbeMaxCount;
        this.sizeW = Engine3D.setting.reflectionSetting.width;
        this.sizeH = Engine3D.setting.reflectionSetting.height;

        this.gBuffer = GBufferFrame.getGBufferFrame(GBufferFrame.reflections_GBuffer, this.sizeW, this.sizeH, false);
        this.setRenderStates(this.gBuffer);

        this.outTexture = new VirtualTexture(this.probeSize * this.mipCount, this.sizeH, GPUTextureFormat.rgba16float, false, GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.COPY_SRC | GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING, 1, 0, mipmap);
        this.outTexture.name = 'texture_AAA';

        this.preFilteredEnvironmentUniform = new UniformGPUBuffer(4 + this.probeCount * 4);
        this.preFilteredEnvironmentUniform.setFloat("probeSize", this.probeSize);
        this.preFilteredEnvironmentUniform.setFloat("probeCount", this.probeCount);
        this.preFilteredEnvironmentUniform.setFloat("width", this.sizeW);
        this.preFilteredEnvironmentUniform.setFloat("height", this.sizeH);
        this.preFilteredEnvironmentUniform.apply();

        this.preFilteredEnvironmentCompute = new ComputeShader(PreFilteredEnvironment_cs);
        this.preFilteredEnvironmentCompute.setSamplerTexture("inputTex", this.gBuffer.getCompressGBufferTexture());
        this.preFilteredEnvironmentCompute.setStorageTexture("outputTexture", this.outTexture);
        this.preFilteredEnvironmentCompute.setUniformBuffer("uniformData", this.preFilteredEnvironmentUniform);
    }

    public forceUpdate() {
        this.onChange = true;
    }

    public compute(view: View3D, occlusionSystem: OcclusionSystem): void {
        if (this.needUpdate) {
            this.needUpdate = false;
            let reflectionEntries = GlobalBindGroup.getReflectionEntries(view.scene);
            reflectionEntries.reflectionMap = this.outTexture;

            this.preFilteredEnvironmentCompute.workerSizeX = Math.ceil(this.probeSize * this.mipCount / 16);
            this.preFilteredEnvironmentCompute.workerSizeY = Math.ceil(this.sizeH / 16);
            this.preFilteredEnvironmentCompute.workerSizeZ = this.mipCount * reflectionEntries.count;

            let command = GPUContext.beginCommandEncoder();
            GPUContext.computeCommand(
                command,
                [
                    this.preFilteredEnvironmentCompute
                ]
            );
            GPUContext.endCommandEncoder(command);
        }
    }

    public render(view: View3D, occlusionSystem: OcclusionSystem, clusterLightingBuffer?: ClusterLightingBuffer, maskTr: boolean = false, hasPost: boolean = false): void {
        this.renderContext.clean();
        let spaceX = this.probeSize;
        let spaceY = this.probeSize;

        let reflections = EntityCollect.instance.getReflections(view.scene);

        for (let i = 0; i < reflections.length; i++) {
            let reflection = reflections[i];
            if (reflection.autoUpdate && (reflection.needUpdate || this.onChange) || Time.frame < 10) {
                reflection.needUpdate = false;
                this.needUpdate = true;
                this.renderContext.beginOpaqueRenderPass();
                let encoder = this.renderContext.encoder;

                let offsetY = i * spaceY;
                reflections[i].transform.updateWorldMatrix();
                let worldPos = reflections[i].transform.worldPosition;
                this.cubeCamera.x = worldPos.x;
                this.cubeCamera.y = worldPos.y;
                this.cubeCamera.z = worldPos.z;
                this.cubeCamera.far = 10000;// view.camera.far;
                this.cubeCamera.transform.updateWorldMatrix();

                encoder.setViewport(spaceX * 0, offsetY, spaceX, spaceY, 0.0, 1.0);
                this.renderOnce(view, this.cubeCamera.right_camera, encoder, occlusionSystem, clusterLightingBuffer, maskTr);

                encoder.setViewport(spaceX * 1, offsetY, spaceX, spaceY, 0.0, 1.0);
                this.renderOnce(view, this.cubeCamera.left_camera, encoder, occlusionSystem, clusterLightingBuffer, maskTr);

                encoder.setViewport(spaceX * 2, offsetY, spaceX, spaceY, 0.0, 1.0);
                this.renderOnce(view, this.cubeCamera.up_camera, encoder, occlusionSystem, clusterLightingBuffer, maskTr);

                encoder.setViewport(spaceX * 3, offsetY, spaceX, spaceY, 0.0, 1.0);
                this.renderOnce(view, this.cubeCamera.down_camera, encoder, occlusionSystem, clusterLightingBuffer, maskTr);

                encoder.setViewport(spaceX * 4, offsetY, spaceX, spaceY, 0.0, 1.0);
                this.renderOnce(view, this.cubeCamera.front_camera, encoder, occlusionSystem, clusterLightingBuffer, maskTr);

                encoder.setViewport(spaceX * 5, offsetY, spaceX, spaceY, 0.0, 1.0);
                this.renderOnce(view, this.cubeCamera.back_camera, encoder, occlusionSystem, clusterLightingBuffer, maskTr);
                this.renderContext.endRenderPass();
            }
        }


        this.onChange = false;
    }

    public renderOnce(view: View3D, camera: Camera3D, encoder, occlusionSystem: OcclusionSystem, clusterLightingBuffer?: ClusterLightingBuffer, maskTr: boolean = false) {
        let scene = view.scene;
        camera.transform.scene3D = scene;
        this.rendererPassState.camera3D = camera;
        let collectInfo = EntityCollect.instance.getRenderNodes(scene, camera);
        {
            let renderPassEncoder = encoder;
            GlobalBindGroup.updateCameraGroup(camera);

            if (!maskTr && EntityCollect.instance.sky) {
                GPUContext.bindCamera(renderPassEncoder, camera);
                if (!EntityCollect.instance.sky.preInit(PassType.REFLECTION)) {
                    EntityCollect.instance.sky.nodeUpdate(view, PassType.REFLECTION, this.rendererPassState, clusterLightingBuffer);
                }
                EntityCollect.instance.sky.renderPass2(view, PassType.REFLECTION, this.rendererPassState, clusterLightingBuffer, renderPassEncoder);
            }

            if (collectInfo.opaqueList) {
                GPUContext.bindCamera(renderPassEncoder, camera);
                this.drawNodes(view, this.renderContext, collectInfo.opaqueList, occlusionSystem, clusterLightingBuffer);
            }

            if (!maskTr && collectInfo.transparentList) {
                GPUContext.bindCamera(renderPassEncoder, camera);
                this.drawNodes(view, this.renderContext, collectInfo.transparentList, occlusionSystem, clusterLightingBuffer);
            }
        }
    }

    public drawNodes(view: View3D, renderContext: RenderContext, nodes: RenderNode[], occlusionSystem: OcclusionSystem, clusterLightingBuffer: ClusterLightingBuffer) {
        let viewRenderList = EntityCollect.instance.getRenderShaderCollect(view);
        if (viewRenderList) {
            for (const renderList of viewRenderList) {
                let nodeMap = renderList[1];
                for (const iterator of nodeMap) {
                    let node = iterator[1];
                    if (node.hasMask(RendererMask.ReflectionDebug))
                        continue;
                    if (!node.isDestroyed && node.preInit(PassType.REFLECTION)) {
                        node.nodeUpdate(view, PassType.REFLECTION, this.rendererPassState, clusterLightingBuffer);
                        break;
                    }
                }
            }

            // for (let i = Engine3D.setting.render.drawOpMin; i < Math.min(nodes.length, Engine3D.setting.render.drawOpMax); ++i) {
            for (let i = 0; i < nodes.length; i++) {
                let renderNode = nodes[i];
                // if (!occlusionSystem.renderCommitTesting(view.camera, renderNode))
                //     continue;
                if (renderNode.hasMask(RendererMask.ReflectionDebug))
                    continue;
                if (!renderNode.transform.enable)
                    continue;
                if (!renderNode.enable)
                    continue;
                if (renderNode.isDestroyed)
                    continue;
                if (!renderNode.preInit(PassType.REFLECTION)) {
                    renderNode.nodeUpdate(view, PassType.REFLECTION, this.rendererPassState, clusterLightingBuffer);
                }
                renderNode.renderPass(view, PassType.REFLECTION, this.renderContext);
            }
        }
    }


    protected occlusionRenderNodeTest(i: number, id: number, occlusionSystem: OcclusionSystem): boolean {
        return true;//occlusionSystem.zDepthRenderNodeTest(id) > 0;
    }
}
