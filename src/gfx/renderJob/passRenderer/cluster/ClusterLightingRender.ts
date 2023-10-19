import { View3D } from '../../../../core/View3D';
import { GlobalBindGroup } from '../../../graphics/webGpu/core/bindGroups/GlobalBindGroup';
import { ComputeShader } from '../../../graphics/webGpu/shader/ComputeShader';
import { webGPUContext } from '../../../graphics/webGpu/Context3D';
import { EntityCollect } from '../../collect/EntityCollect';
import { GPUContext } from '../../GPUContext';
import { OcclusionSystem } from '../../occlusion/OcclusionSystem';
import { RendererBase } from '../RendererBase';
import { PassType } from '../state/RendererType';
import { ILight } from '../../../../components/lights/ILight';
import { ClusterLightingBuffer } from './ClusterLightingBuffer';
import { ClusterBoundsSource_cs } from '../../../../assets/shader/cluster/ClusterBoundsSource_cs';
import { ClusterLighting_cs } from '../../../../assets/shader/cluster/ClusterLighting_cs';
import { Camera3D, ClusterConfig, Color, Vector3, Vector4 } from '../../../..';
import { GUIHelp } from '@orillusion/debug/GUIHelp';
/**
 * @internal
 * @group Post
 */
export class ClusterLightingRender extends RendererBase {
    // public static clusterTileX = 4;
    // public static clusterTileY = 4;
    // public static clusterTileZ = 2;
    public maxNumLightsPerCluster = 64;
    public clusterPix = 1;
    public clusterLightingBuffer: ClusterLightingBuffer;

    private _currentLightCount = 0;
    private _clusterGenerateCompute: ComputeShader;
    private _clusterLightingCompute: ComputeShader;
    private _useCamera: Camera3D;
    private resize: boolean = false;
    constructor(view: View3D) {
        super();

        this.passType = PassType.Cluster;
        this.initCompute(view);
    }

    private initCompute(view: View3D) {
        this._clusterGenerateCompute = new ComputeShader(ClusterBoundsSource_cs);
        this._clusterLightingCompute = new ComputeShader(ClusterLighting_cs);

        let size = webGPUContext.presentationSize;
        let numClusters = ClusterConfig.clusterTileX * ClusterConfig.clusterTileY * ClusterConfig.clusterTileZ;

        let camera = view.camera;
        let near = camera.near;
        let far = camera.far;

        this.clusterLightingBuffer = new ClusterLightingBuffer(numClusters, this.maxNumLightsPerCluster);
        this.clusterLightingBuffer.update(size[0], size[1], this.clusterPix, ClusterConfig.clusterTileX, ClusterConfig.clusterTileY, ClusterConfig.clusterTileZ, 0, this.maxNumLightsPerCluster, near, far);

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

        this.resize = true;

        // GUIHelp.addButton("clusterBuffer", () => {
        //     let od = this.clusterLightingBuffer.clusterBuffer.readBuffer();
        //     console.log(od);
        //     let byteLength = 2 * 4;
        //     for (let i = 0; i < numClusters; i++) {
        //         const element = new Float32Array(od.buffer, i * byteLength * 4, byteLength);
        //         let p0 = new Vector3(element[0], element[1], element[2], element[3]);
        //         let p1 = new Vector3(element[4], element[5], element[6], element[7]);
        //         view.graphic3D.drawBox(i + "-box", p0, p1, Color.random());
        //     }
        // });

        // GUIHelp.addButton("assignTable", () => {
        //     let od = this.clusterLightingBuffer.assignTableBuffer.readBuffer();
        //     for (let i = 0; i < od.length / 4; i++) {
        //         const count = od[i * 4 + 0];
        //         const start = od[i * 4 + 1];
        //         const e1 = od[i * 4 + 2];
        //         const e2 = od[i * 4 + 3];
        //         if (count >= 1) {
        //             console.log(count);
        //         }

        //         if ((start + count) > start + 1) {
        //             console.log(count, start, e1, e2);
        //         }
        //     }
        //     console.log(od);
        // });

        // GUIHelp.addButton("clustersUniformBuffer", () => {
        //     let od = this.clusterLightingBuffer.clustersUniformBuffer.readBuffer();
        //     console.log(od);
        // });
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

            this._clusterGenerateCompute.workerSizeX = ClusterConfig.clusterTileZ;
            this._clusterLightingCompute.workerSizeX = ClusterConfig.clusterTileZ;
        }

        let size = webGPUContext.presentationSize;
        this.clusterLightingBuffer.update(
            size[0], size[1],
            this.clusterPix, ClusterConfig.clusterTileX, ClusterConfig.clusterTileY, ClusterConfig.clusterTileZ, lights.length, this.maxNumLightsPerCluster,
            view.camera.near,
            view.camera.far);

        // if (this.resize) {
        this.resize = false;
        let command = GPUContext.beginCommandEncoder();
        GPUContext.computeCommand(command, [this._clusterGenerateCompute, this._clusterLightingCompute]);
        GPUContext.endCommandEncoder(command);
        // } else {
        //     let command = GPUContext.beginCommandEncoder();
        //     GPUContext.computeCommand(command, [this._clusterLightingCompute]);
        //     GPUContext.endCommandEncoder(command);
        // }
    }
}


// let p0 = new Vector3(element[0], element[1], element[2], element[3]);
//                 let p1 = new Vector3(element[4], element[5], element[6], element[7]);
//                 let p2 = new Vector3(element[8], element[9], element[10], element[11]);
//                 let p3 = new Vector3(element[12], element[13], element[14], element[15]);
//                 let p4 = new Vector3(element[16], element[17], element[18], element[19]);
//                 let p5 = new Vector3(element[20], element[21], element[22], element[23]);
//                 let p6 = new Vector3(element[24], element[25], element[26], element[27]);
//                 let p7 = new Vector3(element[28], element[29], element[30], element[31]);
//                 view.graphic3D.drawLines(i + "-box", [
//                     p0, p1,
//                     p0, p2,
//                     p0, p4,

//                     p6, p2,
//                     p6, p7,
//                     p6, p4,

//                     p5, p1,
//                     p5, p7,
//                     p5, p4,

//                     p3, p1,
//                     p3, p2,
//                     p3, p7,

//                 ], Color.random());