import ClusterBoundsSource_cs from '../../../../assets/shader/cluster/ClusterBoundsSource_cs.wgsl?raw';
import ClusterLighting_cs from '../../../../assets/shader/cluster/ClusterLighting_cs.wgsl?raw';

import { LightBase } from '../../../../components/lights/LightBase';
import { View3D } from '../../../../core/View3D';
import { GlobalBindGroup } from '../../../graphics/webGpu/core/bindGroups/GlobalBindGroup';
import { ComputeGPUBuffer } from '../../../graphics/webGpu/core/buffer/ComputeGPUBuffer';
import { UniformGPUBuffer } from '../../../graphics/webGpu/core/buffer/UniformGPUBuffer';
import { ComputeShader } from '../../../graphics/webGpu/shader/ComputeShader';
import { webGPUContext } from '../../../graphics/webGpu/Context3D';
import { EntityCollect } from '../../collect/EntityCollect';
import { GPUContext } from '../../GPUContext';
import { OcclusionSystem } from '../../occlusion/OcclusionSystem';
import { RendererBase } from '../RendererBase';
import { RendererType } from '../state/RendererType';
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
    public clusterBuffer: ComputeGPUBuffer;
    public lightAssignBuffer: ComputeGPUBuffer;
    public assignTableBuffer: ComputeGPUBuffer;
    public clustersUniformBuffer: UniformGPUBuffer;

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

        this.clusterBuffer = new ComputeGPUBuffer(numClusters * /*two vec4*/ 2 * /*vec4*/4);
        this.clustersUniformBuffer = new UniformGPUBuffer(10);
        this.clustersUniformBuffer.visibility = GPUShaderStage.FRAGMENT | GPUShaderStage.COMPUTE;

        this.clustersUniformBuffer.setFloat('clusterTileX', this.clusterTileX);
        this.clustersUniformBuffer.setFloat('clusterTileY', this.clusterTileY);
        this.clustersUniformBuffer.setFloat('clusterTileZ', this.clusterTileZ);
        this.clustersUniformBuffer.setFloat('numLights', this.maxNumLights);
        this.clustersUniformBuffer.setFloat('maxNumLightsPerCluster', this.maxNumLightsPerCluster);

        this.clustersUniformBuffer.setFloat('near', near);
        this.clustersUniformBuffer.setFloat('far', far);

        this.clustersUniformBuffer.setFloat('screenWidth', size[0]);
        this.clustersUniformBuffer.setFloat('screenHeight', size[1]);
        this.clustersUniformBuffer.setFloat('clusterPix', this.clusterPix);
        this.clustersUniformBuffer.apply();

        let standBindGroup = GlobalBindGroup.getCameraGroup(camera);
        this._clusterGenerateCompute.setUniformBuffer(`globalUniform`, standBindGroup.uniformGPUBuffer);
        this._clusterLightingCompute.setUniformBuffer(`globalUniform`, standBindGroup.uniformGPUBuffer);
        this._clusterGenerateCompute.setUniformBuffer(`clustersUniform`, this.clustersUniformBuffer);
        this._clusterGenerateCompute.setStorageBuffer(`clusterBuffer`, this.clusterBuffer);

        let lightBuffer = GlobalBindGroup.getLightEntries(view.scene);
        this.lightAssignBuffer = new ComputeGPUBuffer(numClusters * this.maxNumLightsPerCluster);
        this.lightAssignBuffer.visibility = GPUShaderStage.FRAGMENT | GPUShaderStage.COMPUTE;
        this.assignTableBuffer = new ComputeGPUBuffer(numClusters * 4); // it has start and count
        this.assignTableBuffer.visibility = GPUShaderStage.FRAGMENT | GPUShaderStage.COMPUTE;
        this._clusterLightingCompute.setStorageBuffer(`models`, GlobalBindGroup.modelMatrixBindGroup.matrixBufferDst);
        this._clusterLightingCompute.setUniformBuffer(`clustersUniform`, this.clustersUniformBuffer);
        this._clusterLightingCompute.setStorageBuffer(`clusterBuffer`, this.clusterBuffer);
        this._clusterLightingCompute.setStorageBuffer(`lightBuffer`, lightBuffer.storageGPUBuffer);
        this._clusterLightingCompute.setStorageBuffer(`lightAssignBuffer`, this.lightAssignBuffer);
        this._clusterLightingCompute.setStorageBuffer(`assignTable`, this.assignTableBuffer);

        this.debug(view);
    }

    render(view: View3D, occlusionSystem: OcclusionSystem) {
        let camera = view.camera;
        let scene = view.scene;
        let near = camera.near;
        let far = camera.far;

        let lights: LightBase[] = EntityCollect.instance.getLights(scene);
        let size = webGPUContext.presentationSize;
        // this.clustersUniformBuffer.setFloat('screenWidth', size[0] );
        // this.clustersUniformBuffer.setFloat('screenHeight', size[1] );
        this.clustersUniformBuffer.setFloat('numLights', lights.length);

        this.clustersUniformBuffer.apply();

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
