import { View3D } from '../../../../core/View3D';
import { GlobalBindGroup } from '../../../graphics/webGpu/core/bindGroups/GlobalBindGroup';
import { ComputeShader } from '../../../graphics/webGpu/shader/ComputeShader';
import { webGPUContext } from '../../../graphics/webGpu/Context3D';
import { EntityCollect } from '../../collect/EntityCollect';
import { GPUContext } from '../../GPUContext';
import { OcclusionSystem } from '../../occlusion/OcclusionSystem';
import { RendererBase } from '../RendererBase';
import { RendererType } from '../state/RendererType';
import { ILight } from '../../../../components/lights/ILight';
import { ClusterLightingBuffer } from './ClusterLightingBuffer';
import { ClusterBoundsSource_cs } from '../../../../assets/shader/cluster/ClusterBoundsSource_cs';
import { ClusterLighting_cs } from '../../../../assets/shader/cluster/ClusterLighting_cs';
import { Camera3D, Vector3, Vector4 } from '../../../..';
import { GUIHelp } from '@orillusion/debug/GUIHelp';
/**
 * @internal
 * @group Post
 */
export class ClusterLightingRender extends RendererBase {
    public clusterTileX = 8;
    public clusterTileY = 4;
    public clusterTileZ = 16;
    public maxNumLights = 128;
    public maxNumLightsPerCluster = 1024;
    public clusterPix = 1;
    public clusterLightingBuffer: ClusterLightingBuffer;

    private _currentLightCount = 0;
    private _clusterGenerateCompute: ComputeShader;
    private _clusterLightingCompute: ComputeShader;
    private _useCamera: Camera3D;
    constructor(view: View3D) {
        super();

        this.passType = RendererType.Cluster;
        this.initCompute(view);
    }

    private initCompute(view: View3D) {
        this._clusterGenerateCompute = new ComputeShader(ClusterBoundsSource_cs);
        this._clusterLightingCompute = new ComputeShader(ClusterLighting_cs);

        let size = webGPUContext.presentationSize;
        let numClusters = this.clusterTileX * this.clusterTileY * this.clusterTileZ;

        let camera = view.camera;
        let near = camera.near;
        let far = camera.far;

        this.clusterLightingBuffer = new ClusterLightingBuffer(numClusters, this.maxNumLightsPerCluster);
        this.clusterLightingBuffer.update(size[0], size[1], this.clusterPix, this.clusterTileX, this.clusterTileY, this.clusterTileZ, this.maxNumLights, this.maxNumLightsPerCluster, near, far);

        // let standBindGroup = GlobalBindGroup.getCameraGroup(camera);
        // this._clusterGenerateCompute.setUniformBuffer(`globalUniform`, standBindGroup.uniformGPUBuffer);
        // this._clusterLightingCompute.setUniformBuffer(`globalUniform`, standBindGroup.uniformGPUBuffer);
        this._clusterGenerateCompute.setUniformBuffer(`clustersUniform`, this.clusterLightingBuffer.clustersUniformBuffer);
        this._clusterGenerateCompute.setStorageBuffer(`clusterBuffer`, this.clusterLightingBuffer.clusterBuffer);

        let lightBuffer = GlobalBindGroup.getLightEntries(view.scene);
        this._clusterLightingCompute.setStorageBuffer(`models`, GlobalBindGroup.modelMatrixBindGroup.matrixBufferDst);
        this._clusterLightingCompute.setUniformBuffer(`clustersUniform`, this.clusterLightingBuffer.clustersUniformBuffer);
        this._clusterLightingCompute.setStorageBuffer(`clusterBuffer`, this.clusterLightingBuffer.clusterBuffer);
        this._clusterLightingCompute.setStorageBuffer(`lightBuffer`, lightBuffer.storageGPUBuffer);
        this._clusterLightingCompute.setStorageBuffer(`lightAssignBuffer`, this.clusterLightingBuffer.lightAssignBuffer);
        this._clusterLightingCompute.setStorageBuffer(`assignTable`, this.clusterLightingBuffer.assignTableBuffer);


        GUIHelp.addButton("clusterBuffer", () => {
            let od = this.clusterLightingBuffer.clusterBuffer.readBuffer();
            console.log(od);

            let byteLength = 2 * 4;
            for (let i = 0; i < numClusters; i++) {
                const element = new Float32Array(od.buffer, i * byteLength * 4, byteLength);
                let min = new Vector3(element[0], element[1], element[2], element[3]);
                let max = new Vector3(element[4], element[5], element[6], element[7]);
                view.graphic3D.drawBox(i + "-box", min, max);
            }
        });

    }

    render(view: View3D, occlusionSystem: OcclusionSystem) {
        let scene = view.scene;
        let lights: ILight[] = EntityCollect.instance.getLights(scene);

        if (this._useCamera != view.camera) {
            this._useCamera = view.camera;
            let standBindGroup = GlobalBindGroup.getCameraGroup(this._useCamera);
            this._clusterGenerateCompute.setUniformBuffer(`globalUniform`, standBindGroup.uniformGPUBuffer);
            this._clusterLightingCompute.setUniformBuffer(`globalUniform`, standBindGroup.uniformGPUBuffer);
        }

        if (this._currentLightCount != lights.length) {
            this._currentLightCount = lights.length;

            this.clusterLightingBuffer.clustersUniformBuffer.setFloat('numLights', lights.length);
            this.clusterLightingBuffer.clustersUniformBuffer.apply();

            this._clusterGenerateCompute.workerSizeX = this.clusterTileZ;
            this._clusterLightingCompute.workerSizeX = this.clusterTileZ;
        }

        let size = webGPUContext.presentationSize;
        this.clusterLightingBuffer.update(
            size[0], size[1],
            this.clusterPix, this.clusterTileX, this.clusterTileY, this.clusterTileZ, this.maxNumLights, this.maxNumLightsPerCluster,
            view.camera.near,
            view.camera.far);

        // if (lights.length > 0) {
        let command = GPUContext.beginCommandEncoder();
        GPUContext.computeCommand(command, [this._clusterGenerateCompute, this._clusterLightingCompute]);
        GPUContext.endCommandEncoder(command);
        // }
    }
}
