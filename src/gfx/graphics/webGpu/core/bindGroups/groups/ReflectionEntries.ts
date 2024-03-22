

//TODO dynamic lights need fixed

import { GPUContext } from "../../../../../..";
import { Engine3D } from "../../../../../../Engine3D";
import { View3D } from "../../../../../../core/View3D";
import { RenderTexture } from "../../../../../../textures/RenderTexture";
import { EntityCollect } from "../../../../../renderJob/collect/EntityCollect";
import { GBufferFrame } from "../../../../../renderJob/frame/GBufferFrame";
import { GPUTextureFormat } from "../../../WebGPUConst";
import { StorageGPUBuffer } from "../../buffer/StorageGPUBuffer";
import { Texture } from "../../texture/Texture";

/**
 * @internal
 * @group GFX
 */
export class ReflectionEntries {
    public storageGPUBuffer: StorageGPUBuffer;
    public reflectionMap: Texture;

    public sourceReflectionMap: RenderTexture;
    count: number;
    constructor() {
        this.storageGPUBuffer = new StorageGPUBuffer((3 + 3) * 128);

        // let reflectionSetting = Engine3D.setting.reflectionSetting;
        // let reflectionsGBufferFrame = GBufferFrame.getGBufferFrame(GBufferFrame.reflections_GBuffer, reflectionSetting.reflectionMapWidth, reflectionSetting.reflectionMapHeight);
        // this.sourceReflectionMap = reflectionsGBufferFrame.getCompressGBufferTexture();
        // this.reflectionMap = new RenderTexture(this.sourceReflectionMap.width, this.sourceReflectionMap.height, this.sourceReflectionMap.format, false, undefined, 1, 0, true, false);
    }

    public update(view: View3D) {
        // let command = GPUContext.beginCommandEncoder();
        // GPUContext.copyTexture(command, this.sourceReflectionMap, this.reflectionMap);
        // GPUContext.endCommandEncoder(command);

        this.storageGPUBuffer.clean();
        let reflections = EntityCollect.instance.getReflections(view.scene);
        for (let i = 0; i < reflections.length; i++) {
            const reflection = reflections[i];
            reflection.gid = i;
            this.storageGPUBuffer.setFloat("gid", reflection.gid);
            this.storageGPUBuffer.setVector3("worldPosition", reflection.transform.worldPosition);
            this.storageGPUBuffer.setFloat("radius", reflection.radius);
            this.storageGPUBuffer.setVector3("bound", reflection.transform.worldPosition);
        }
        this.count = reflections.length;
        this.storageGPUBuffer.apply();
    }
}
