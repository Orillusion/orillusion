import { ComputeShader, GPUContext, textureCompress } from "../../..";
import { Texture } from "../../graphics/webGpu/core/texture/Texture";

export class TextureScaleCompute {

    public computeShader: ComputeShader;

    public setInputes(colorMap: Texture, inputs: Texture[], outputs: Texture[]) {
        this.computeShader = new ComputeShader(textureCompress(colorMap, inputs, outputs, 8, 8, 1));
        for (let i = 0; i < inputs.length; i++) {
            this.computeShader.setSamplerTexture(`source${i}Map`, inputs[i]);
        }
        for (let i = 0; i < outputs.length; i++) {
            this.computeShader.setStorageTexture(`dest${i}Map`, outputs[i]);
        }

        if (colorMap) {
            this.computeShader.setSamplerTexture(`colorMap`, colorMap);
        }

        this.computeShader.workerSizeX = outputs[0].width / 8;
        this.computeShader.workerSizeY = outputs[0].height / 8;
        this.computeShader.workerSizeZ = 1;
    }


}