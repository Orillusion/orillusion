import { LightType } from '../../../../components/lights/LightData';
import { ShadowLightsCollect } from '../../collect/ShadowLightsCollect';
import { Camera3D } from '../../../../core/Camera3D';
import { CubeCamera } from '../../../../core/CubeCamera';
import { Engine3D } from '../../../../Engine3D';
import { VirtualTexture } from '../../../../textures/VirtualTexture';
import { GPUTextureFormat } from '../../../graphics/webGpu/WebGPUConst';
import { CollectInfo } from '../../collect/CollectInfo';
import { EntityCollect } from '../../collect/EntityCollect';
import { GPUContext } from '../../GPUContext';
import { RTFrame } from '../../frame/RTFrame';
import { OcclusionSystem } from '../../occlusion/OcclusionSystem';
import { RendererBase } from '../RendererBase';
import { RenderNode } from '../../../../components/renderer/RenderNode';
import { PointShadowCubeCamera } from '../../../../core/PointShadowCubeCamera';
import { View3D } from '../../../../core/View3D';
import { DepthCubeArrayTexture } from '../../../../textures/DepthCubeArrayTexture';
import { Time } from '../../../../util/Time';
import { RTDescriptor } from '../../../graphics/webGpu/descriptor/RTDescriptor';
import { WebGPUDescriptorCreator } from '../../../graphics/webGpu/descriptor/WebGPUDescriptorCreator';
import { RendererPassState } from '../state/RendererPassState';
import { RendererType } from '../state/RendererType';
import { ILight } from '../../../../components/lights/ILight';

type CubeShadowMapInfo = {
    cubeCamera: CubeCamera,
    depthTexture: VirtualTexture[],
    rendererPassState: RendererPassState[]
}

/**
 * @internal
 * @group Post
 */
export class PointLightShadowRenderer extends RendererBase {
    public shadowPassCount: number;
    private _forceUpdate = false;
    private _shadowCameraDic: Map<ILight, CubeShadowMapInfo>;
    public shadowCamera: Camera3D;
    public cubeTextureArray: DepthCubeArrayTexture;
    public colorTexture: VirtualTexture;
    public shadowSize: number = 1024;
    constructor() {
        super();
        this.passType = RendererType.POINT_SHADOW;

        // this.shadowSize = Engine3D.setting.shadow.pointShadowSize;
        this._shadowCameraDic = new Map<ILight, CubeShadowMapInfo>();
        this.cubeTextureArray = new DepthCubeArrayTexture(this.shadowSize, this.shadowSize, 8);
        this.colorTexture = new VirtualTexture(this.shadowSize, this.shadowSize, GPUTextureFormat.bgra8unorm, false);
    }



    public getShadowCamera(view: View3D, lightBase: ILight): CubeShadowMapInfo {
        let cubeShadowMapInfo: CubeShadowMapInfo;
        if (this._shadowCameraDic.has(lightBase)) {
            cubeShadowMapInfo = this._shadowCameraDic.get(lightBase);
        } else {
            let camera = new PointShadowCubeCamera(view.camera.near, view.camera.far, 90, true);
            camera.label = lightBase.name;
            let depths: VirtualTexture[] = [];
            let rendererPassStates: RendererPassState[] = [];
            for (let i = 0; i < 6; i++) {

                let depthTexture = new VirtualTexture(this.shadowSize, this.shadowSize, this.cubeTextureArray.format, false);
                let rtFrame = new RTFrame([this.colorTexture], [new RTDescriptor()]);
                depthTexture.name = `shadowDepthTexture_` + lightBase.name + i + "_face";
                rtFrame.depthTexture = depthTexture;
                rtFrame.label = "shadowRender"
                rtFrame.customSize = true;

                let rendererPassState = WebGPUDescriptorCreator.createRendererPassState(rtFrame);
                rendererPassStates[i] = rendererPassState;
                depths[i] = depthTexture;

                Engine3D.getRenderJob(view).postRenderer.setDebugTexture([depthTexture]);
                Engine3D.getRenderJob(view).debug();
            }
            cubeShadowMapInfo = {
                cubeCamera: camera,
                depthTexture: depths,
                rendererPassState: rendererPassStates,
            }
            this._shadowCameraDic.set(lightBase, cubeShadowMapInfo);
        }
        return cubeShadowMapInfo;
    }

