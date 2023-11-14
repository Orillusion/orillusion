import { Camera3D } from '../../../../core/Camera3D';
import { CubeCamera } from '../../../../core/CubeCamera';
import { Engine3D } from '../../../../Engine3D';
import { CEvent } from '../../../../event/CEvent';
import { RenderTexture } from '../../../../textures/RenderTexture';
import { EntityCollect } from '../../collect/EntityCollect';
import { GPUContext } from '../../GPUContext';
import { ProbeGBufferFrame } from '../../frame/ProbeGBufferFrame';
import { OcclusionSystem } from '../../occlusion/OcclusionSystem';
import { RendererBase } from '../RendererBase';
import { PassType } from '../state/RendererType';
import { DDGIIrradianceComputePass } from './DDGIIrradianceComputePass';
import { DDGIIrradianceVolume } from './DDGIIrradianceVolume';
import { DDGIMultiBouncePass } from './DDGIMultiBouncePass';
import { Probe } from './Probe';
import { Texture } from '../../../graphics/webGpu/core/texture/Texture';
import { View3D } from '../../../../core/View3D';
import { webGPUContext } from '../../../graphics/webGpu/Context3D';
import { GPUTextureFormat } from '../../../graphics/webGpu/WebGPUConst';
import { DDGILightingPass } from './DDGILightingPass';
import { ILight } from '../../../../components/lights/ILight';

export type GlobalIrradianceStatus = 'none' | 'rendering' | 'complete';
export let GIRenderStartEvent: CEvent = new CEvent('GIRenderStartEvent');
export let GIRenderCompleteEvent: CEvent = new CEvent('GIRenderCompleteEvent');

class ProbeRenderResult {
    count: number;
    complete: boolean;
}

/**
 * @internal
 * @group Post
 */
export class DDGIProbeRenderer extends RendererBase {
    private cubeCamera: CubeCamera;
    private volume: DDGIIrradianceVolume;
    private probeCountPerFrame = 1;
    private nextProbeIndex = -1;
    private tempProbeList: Probe[] = [];
    private isRenderCloudGI?: boolean;
    private probeRenderResult: ProbeRenderResult;
    private renderStatus: GlobalIrradianceStatus = 'none';

    public positionMap: RenderTexture;
    public normalMap: RenderTexture;
    public colorMap: RenderTexture;
    public probeNext: number = 128;
    public sizeW: number;
    public sizeH: number;
    public lightingPass: DDGILightingPass;
    public bouncePass: DDGIMultiBouncePass;
    public irradianceComputePass: DDGIIrradianceComputePass;
    public irradianceDepthMap: RenderTexture;
    public irradianceColorMap: RenderTexture;

    /**
     * 
     * @param volume 
     */
    constructor(volume: DDGIIrradianceVolume) {
        super();

        this.passType = PassType.GI;

        this.volume = volume;
        let giSetting = volume.setting;

        this.cubeCamera = new CubeCamera(0.01, 5000);

        this.sizeW = giSetting.probeSourceTextureSize;
        this.sizeH = giSetting.probeSourceTextureSize;

        this.probeNext = giSetting.probeSourceTextureSize / giSetting.probeSize;

        this.initIrradianceMap(volume);

        this.probeRenderResult = new ProbeRenderResult();

        let probeGBufferFrame = new ProbeGBufferFrame(this.sizeW, this.sizeH, false);
        this.positionMap = probeGBufferFrame.renderTargets[0];
        this.normalMap = probeGBufferFrame.renderTargets[1];
        this.colorMap = probeGBufferFrame.renderTargets[2];

        this.setRenderStates(probeGBufferFrame);
    }

    /**
     * @internal
     * @group DDGI
     */
    public setInputTexture(textures: Texture[]) {
        this.lightingPass = new DDGILightingPass();
        this.bouncePass = new DDGIMultiBouncePass(this.volume);
        this.irradianceComputePass = new DDGIIrradianceComputePass(this.volume);
        this.lightingPass.setInputs([this.positionMap, this.normalMap, this.colorMap, textures[0], textures[1]]);
        this.bouncePass.setInputs([this.normalMap, this.colorMap, this.lightingPass.lightingTexture, this.irradianceColorMap]);
        this.irradianceComputePass.setTextures([this.positionMap, this.normalMap, this.bouncePass.blendTexture], this.irradianceColorMap, this.irradianceDepthMap);
    }

    /**
     * @internal
     * @group DDGI
     */
    public setIrradianceData(colorData: Float32Array, depthData: Float32Array, width: number, height: number): void {
        if (width != this.irradianceColorMap.width || height != this.irradianceColorMap.height) {
            console.error('irradiance image size not match !');
            return;
        }

        this.writeToTexture(this.irradianceColorMap, colorData, width, height);
        this.writeToTexture(this.irradianceDepthMap, depthData, width, height);
    }



