import { Object3D } from "../../src/core/entities/Object3D";
import { Scene3D } from "../../src/core/Scene3D";
import { Engine3D } from "../../src/Engine3D";
import { BRDFLUTGenerate } from "../../src/gfx/generate/BrdfLUTGenerate";

export class Sample_computeStorageTexture {
    lightObj: Object3D;
    scene: Scene3D;
    mats: any[];
    // probeSampler: ProbesAtlasTextureSampler;

    constructor() { }

    async run() {
        //
        await Engine3D.init({});
        let brdf = new BRDFLUTGenerate();
        brdf.generateBRDFLUTTexture();
    }
}
