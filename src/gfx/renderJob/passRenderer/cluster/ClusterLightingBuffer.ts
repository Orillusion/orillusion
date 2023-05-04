import { ComputeGPUBuffer } from "../../../graphics/webGpu/core/buffer/ComputeGPUBuffer";
import { UniformGPUBuffer } from "../../../graphics/webGpu/core/buffer/UniformGPUBuffer";

export class ClusterLightingBuffer {

    public clusterBuffer: ComputeGPUBuffer;
    public lightAssignBuffer: ComputeGPUBuffer;
    public assignTableBuffer: ComputeGPUBuffer;
    public clustersUniformBuffer: UniformGPUBuffer;

    constructor(numClusters: number, maxNumLightsPerCluster: number) {
        this.clusterBuffer = new ComputeGPUBuffer(numClusters * /*two vec4*/ 2 * /*vec4*/4);
        this.clustersUniformBuffer = new UniformGPUBuffer(10);
        this.clustersUniformBuffer.visibility = GPUShaderStage.FRAGMENT | GPUShaderStage.COMPUTE;

        this.lightAssignBuffer = new ComputeGPUBuffer(numClusters * maxNumLightsPerCluster);
        this.lightAssignBuffer.visibility = GPUShaderStage.FRAGMENT | GPUShaderStage.COMPUTE;
        this.assignTableBuffer = new ComputeGPUBuffer(numClusters * 4); // it has start and count
        this.assignTableBuffer.visibility = GPUShaderStage.FRAGMENT | GPUShaderStage.COMPUTE;
    }

    public update(width: number, height: number, clusterPix: number, clusterTileX: number, clusterTileY: number, clusterTileZ: number, maxNumLights: number, maxNumLightsPerCluster: number, near: number, far: number) {
        this.clustersUniformBuffer.setFloat('clusterTileX', clusterTileX);
        this.clustersUniformBuffer.setFloat('clusterTileY', clusterTileY);
        this.clustersUniformBuffer.setFloat('clusterTileZ', clusterTileZ);
        this.clustersUniformBuffer.setFloat('numLights', maxNumLights);
        this.clustersUniformBuffer.setFloat('maxNumLightsPerCluster', maxNumLightsPerCluster);

        this.clustersUniformBuffer.setFloat('near', near);
        this.clustersUniformBuffer.setFloat('far', far);

        this.clustersUniformBuffer.setFloat('screenWidth', width);
        this.clustersUniformBuffer.setFloat('screenHeight', height);
        this.clustersUniformBuffer.setFloat('clusterPix', clusterPix);
        this.clustersUniformBuffer.apply();
    }
}