    public updateProbe(view: View3D, probe: Probe, encoder: GPURenderPassEncoder,) {
        let lights = EntityCollect.instance.getLights(view.scene);
        let cubeSize = this.volume.setting.probeSize; // cubeSize * 2 * 2 * 2;
        probe.drawCallFrame += 1;

        this.cubeCamera.x = probe.x;
        this.cubeCamera.y = probe.y;
        this.cubeCamera.z = probe.z;

        if (this.volume.setting.debugCamera) {
            this.cubeCamera.x = view.camera.transform.x;
            this.cubeCamera.y = view.camera.transform.y;
            this.cubeCamera.z = view.camera.transform.z;

            this.cubeCamera.rotationX = view.camera.transform.rotationX;
            this.cubeCamera.rotationY = view.camera.transform.rotationY;
            this.cubeCamera.rotationZ = view.camera.transform.rotationZ;
        } else {
            this.cubeCamera.rotationX = probe.rotationX;
            this.cubeCamera.rotationY = probe.rotationY;
            this.cubeCamera.rotationZ = probe.rotationZ;
        }

        let cubeCamera = this.cubeCamera;
        let offsetX = Math.floor(probe.index / this.probeNext) * (cubeSize * 6);
        let offsetY = Math.floor(probe.index % this.probeNext) * cubeSize;
        //left***********************/
        {
            encoder.setViewport(0 + offsetX, offsetY, cubeSize, cubeSize, 0.0, 1.0);
            this.renderSceneOnce(view, cubeCamera.right_camera, encoder, lights);
        }
        //left***********************/

        //right***********************/
        {
            encoder.setViewport(cubeSize + offsetX, offsetY, cubeSize, cubeSize, 0.0, 1.0);
            this.renderSceneOnce(view, cubeCamera.left_camera, encoder, lights);
        }
        //right***********************/

        //up***********************/
        {
            encoder.setViewport(cubeSize * 2 + offsetX, offsetY, cubeSize, cubeSize, 0.0, 1.0);
            this.renderSceneOnce(view, cubeCamera.up_camera, encoder, lights);
        }
        //up***********************/

        //down***********************/
        {
            encoder.setViewport(cubeSize * 3 + offsetX, offsetY, cubeSize, cubeSize, 0.0, 1.0);
            this.renderSceneOnce(view, cubeCamera.down_camera, encoder, lights);
        }
        //down***********************/

        //font***********************/
        {
            encoder.setViewport(cubeSize * 4 + offsetX, offsetY, cubeSize, cubeSize, 0.0, 1.0);
            this.renderSceneOnce(view, cubeCamera.front_camera, encoder, lights);
        }
        //font***********************/

        // back***********************/
        {
            encoder.setViewport(cubeSize * 5 + offsetX, offsetY, cubeSize, cubeSize, 0.0, 1.0);
            this.renderSceneOnce(view, cubeCamera.back_camera, encoder, lights);
        }
        //back***********************/
    }

    private renderSceneOnce(view: View3D, probeCamera: Camera3D, encoder: GPURenderPassEncoder, lights: ILight[]) {
        this.volume.uploadBuffer();

        let collectInfo = EntityCollect.instance.getRenderNodes(view.scene, probeCamera);
        GPUContext.bindCamera(encoder, probeCamera);

        let drawMin = Math.max(0, Engine3D.setting.render.drawOpMin);
        let drawMax = Math.min(Engine3D.setting.render.drawOpMax, collectInfo.opaqueList.length);

        let viewRenderList = EntityCollect.instance.getRenderShaderCollect(view);
        for (const renderList of viewRenderList) {
            let nodeMap = renderList[1];
            for (const iterator of nodeMap) {
                let node = iterator[1];
                if (node.preInit) {
                    node.nodeUpdate(view, this.passType, this.rendererPassState, null);
                    break;
                }
            }
        }

        for (let i = drawMin; i < drawMax; ++i) {
            let renderNode = collectInfo.opaqueList[i];
            if (renderNode.enable && renderNode.transform.enable) {
                if (!renderNode.preInit) {
                    renderNode.nodeUpdate(view, this.passType, this.rendererPassState, null);
                }
                renderNode.renderPass2(view, this.passType, this.rendererPassState, null, encoder);
            }
        }

        if (EntityCollect.instance.sky) {
            if (!EntityCollect.instance.sky.preInit) {
                EntityCollect.instance.sky.nodeUpdate(view, this.passType, this.rendererPassState, null);
            }
            EntityCollect.instance.sky.renderPass2(view, this.passType, this.rendererPassState, null, encoder);
        }

        drawMin = Math.max(0, Engine3D.setting.render.drawTrMin);
        drawMax = Math.min(Engine3D.setting.render.drawTrMax, collectInfo.transparentList.length);

        for (let i = drawMin; i < drawMax; ++i) {
            let renderNode = collectInfo.transparentList[i];
            if (renderNode.enable && renderNode.transform.enable) {
                if (!renderNode.preInit) {
                    renderNode.nodeUpdate(view, this.passType, this.rendererPassState, null);
                }
                renderNode.renderPass2(view, this.passType, this.rendererPassState, null, encoder);
            }
        }
    }

