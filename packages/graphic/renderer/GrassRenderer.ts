
import { ComputeShader } from "@orillusion/core";
import { graphicDynamicCompute } from "../compute/graphic3d/GraphicDynamicCompute";
import { GrassGeometryCompute_cs } from "../compute/grass/GrassGeometryCompute_cs";
import { DynamicDrawStruct } from "./graphic3d/DynamicDrawStruct";
import { DynamicFaceRenderer } from "./graphic3d/DynamicFaceRenderer";

export class GrassNodeStruct extends DynamicDrawStruct {
    grassCount: number = 1;
    grassHSegment: number = 1;
    grassWight: number = 2;
    grassHeigh: number = 4;
    grassX: number = 0;
    grassY: number = 0;
    grassZ: number = 0;
    grassRotation: number = 0;
}

export class GrassRenderer extends DynamicFaceRenderer {
    grassGeometryCompute: ComputeShader;

    constructor() {
        super();
    }

    public init(param?: any): void {
        super.init(param);
    }

    protected createComputeKernel(): void {
        console.log("createComputeKernel");


        this.grassGeometryCompute = new ComputeShader(graphicDynamicCompute(GrassGeometryCompute_cs));
        this.grassGeometryCompute.workerSizeX = Math.floor(this.maxNodeCount / 256) + 1;
        // this._onStartKernel.push(this.grassGeometryCompute);
        this._onFrameKernelGroup.push(this.grassGeometryCompute);
    }
}