import { webGPUContext } from "../../Context3D";

export class GlobalBindGroupLayout {

    private static _globalDataBindGroupLayout: GPUBindGroupLayout;
    public static getGlobalDataBindGroupLayout(): GPUBindGroupLayout {
        if (this._globalDataBindGroupLayout) return this._globalDataBindGroupLayout;
        let entries: GPUBindGroupLayoutEntry[] = [];
        entries.push({
            binding: 0,
            visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT | GPUShaderStage.COMPUTE,
            buffer: {
                type: 'uniform',
            },
        });

        entries.push({
            binding: 1,
            visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT | GPUShaderStage.COMPUTE,
            buffer: {
                type: 'read-only-storage',
            },
        });

        this._globalDataBindGroupLayout = webGPUContext.device.createBindGroupLayout({ entries });
        return this._globalDataBindGroupLayout;
    }
}
