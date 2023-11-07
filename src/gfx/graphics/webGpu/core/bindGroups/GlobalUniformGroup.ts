import { Engine3D } from "../../../../../Engine3D";
import { Camera3D } from "../../../../../core/Camera3D";
import { CSM } from "../../../../../core/csm/CSM";
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

    private shadowMatrixRaw = new Float32Array(8 * 16);
    private csmMatrixRaw = new Float32Array(CSM.Cascades * 16);
    private csmShadowBias = new Float32Array(4);

    public shadowLights = new Float32Array(16);
    public dirShadowStart = 0;
    public dirShadowEnd = 0;
    public pointShadowStart = 0;
    public pointShadowEnd = 0;

    /**
     * 
     * @param matrixBindGroup global matrix bindgroup 
     */
    constructor(matrixBindGroup: MatrixBindGroup) {
        this.uuid = UUID();
        this.usage = GPUBufferUsage.UNIFORM | GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST;
        // ... + 8(shadow matrix) + 8(csm matrix) + 4(csm bias) + 4(csm scattering exp...)
        this.uniformGPUBuffer = new UniformGPUBuffer(32 * 4 * 4 + (3 * 4 * 4) + 8 * 16 + CSM.Cascades * 16 + 4 + 4);
        this.uniformGPUBuffer.visibility = GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT | GPUShaderStage.COMPUTE;

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



    public setCamera(camera: Camera3D) {
        this.uniformGPUBuffer.setMatrix(`_projectionMatrix`, camera.projectionMatrix);
        this.uniformGPUBuffer.setMatrix(`_viewMatrix`, camera.viewMatrix);
        this.uniformGPUBuffer.setMatrix(`_cameraWorldMatrix`, camera.transform.worldMatrix);
        this.uniformGPUBuffer.setMatrix(`pvMatrixInv`, camera.projectionMatrixInv);

        let shadowLightList = ShadowLightsCollect.getDirectShadowLightWhichScene(camera.transform.scene3D);

        this.csmShadowBias.fill(0.0001);
        this.shadowMatrixRaw.fill(0);
        this.csmMatrixRaw.fill(0);
        for (let i = 0; i < 8; i++) {
            if (i < shadowLightList.length) {
                let shadowCamera = shadowLightList[i].shadowCamera;
                this.shadowMatrixRaw.set(shadowCamera.pvMatrix.rawData, i * 16);
            } else {
                this.shadowMatrixRaw.set(camera.transform.worldMatrix.rawData, i * 16);
            }
        }
        this.uniformGPUBuffer.setFloat32Array(`shadowMatrix`, this.shadowMatrixRaw);

        let shadowMapSize = Engine3D.setting.shadow.shadowSize;
        if (CSM.Cascades > 1 && camera.enableCSM && shadowLightList[0]) {
            for (let i = 0; i < CSM.Cascades; i++) {
                let shadowCamera: Camera3D = camera.csm.children[i].shadowCamera;
                this.csmMatrixRaw.set(shadowCamera.pvMatrix.rawData, i * 16);
                this.csmShadowBias[i] = camera.getCSMShadowBias(i, shadowMapSize);
            }
        }
        this.uniformGPUBuffer.setFloat32Array(`csmShadowBias`, this.csmShadowBias);
        this.uniformGPUBuffer.setFloat32Array(`csmMatrix`, this.csmMatrixRaw);
        this.uniformGPUBuffer.setFloat32Array(`shadowLights`, this.shadowLights);

        this.uniformGPUBuffer.setVector3(`CameraPos`, camera.transform.worldPosition);
        this.uniformGPUBuffer.setFloat(`frame`, Time.frame);
        this.uniformGPUBuffer.setFloat(`time`, Time.frame);
        this.uniformGPUBuffer.setFloat(`delta`, Time.delta);
        // this.uniformGPUBuffer.setFloat(`shadowBias`, Engine3D.setting.shadow.shadowBias);
        this.uniformGPUBuffer.setFloat(`shadowBias`, camera.getShadowBias(shadowMapSize));
        this.uniformGPUBuffer.setFloat(`skyExposure`, Engine3D.setting.sky.skyExposure);
        this.uniformGPUBuffer.setFloat(`renderPassState`, Engine3D.setting.render.renderPassState);
        this.uniformGPUBuffer.setFloat(`quadScale`, Engine3D.setting.render.quadScale);
        this.uniformGPUBuffer.setFloat(`hdrExposure`, Engine3D.setting.render.hdrExposure);
        this.uniformGPUBuffer.setInt32(`renderState_left`, Engine3D.setting.render.renderState_left);
        this.uniformGPUBuffer.setInt32(`renderState_right`, Engine3D.setting.render.renderState_right);
        this.uniformGPUBuffer.setFloat(`renderState_split`, Engine3D.setting.render.renderState_split);
        let mouseX = Engine3D.inputSystem.mouseX * webGPUContext.pixelRatio;
        let mouseY = Engine3D.inputSystem.mouseY * webGPUContext.pixelRatio;
        this.uniformGPUBuffer.setFloat(`mouseX`, mouseX);
        this.uniformGPUBuffer.setFloat(`mouseY`, mouseY);
        this.uniformGPUBuffer.setFloat(`windowWidth`, webGPUContext.windowWidth);
        this.uniformGPUBuffer.setFloat(`windowHeight`, webGPUContext.windowHeight);
        this.uniformGPUBuffer.setFloat(`near`, camera.near);
        this.uniformGPUBuffer.setFloat(`far`, camera.far);
        this.uniformGPUBuffer.setFloat(`pointShadowBias`, Engine3D.setting.shadow.pointShadowBias);
        this.uniformGPUBuffer.setFloat(`shadowMapSize`, shadowMapSize);
        this.uniformGPUBuffer.setFloat(`shadowSoft`, Engine3D.setting.shadow.shadowSoft);
        this.uniformGPUBuffer.setFloat(`enableCSM`, camera.enableCSM ? 1 : 0);
        this.uniformGPUBuffer.setFloat(`csmMargin`, Engine3D.setting.shadow.csmMargin);
        this.uniformGPUBuffer.setInt32(`nDirShadowStart`, this.dirShadowStart);
        this.uniformGPUBuffer.setInt32(`nDirShadowEnd`, this.dirShadowEnd);
        this.uniformGPUBuffer.setInt32(`nPointShadowStart`, this.pointShadowStart);
        this.uniformGPUBuffer.setInt32(`nPointShadowEnd`, this.pointShadowEnd);
        this.uniformGPUBuffer.apply();
    }

    setShadowCamera(camera: Camera3D) {
        // camera.transform.updateWorldMatrix(true);
        this.uniformGPUBuffer.setMatrix(`_projectionMatrix`, camera.projectionMatrix);
        this.uniformGPUBuffer.setMatrix(`_viewMatrix`, camera.viewMatrix);
        this.uniformGPUBuffer.setMatrix(`_pvMatrix`, camera.pvMatrix);
        this.uniformGPUBuffer.setMatrix(`pvMatrixInv`, camera.projectionMatrixInv);
        this.csmShadowBias.fill(0.0001);
        this.shadowMatrixRaw.fill(0);
        this.csmMatrixRaw.fill(0);
        this.uniformGPUBuffer.setFloat32Array(`shadowCamera`, this.shadowMatrixRaw);
        this.uniformGPUBuffer.setFloat32Array(`csmShadowBias`, this.csmShadowBias);
        this.uniformGPUBuffer.setFloat32Array(`csmMatrix`, this.csmMatrixRaw);
        this.uniformGPUBuffer.setFloat32Array(`shadowLights`, this.shadowLights);

        this.uniformGPUBuffer.setVector3(`CameraPos`, camera.transform.worldPosition);

        this.uniformGPUBuffer.setFloat(`frame`, Time.frame);
        this.uniformGPUBuffer.setFloat(`time`, Time.frame);
        this.uniformGPUBuffer.setFloat(`delta`, Time.delta);
        this.uniformGPUBuffer.setFloat(`shadowBias`, Engine3D.setting.shadow.shadowBias);
        this.uniformGPUBuffer.setFloat(`skyExposure`, Engine3D.setting.sky.skyExposure);
        this.uniformGPUBuffer.setFloat(`renderPassState`, Engine3D.setting.render.renderPassState);
        this.uniformGPUBuffer.setFloat(`quadScale`, Engine3D.setting.render.quadScale);
        this.uniformGPUBuffer.setFloat(`hdrExposure`, Engine3D.setting.render.hdrExposure);

        this.uniformGPUBuffer.setInt32(`renderState_left`, Engine3D.setting.render.renderState_left);
        this.uniformGPUBuffer.setInt32(`renderState_right`, Engine3D.setting.render.renderState_right);
        this.uniformGPUBuffer.setFloat(`renderState_split`, Engine3D.setting.render.renderState_split);

        let mouseX = Engine3D.inputSystem.mouseX * webGPUContext.pixelRatio;
        let mouseY = Engine3D.inputSystem.mouseY * webGPUContext.pixelRatio;
        this.uniformGPUBuffer.setFloat(`mouseX`, mouseX);
        this.uniformGPUBuffer.setFloat(`mouseY`, mouseY);
        this.uniformGPUBuffer.setFloat(`windowWidth`, webGPUContext.windowWidth);
        this.uniformGPUBuffer.setFloat(`windowHeight`, webGPUContext.windowHeight);
        this.uniformGPUBuffer.setFloat(`near`, camera.near);
        this.uniformGPUBuffer.setFloat(`far`, camera.far);

        this.uniformGPUBuffer.setFloat(`pointShadowBias`, Engine3D.setting.shadow.pointShadowBias);
        this.uniformGPUBuffer.setFloat(`shadowMapSize`, Engine3D.setting.shadow.shadowSize);
        this.uniformGPUBuffer.setFloat(`shadowSoft`, Engine3D.setting.shadow.shadowSoft);
        this.uniformGPUBuffer.setFloat(`enableCSM`, 0);

        this.uniformGPUBuffer.setFloat(`csmMargin`, Engine3D.setting.shadow.csmMargin);
        this.uniformGPUBuffer.setInt32(`nDirShadowStart`, this.dirShadowStart);
        this.uniformGPUBuffer.setInt32(`nDirShadowEnd`, this.dirShadowEnd);
        this.uniformGPUBuffer.setInt32(`nPointShadowStart`, this.pointShadowStart);
        this.uniformGPUBuffer.setInt32(`nPointShadowEnd`, this.pointShadowEnd);

        this.uniformGPUBuffer.apply();
    }

    public setShadowLight() { }


}
