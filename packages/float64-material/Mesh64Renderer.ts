import { ClusterLightingBuffer, Color, Matrix4, MeshRenderer, RendererMask, RendererPassState, RendererType, UniformGPUBuffer, Vector3, View3D } from "@orillusion/core";
import {Float64MaterialTool} from './Float64MaterialTool';

export class Mesh64Renderer extends MeshRenderer {

    protected mVPMatrix_64: UniformGPUBuffer;

    constructor() {
        super();
        this.mVPMatrix_64 = new UniformGPUBuffer(96);
    }

    private cameraPos: Vector3 = new Vector3();
    private cameraPos_h: Vector3 = new Vector3();
    private cameraPos_l: Vector3 = new Vector3();
    private matrixMVP_RTE: Matrix4 = new Matrix4();
    public onUpdate(view: View3D) {
        let viewMat = view.camera.viewMatrix;
        let projMat = view.camera.projectionMatrix;

        this.cameraPos.copyFrom(view.camera.transform.worldPosition);

        let {highVector3,lowVector3} = Float64MaterialTool.SplitVector3(this.cameraPos)

        this.cameraPos_h = highVector3;
        this.cameraPos_l = lowVector3;
        
        this.mVPMatrix_64.setVector3('cameraPos_h', this.cameraPos_h);
        this.mVPMatrix_64.setFloat('retain0', .0);
        this.mVPMatrix_64.setVector3('cameraPos_l', this.cameraPos_l);
        this.mVPMatrix_64.setFloat('retain1', .0);

        let mv = Matrix4.help_matrix_0;
        mv.copyFrom(viewMat);
        mv.rawData[12] = 0;
        mv.rawData[13] = 0;
        mv.rawData[14] = 0;

        this.matrixMVP_RTE.multiplyMatrices(projMat, mv);
        this.mVPMatrix_64.setMatrix('matrixMVP_RTE', this.matrixMVP_RTE);
        this.mVPMatrix_64.apply();
    }

    public nodeUpdate(view: View3D, passType: RendererType, renderPassState: RendererPassState, clusterLightingBuffer: ClusterLightingBuffer) {
        for (let i = 0; i < this.materials.length; i++) {
            const material = this.materials[i];
            let passes = material.renderPasses.get(passType);
            if (passes) for (let i = 0; i < passes.length; i++) {
                const renderShader = passes[i].renderShader;
                if (!renderShader.pipeline) {
                    renderShader.setUniformBuffer('args', this.mVPMatrix_64);
                }
            }
        }
        super.nodeUpdate(view, passType, renderPassState, clusterLightingBuffer);
    }
}
