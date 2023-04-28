import { GPUBufferType } from './GPUBufferType';
import { UniformNode } from '../uniforms/UniformNode';
import { GPUBufferBase } from './GPUBufferBase';
/**
 * Real time Uniform GPUBuffer used by shaders
 * @group GFX
 */
export class MaterialDataUniformGPUBuffer extends GPUBufferBase {
    public uniformNodes: UniformNode[] = [];
    private _onChange: boolean = true;
    constructor() {
        super();
        this.bufferType = GPUBufferType.MaterialDataUniformGPUBuffer;
    }

    /**
     * Initialize bound shader base variables
     * The array of variables is automatically mapped through the parameters of the shader reflection
     * @param uniformNodes 
     * @see UniformNode
     */
    initDataUniform(uniformNodes: UniformNode[]) {
        this.uniformNodes = uniformNodes;
        let len = 0;
        for (const key in uniformNodes) {
            const node = uniformNodes[key];
            if (!node) {
                console.error(key, "is empty")
            };
            len += node.size * 4;
        }
        len = Math.floor(len / 256 + 1) * 256;

        this.createBuffer(GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST, len / 4);
        for (const key in uniformNodes) {
            const node = uniformNodes[key];
            if (!node) console.error(key, "is empty");

            let memoryInfo = this.memory.allocation_node(node.size * 4);
            node.memoryInfo = memoryInfo;
            node.bindOnChange = () => this.onChange();
        }
    }

    private onChange() {
        this._onChange = true;
    }

    /**
     * Reapply and write to buffer
     * @returns 
     */
    public apply() {
        if (this.uniformNodes.length == 0) return;
        // if (this.uniformNodes.length > 0 && this.uniformNodes[0].type == "IrradianceVolumeData") {
        //     if (this.uniformNodes[0].data["isVolumeFrameChange"]) {
        //         this._onChange = true;
        //     }
        // }
        if (!this._onChange) return;

        for (const key in this.uniformNodes) {
            const node = this.uniformNodes[key];
            node.update();
        }

        super.apply();
        this._onChange = false;
    }

}
