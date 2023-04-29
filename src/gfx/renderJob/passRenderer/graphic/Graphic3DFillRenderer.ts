import { GPUPrimitiveTopology } from "../../../graphics/webGpu/WebGPUConst";
import { Graphic3DBatchRenderer } from "./Graphic3DBatchRenderer";

/**
 * @internal
 */
export class Graphic3DFillRenderer extends Graphic3DBatchRenderer {
    constructor() {
        super(3, GPUPrimitiveTopology.triangle_list);
    }
}