    render(view: View3D, occlusionSystem: OcclusionSystem) {
        // return ;
        if (!Engine3D.setting.shadow.enable)
            return;
        // return ;
        this.shadowPassCount = 0;

        let camera = view.camera;
        let scene = view.scene;
        // return ;
        // if (!Engine3D.engineSetting.Shadow.needUpdate) return;
        // if (!(Time.frame % Engine3D.engineSetting.Shadow.updateFrameRate == 0)) return;
        // return ;//
        //*********************/
        //***shadow light******/
        //*********************/
        let collectInfo = EntityCollect.instance.getRenderNodes(scene);


        let shadowLight = ShadowLightsCollect.getPointShadowLightWhichScene(scene);
        let li = 0;
        let shadowLightCount = shadowLight.length;
        for (let si = 0; si < shadowLightCount; si++) {
            let light = shadowLight[si];
            if (light.lightData.lightType == LightType.DirectionLight)
                continue;
            if (light.lightData.castShadowIndex > -1 && (light.needUpdateShadow || this._forceUpdate || Time.frame < 5 || light.realTimeShadow)) {
                light.needUpdateShadow = false;

                let cubeShadowMapInfo = this.getShadowCamera(view, light);
                let worldPos = light.transform.worldPosition;

                cubeShadowMapInfo.cubeCamera.x = worldPos.x;
                cubeShadowMapInfo.cubeCamera.y = worldPos.y;
                cubeShadowMapInfo.cubeCamera.z = worldPos.z;

                cubeShadowMapInfo.cubeCamera.transform.updateWorldMatrix(true);
                {
                    occlusionSystem.update(cubeShadowMapInfo.cubeCamera.right_camera, scene);
                    this.renderSceneOnce(0, cubeShadowMapInfo, view, cubeShadowMapInfo.cubeCamera.right_camera, collectInfo, occlusionSystem);

                    occlusionSystem.update(cubeShadowMapInfo.cubeCamera.left_camera, scene);
                    this.renderSceneOnce(1, cubeShadowMapInfo, view, cubeShadowMapInfo.cubeCamera.left_camera, collectInfo, occlusionSystem);

                    occlusionSystem.update(cubeShadowMapInfo.cubeCamera.up_camera, scene);
                    this.renderSceneOnce(2, cubeShadowMapInfo, view, cubeShadowMapInfo.cubeCamera.up_camera, collectInfo, occlusionSystem);

                    occlusionSystem.update(cubeShadowMapInfo.cubeCamera.down_camera, scene);
                    this.renderSceneOnce(3, cubeShadowMapInfo, view, cubeShadowMapInfo.cubeCamera.down_camera, collectInfo, occlusionSystem);

                    occlusionSystem.update(cubeShadowMapInfo.cubeCamera.front_camera, scene);
                    this.renderSceneOnce(4, cubeShadowMapInfo, view, cubeShadowMapInfo.cubeCamera.front_camera, collectInfo, occlusionSystem);

                    occlusionSystem.update(cubeShadowMapInfo.cubeCamera.back_camera, scene);
                    this.renderSceneOnce(5, cubeShadowMapInfo, view, cubeShadowMapInfo.cubeCamera.back_camera, collectInfo, occlusionSystem);
                }
                let qCommand = GPUContext.beginCommandEncoder();
                for (let i = 0; i < 6; i++) {
                    qCommand.copyTextureToTexture(
                        {
                            texture: cubeShadowMapInfo.depthTexture[i].getGPUTexture(),
                            mipLevel: 0,
                            origin: { x: 0, y: 0, z: 0 },
                        },
                        {
                            texture: this.cubeTextureArray.getGPUTexture(),
                            mipLevel: 0,
                            origin: { x: 0, y: 0, z: light.shadowIndex * 6 + i },
                        },
                        {
                            width: this.shadowSize,
                            height: this.shadowSize,
                            depthOrArrayLayers: 1,
                        },
                    );
                }
                GPUContext.endCommandEncoder(qCommand);
                // Camera3D.mainCamera.cubeShadowCameras[li] = cubeShadowMapInfo.cubeCamera;
                li++;
            }
        }
        this._forceUpdate = false;
    }


