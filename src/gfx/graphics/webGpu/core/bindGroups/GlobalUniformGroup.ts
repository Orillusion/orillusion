import { Engine3D } from "../../../../../Engine3D";
import { Camera3D } from "../../../../../core/Camera3D";
import { Matrix4 } from "../../../../../math/Matrix4";
import { UUID } from "../../../../../util/Global";
import { Time } from "../../../../../util/Time";
import { ShadowLightsCollect } from "../../../../renderJob/collect/ShadowLightsCollect";
import { webGPUContext } from "../../Context3D";
import { UniformGPUBuffer } from "../buffer/UniformGPUBuffer";
import { GlobalBindGroupLayout } from "./GlobalBindGroupLayout";
import { MatrixBindGroup } from "./MatrixBindGroup";


/**
 * @internal
 * @author sirxu
 * @group GFX
 */
export class GlobalUniformGroup {
    public uuid: string;
    public usage: number;
    public globalBindGroup: GPUBindGroup;
    public uniformGPUBuffer: UniformGPUBuffer;
    private matrixBindGroup: MatrixBindGroup;
    private uniformByteLength: number;
    private matrixesByteLength: number;

    /**
     * 
     * @param matrixBindGroup global matrix bindgroup 
     */
    constructor(matrixBindGroup: MatrixBindGroup) {
        this.uuid = UUID();
        this.usage = GPUBufferUsage.UNIFORM | GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST;
        this.uniformGPUBuffer = new UniformGPUBuffer(32 * 4 * 4 + (3 * 4 * 4) + 8 * 16);
        this.uniformGPUBuffer.visibility = GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT | GPUShaderStage.COMPUTE
        this.matrixBindGroup = matrixBindGroup;

        this.createBindGroup();
    }

    createBindGroup() {
        this.uniformByteLength = this.uniformGPUBuffer.memory.shareDataBuffer.byteLength;
        this.matrixesByteLength = Matrix4.blockBytes * Matrix4.maxCount;

        this.globalBindGroup = webGPUContext.device.createBindGroup({
            label: `global_bindGroupLayout`,
            layout: GlobalBindGroupLayout.getGlobalDataBindGroupLayout(),
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: this.uniformGPUBuffer.buffer,
                        offset: 0, // this.uniformGPUBuffer.memory.shareDataBuffer.byteOffset,
                        size: this.uniformByteLength,
                    },
                },
                {
                    binding: 1,
                    resource: {
                        buffer: this.matrixBindGroup.matrixBufferDst.buffer,
                        offset: 0,
                        size: this.matrixesByteLength,
                    },
                },
            ],
        });
    }

    // public check() {
    //     if (this.uniformByteLength != this.uniformGPUBuffer.memory.shareDataBuffer.byteLength
    //         || this.matrixesByteLength != Matrix4.blockBytes * Matrix4.totalCount) {
    //         this.createBindGroup();
    //     }
    // }

    public setCamera(camera: Camera3D) {
        camera.transform.updateWorldMatrix(true);
        this.uniformGPUBuffer.setMatrix(`_projectionMatrix`, camera.projectionMatrix);
        this.uniformGPUBuffer.setMatrix(`_viewMatrix`, camera.viewMatrix);
        this.uniformGPUBuffer.setMatrix(`_cameraWorldMatrix`, camera.transform.worldMatrix);
        this.uniformGPUBuffer.setMatrix(`_projectionMatrixInv`, camera.projectionMatrixInv);
        let raw = new Float32Array(8 * 16);
        for (let i = 0; i < 8; i++) {
            let shadowLightList = ShadowLightsCollect.getDirectShadowLightWhichScene(camera.transform.scene3D);
            if (i < shadowLightList.length) {
                let mat = shadowLightList[i].shadowCamera.pvMatrix.rawData;
                raw.set(mat, i * 16);
            } else {
                raw.set(camera.transform.worldMatrix.rawData, i * 16);
            }
        }
        this.uniformGPUBuffer.setFloat32Array(`_shadowCamera`, raw);
        this.uniformGPUBuffer.setVector3(`CameraPos`, camera.transform.worldPosition);

        this.uniformGPUBuffer.setFloat(`Time.frame`, Time.frame);
        this.uniformGPUBuffer.setFloat(`Time.time`, Time.frame);
        this.uniformGPUBuffer.setFloat(`Time.detail`, Time.delta);
        this.uniformGPUBuffer.setFloat(`EngineSetting.Shadow.shadowBias`, Engine3D.setting.shadow.shadowBias);
        this.uniformGPUBuffer.setFloat(`skyExposure`, Engine3D.setting.sky.skyExposure);
        this.uniformGPUBuffer.setFloat(`EngineSetting.Render.renderPassState`, Engine3D.setting.render.renderPassState);
        this.uniformGPUBuffer.setFloat(`EngineSetting.Render.quadScale`, Engine3D.setting.render.quadScale);
        this.uniformGPUBuffer.setFloat(`EngineSetting.Render.hdrExposure`, Engine3D.setting.render.hdrExposure);

        this.uniformGPUBuffer.setInt32(`renderState_left`, Engine3D.setting.render.renderState_left);
        this.uniformGPUBuffer.setInt32(`renderState_right`, Engine3D.setting.render.renderState_right);
        this.uniformGPUBuffer.setFloat(`renderState_split`, Engine3D.setting.render.renderState_split);

        let mouseX = Engine3D.inputSystem.mouseX * webGPUContext.pixelRatio * webGPUContext.super;
        let mouseY = Engine3D.inputSystem.mouseY * webGPUContext.pixelRatio * webGPUContext.super;
        this.uniformGPUBuffer.setFloat(`mouseX`, mouseX);
        this.uniformGPUBuffer.setFloat(`mouseY`, mouseY);
        this.uniformGPUBuffer.setFloat(`windowWidth`, webGPUContext.windowWidth);
        this.uniformGPUBuffer.setFloat(`windowHeight`, webGPUContext.windowHeight);
        this.uniformGPUBuffer.setFloat(`near`, camera.near);
        this.uniformGPUBuffer.setFloat(`far`, camera.far);

        this.uniformGPUBuffer.setFloat(`EngineSetting.Shadow.pointShadowBias`, Engine3D.setting.shadow.pointShadowBias);
        this.uniformGPUBuffer.setFloat(`shadowMapSize`, Engine3D.setting.shadow.shadowSize);
        this.uniformGPUBuffer.setFloat(`shadowSoft`, Engine3D.setting.shadow.shadowSoft);
        this.uniformGPUBuffer.apply();
    }

    setShadowCamera(camera: Camera3D) {
        camera.transform.updateWorldMatrix(true);
        this.uniformGPUBuffer.setMatrix(`_projectionMatrix`, camera.projectionMatrix);
        this.uniformGPUBuffer.setMatrix(`_viewMatrix`, camera.viewMatrix);
        this.uniformGPUBuffer.setMatrix(`_pvMatrix`, camera.pvMatrix);
        this.uniformGPUBuffer.apply();
    }

    public addUniformNode() { }


}
