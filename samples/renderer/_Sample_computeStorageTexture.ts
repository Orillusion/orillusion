import { Object3D, Scene3D, Engine3D, BRDFLUTGenerate } from "@orillusion/core";

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
