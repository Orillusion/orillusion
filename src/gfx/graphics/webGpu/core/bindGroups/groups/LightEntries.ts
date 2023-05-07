

//TODO dynamic lights need fixed

import { Engine3D } from "../../../../../../Engine3D";
import { LightData } from "../../../../../../components/lights/LightData";
import { View3D } from "../../../../../../core/View3D";
import { MemoryInfo } from "../../../../../../core/pool/memory/MemoryInfo";
import { IrradianceVolume } from "../../../../../data/IrradianceVolume";
import { EntityCollect } from "../../../../../renderJob/collect/EntityCollect";
import { StorageGPUBuffer } from "../../buffer/StorageGPUBuffer";

/**
 * @internal
 * @group GFX
 */
export class LightEntries {
    public storageGPUBuffer: StorageGPUBuffer;
    public irradianceVolume: IrradianceVolume;
    private _lightList: MemoryInfo[] = [];

    constructor() {
        this.storageGPUBuffer = new StorageGPUBuffer(
            LightData.lightSize * Engine3D.setting.light.maxLight,
            GPUBufferUsage.COPY_SRC
        );

        this.irradianceVolume = new IrradianceVolume();

        for (let i = 0; i < Engine3D.setting.light.maxLight; i++) {
            let memory = this.storageGPUBuffer.memory.allocation_node(LightData.lightSize * 4);
            this._lightList.push(memory);
        }
        this.storageGPUBuffer.visibility = GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT | GPUShaderStage.COMPUTE;
    }

    public update(view: View3D) {
        let lights = EntityCollect.instance.getLights(view.scene);
        for (let i = 0; i < lights.length; i++) {
            const light = lights[i].lightData;
            this.writeLightBytes(light, this._lightList[i]);
        }
        this.storageGPUBuffer.apply();
    }

    private writeLightBytes(light: LightData, memory: MemoryInfo) {
        memory.offset = 0;
        memory.writeFloat(light.index);
        memory.writeInt32(light.lightType);
        memory.writeFloat(light.radius);
        memory.writeFloat(light.linear);

        memory.writeVector3(light.lightPosition);
        memory.writeFloat(light.lightMatrixIndex);

        memory.writeVector3(light.direction);
        memory.writeFloat(light.quadratic);

        memory.writeRGBColor(light.lightColor);
        memory.writeFloat(light.intensity);

        memory.writeFloat(light.innerAngle);
        memory.writeFloat(light.outerAngle);
        memory.writeFloat(light.range);
        memory.writeInt32(light.castShadowIndex);

        memory.writeVector3(light.lightTangent);
        memory.writeFloat(light.iesIndex);
    }
}