    public render(view: View3D, occlusionSystem: OcclusionSystem) {
        if (!Engine3D.setting.gi.enable) return;

        this.volume.updateOrientation();
        this.volume.isVolumeFrameChange = false;
        this.volume.uploadBuffer();

        // let sky = EntityCollect.instance.sky;
        // if (sky && !sky.preInit) {
        //     sky.nodeUpdate(view, this.passType, this.rendererPassState, null);
        // }

        this.rendProbe(view);
        let probeBeRendered = this.probeRenderResult.count > 0;

        if (EntityCollect.instance.state.giLightingChange || probeBeRendered || Engine3D.setting.gi.realTimeGI) {
            EntityCollect.instance.state.giLightingChange = false;
            this.lightingPass.compute(view, this.rendererPassState);
            this.bouncePass.compute(view, this.rendererPassState);
            this.irradianceComputePass.compute(view, this.rendererPassState);
        }

        if (this.probeRenderResult.complete) {
            this.dispatchEvent(GIRenderCompleteEvent);
        }
    }

    public startRenderGI(index: number = 0) {
        if (this.nextProbeIndex == -1 && index == 0) {
            this.dispatchEvent(GIRenderStartEvent);
        }
        this.nextProbeIndex = index;
        this.renderStatus = 'rendering';
    }

    public startRenderCloudGI() {
        this.dispatchEvent(GIRenderStartEvent);
        this.nextProbeIndex = 0;
        this.renderStatus = 'rendering';
        this.isRenderCloudGI = true;
    }

    private rendProbe(view: View3D): void {
        let autoRenderProbe = Engine3D.setting.gi.autoRenderProbe;

        //Determine whether to render the probe
        let execRender: boolean = false;
        if (autoRenderProbe) {
            if (this.nextProbeIndex == -1) {
                this.startRenderGI();
            }
            execRender = true;
        } else {
            execRender = this.renderStatus == 'rendering';
        }

        //Record the number of probe balls drawn in the current frame
        this.probeRenderResult.count = 0;
        this.probeRenderResult.complete = false;
        //On demand rendering probe
        if (execRender) {
            let probeList = EntityCollect.instance.getProbes(view.scene);
            this.renderContext.clean();
            this.renderContext.beginOpaqueRenderPass();
            this.tempProbeList.length = 0;
            let remainCount = Math.min(this.probeCountPerFrame, probeList.length);
            this.probeRenderResult.count = remainCount;

            while (remainCount > 0) {
                const probe = probeList[this.nextProbeIndex];
                this.updateProbe(view, probe, this.renderContext.encoder);
                remainCount--;
                this.nextProbeIndex++;
                //
                if (probe.drawCallFrame < 3) {
                    this.tempProbeList.push(probe);
                }
            }

            if (this.tempProbeList.length > 0) {
                this.volume.updateProbes(this.tempProbeList);
            }

            let isComplete = this.nextProbeIndex >= probeList.length;
            //todo  
            if (this.nextProbeIndex >= probeList.length && this.isRenderCloudGI) {
                this.updateProbe(view, probeList[0], this.renderContext.encoder);
            }
            this.renderContext.endRenderPass();

            if (isComplete) {
                this.nextProbeIndex = -1;
                this.renderStatus = 'complete';
                this.probeRenderResult.complete = true;
            }
        }
    }

    /**
     * @internal
     * @group DDGI
     */
    private initIrradianceMap(volume: DDGIIrradianceVolume): void {
        let setting = volume.setting;
        let usage = GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_SRC | GPUTextureUsage.COPY_DST;
        this.irradianceDepthMap = new RenderTexture(setting.octRTMaxSize, setting.octRTMaxSize, GPUTextureFormat.rgba16float, false, usage);
        this.irradianceDepthMap.name = 'irradianceDepthMap';
        this.irradianceColorMap = new RenderTexture(setting.octRTMaxSize, setting.octRTMaxSize, GPUTextureFormat.rgba16float, false, usage);
        this.irradianceColorMap.name = 'irradianceColorMap';
    }

    /**
    * @internal
    * @group DDGI
    */
    private writeToTexture(texture: RenderTexture, array: Float32Array, width: number, height: number) {
        console.log(texture.name);
        const buffer = webGPUContext.device.createBuffer({
            size: array.byteLength,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
        });

        webGPUContext.device.queue.writeBuffer(buffer, 0, array);
        const commandEncoder = GPUContext.beginCommandEncoder();
        commandEncoder.copyBufferToTexture(
            {
                buffer: buffer,
                bytesPerRow: width * 16,
            },
            {
                texture: texture.getGPUTexture(),
            },
            {
                width: width,
                height: height,
                depthOrArrayLayers: 1,
            },
        );

        GPUContext.endCommandEncoder(commandEncoder);
    }
}