    private renderSceneOnce(face: number, cubeShadowMapInfo: CubeShadowMapInfo, view: View3D, shadowCamera: Camera3D, collectInfo: CollectInfo, occlusionSystem: OcclusionSystem) {
        this.rendererPassState = cubeShadowMapInfo.rendererPassState[face];
        let command = GPUContext.beginCommandEncoder();
        let encoder = GPUContext.beginRenderPass(command, this.rendererPassState);

        encoder.setViewport(0, 0, this.shadowSize, this.shadowSize, 0.0, 1.0);
        encoder.setScissorRect(0, 0, this.shadowSize, this.shadowSize);

        shadowCamera.onUpdate();
        shadowCamera.transform.updateWorldMatrix(true);

        this.drawShadowRenderNodes(view, shadowCamera, encoder, collectInfo.opaqueList, occlusionSystem);
        this.drawShadowRenderNodes(view, shadowCamera, encoder, collectInfo.transparentList, occlusionSystem);

        GPUContext.endPass(encoder);
        GPUContext.endCommandEncoder(command);
    }

    protected drawShadowRenderNodes(view: View3D, shadowCamera: Camera3D, encoder: GPURenderPassEncoder, nodes: RenderNode[], occlusionSystem: OcclusionSystem) {
        GPUContext.bindCamera(encoder, shadowCamera);
        for (let i = Engine3D.setting.render.drawOpMin; i < Math.min(nodes.length, Engine3D.setting.render.drawOpMax); ++i) {
            let renderNode = nodes[i];
            let matrixIndex = renderNode.transform.worldMatrix.index;
            if (!renderNode.transform.enable)
                continue;
            if (!occlusionSystem.renderCommitTesting(shadowCamera, renderNode))
                continue;
            if (!renderNode.enable)
                continue;
            renderNode.nodeUpdate(view, this._rendererType, this.rendererPassState);

            for (let i = 0; i < renderNode.materials.length; i++) {
                const material = renderNode.materials[i];
                let passes = material.renderPasses.get(this._rendererType);
                if (!passes || passes.length == 0)
                    continue;

                GPUContext.bindGeometryBuffer(encoder, renderNode.geometry);
                let worldMatrix = renderNode.object3D.transform._worldMatrix;
                for (let i = 0; i < passes.length; i++) {
                    const renderShader = passes[i].renderShader;
                    // const renderShader = RenderShader.getShader(passes[i].shaderID);

                    renderShader.setUniformFloat("cameraFar", shadowCamera.far);
                    renderShader.setUniformVector3("lightWorldPos", shadowCamera.transform.worldPosition);
                    renderShader.materialDataUniformBuffer.apply();

                    GPUContext.bindPipeline(encoder, renderShader);
                    let subGeometries = renderNode.geometry.subGeometries;
                    for (let k = 0; k < subGeometries.length; k++) {
                        const subGeometry = subGeometries[k];
                        let lodInfos = subGeometry.lodLevels;
                        let lodInfo = lodInfos[renderNode.lodLevel];
                        GPUContext.drawIndexed(encoder, lodInfo.indexCount, 1, lodInfo.indexStart, 0, worldMatrix.index);
                    }
                }
            }
        }
    }
}
