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
/**
 * @internal
 * @group Post
 */
export class ClusterLightingRender extends RendererBase {
    public clusterTileX = 16;
    public clusterTileY = 12;
    public clusterTileZ = 24;
    public maxNumLights = 128;
    public maxNumLightsPerCluster = 100;
    public clusterPix = 1;
    public clusterLightingBuffer: ClusterLightingBuffer;

    private _clusterGenerateCompute: ComputeShader;
    private _clusterLightingCompute: ComputeShader;
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

        let standBindGroup = GlobalBindGroup.getCameraGroup(camera);
        this._clusterGenerateCompute.setUniformBuffer(`globalUniform`, standBindGroup.uniformGPUBuffer);
        this._clusterLightingCompute.setUniformBuffer(`globalUniform`, standBindGroup.uniformGPUBuffer);
        this._clusterGenerateCompute.setUniformBuffer(`clustersUniform`, this.clusterLightingBuffer.clustersUniformBuffer);
        this._clusterGenerateCompute.setStorageBuffer(`clusterBuffer`, this.clusterLightingBuffer.clusterBuffer);

        let lightBuffer = GlobalBindGroup.getLightEntries(view.scene);
        this._clusterLightingCompute.setStorageBuffer(`models`, GlobalBindGroup.modelMatrixBindGroup.matrixBufferDst);
        this._clusterLightingCompute.setUniformBuffer(`clustersUniform`, this.clusterLightingBuffer.clustersUniformBuffer);
        this._clusterLightingCompute.setStorageBuffer(`clusterBuffer`, this.clusterLightingBuffer.clusterBuffer);
        this._clusterLightingCompute.setStorageBuffer(`lightBuffer`, lightBuffer.storageGPUBuffer);
        this._clusterLightingCompute.setStorageBuffer(`lightAssignBuffer`, this.clusterLightingBuffer.lightAssignBuffer);
        this._clusterLightingCompute.setStorageBuffer(`assignTable`, this.clusterLightingBuffer.assignTableBuffer);

        this.debug(view);
    }

    render(view: View3D, occlusionSystem: OcclusionSystem) {
        let camera = view.camera;
        let scene = view.scene;
        let near = camera.near;
        let far = camera.far;

        let lights: ILight[] = EntityCollect.instance.getLights(scene);
        let size = webGPUContext.presentationSize;
        // this.clustersUniformBuffer.setFloat('screenWidth', size[0] );
        // this.clustersUniformBuffer.setFloat('screenHeight', size[1] );
        this.clusterLightingBuffer.clustersUniformBuffer.setFloat('numLights', lights.length);
        this.clusterLightingBuffer.clustersUniformBuffer.apply();

        this._clusterGenerateCompute.workerSizeX = this.clusterTileZ;
        this._clusterLightingCompute.workerSizeX = this.clusterTileZ;

        let command = GPUContext.beginCommandEncoder();
        // if(!this._createGrid){
        //     this._createGrid = true ;
        GPUContext.computeCommand(command, [this._clusterGenerateCompute, this._clusterLightingCompute]);
        // }else{
        // GPUContext.compute_command(command,[this.clusterLightingCompute]);
        // }
        GPUContext.endCommandEncoder(command);
    }

    private _createGrid: boolean = false;

    private debug(view: View3D) {
    }
}
