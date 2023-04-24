import { RenderNode } from '../../../../components/renderer/RenderNode';
import { Camera3D } from '../../../../core/Camera3D';
import { Scene3D } from '../../../../core/Scene3D';
import { Engine3D } from '../../../../Engine3D';
import { VirtualTexture } from '../../../../textures/VirtualTexture';
import { ProfilerUtil } from '../../../../util/ProfilerUtil';
import { GlobalBindGroup } from '../../../graphics/webGpu/core/bindGroups/GlobalBindGroup';
import { StorageGPUBuffer } from '../../../graphics/webGpu/core/buffer/StorageGPUBuffer';
import { RTDescriptor } from '../../../graphics/webGpu/descriptor/RTDescriptor';
import { GPUTextureFormat } from '../../../graphics/webGpu/WebGPUConst';
import { webGPUContext } from '../../../graphics/webGpu/Context3D';
import { CollectInfo } from '../../collect/CollectInfo';
import { EntityCollect } from '../../collect/EntityCollect';
import { GPUContext } from '../../GPUContext';
import { RTFrame } from '../../frame/RTFrame';
import { RTResourceConfig } from '../../config/RTResourceConfig';
import { RTResourceMap } from '../../frame/RTResourceMap';
import { OcclusionSystem } from '../../occlusion/OcclusionSystem';
import { RendererBase } from '../RendererBase';
import { RendererType } from '../state/RendererType';
import { ZCullingCompute } from './ZCullingCompute';
import { View3D } from '../../../../core/View3D';
/**
 * @internal
 * @group Post
 */
export class PreDepthPassRenderer extends RendererBase {
    public zBufferTexture: VirtualTexture;
    public useRenderBundle: boolean = false;
    shadowPassCount: number;
    zCullingCompute: ZCullingCompute;
    constructor() {
        super();
        this.passType = RendererType.DEPTH;

        let size = webGPUContext.presentationSize;
        let scale = 1;
        this.zBufferTexture = RTResourceMap.createRTTexture(RTResourceConfig.zBufferTexture_NAME, Math.floor(size[0] * scale), Math.floor(size[1] * scale), GPUTextureFormat.rgba16float, false);
        let rtDec = new RTDescriptor()
        rtDec.clearValue = [0, 0, 0, 0];
        rtDec.loadOp = `clear`;
        let rtFrame = new RTFrame([
            this.zBufferTexture
        ], [
            new RTDescriptor()
        ],
            RTResourceMap.createRTTexture(RTResourceConfig.zPreDepthTexture_NAME, Math.floor(size[0]), Math.floor(size[1]), GPUTextureFormat.depth32float, false),
            null,
            true
        );
        this.setRenderStates(rtFrame);
    }

    public lateCompute(view: View3D, occlusionSystem: OcclusionSystem) {
        // this.zCullingCompute.compute(scene, occlusionSystem);
    }

    render(view: View3D, occlusionSystem: OcclusionSystem) {
        return;
        let camera = view.camera;
        let scene = view.scene;
        GPUContext.cleanCache();

        ProfilerUtil.start("DepthPass Renderer");

        let scene3D = scene;

        this.rendererPassState.camera3D = camera;
        let collectInfo = EntityCollect.instance.getRenderNodes(scene3D);
        // this.compute(collectInfo, scene, occlusionSystem);

        // let op_bundleList = this.renderBundleOp(camera, collectInfo, scene, occlusionSystem);
        // let tr_bundleList = true ? [] : this.renderBundleTr(camera, collectInfo, scene, occlusionSystem);

        let command = GPUContext.beginCommandEncoder();
        let encoder = GPUContext.beginRenderPass(command, this.rendererPassState);

        // if (op_bundleList.length > 0) {
        //     encoder.executeBundles(op_bundleList);
        // }

        // if(!true&&EntityCollect.instance.sky){
        //     GPUContext.bindCamera( encoder , camera);
        //     EntityCollect.instance.sky.renderPass2(this._rendererType,this.rendererPassState,scene,this.clusterLightingRender, encoder );
        // }

        // this.drawRenderNodes(camera, scene, encoder, command, collectInfo.opaqueList, occlusionSystem);

        // if (tr_bundleList.length > 0) {
        //     encoder.executeBundles(tr_bundleList);
        // }

        // if (false) {
        //     this.drawRenderNodes(camera, scene, encoder, command, collectInfo.transparentList, occlusionSystem);
        // }

        GPUContext.endPass(encoder);
        GPUContext.endCommandEncoder(command);

        ProfilerUtil.end("DepthPass Renderer");
        // ProfilerUtil.print( "DepthPass Renderer" );
    }


}
