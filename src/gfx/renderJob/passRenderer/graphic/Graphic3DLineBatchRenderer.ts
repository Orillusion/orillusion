import { GPUPrimitiveTopology } from "../../../graphics/webGpu/WebGPUConst";
import { Graphic3DBatchRenderer } from "./Graphic3DBatchRenderer";

/**
 * @internal
 */
export class Graphic3DLineBatchRenderer extends Graphic3DBatchRenderer {
    constructor() {
        super(2, GPUPrimitiveTopology.line_list);
    }
}
