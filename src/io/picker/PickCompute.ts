import { Picker_cs } from '../../assets/shader/compute/Picker_cs';
import { Camera3D } from '../../core/Camera3D';
import { View3D } from '../../core/View3D';
import { GlobalBindGroup } from '../../gfx/graphics/webGpu/core/bindGroups/GlobalBindGroup';
import { ComputeGPUBuffer } from '../../gfx/graphics/webGpu/core/buffer/ComputeGPUBuffer';
import { ComputeShader } from '../../gfx/graphics/webGpu/shader/ComputeShader';
import { GPUContext } from '../../gfx/renderJob/GPUContext';
import { GBufferFrame } from '../../gfx/renderJob/frame/GBufferFrame';
import { Vector2 } from '../../math/Vector2';
import { Vector3 } from '../../math/Vector3';
/**
 * @internal
 * @group IO
 */
export class PickCompute {
    private _computeShader: ComputeShader;
    private _outBuffer: ComputeGPUBuffer;
    constructor() { }

    public init() {
        let rtFrame = GBufferFrame.getGBufferFrame("ColorPassGBuffer");
        this._computeShader = new ComputeShader(Picker_cs);

        this._outBuffer = new ComputeGPUBuffer(32);
        this._computeShader.setStorageBuffer('outBuffer', this._outBuffer);
        this._computeShader.setSamplerTexture('visibleMap', rtFrame.getPositionMap());
    }

    compute(view: View3D) {
        let stand = GlobalBindGroup.getCameraGroup(view.camera);
        this._computeShader.setStorageBuffer('standUniform', stand.uniformGPUBuffer);

        let command = GPUContext.beginCommandEncoder();
        GPUContext.computeCommand(command, [this._computeShader]);
        GPUContext.endCommandEncoder(command);
        this._outBuffer.readBuffer();
    }

    /**
     * Returns matrix id belongs to this model
     * @returns
     */
    public getPickMeshID(): number {
        var meshID = this._outBuffer.outFloat32Array[0] + 0.1;
        return Math.floor(meshID);
    }

    /**
     * Returns world position of pick result
     * @returns
     */
    public getPickWorldPosition(target?: Vector3): Vector3 {
        target ||= new Vector3();
        var x = this._outBuffer.outFloat32Array[4];
        var y = this._outBuffer.outFloat32Array[5];
        var z = this._outBuffer.outFloat32Array[6];
        target.set(x, y, z);
        return target;
    }

    /**
     * Returns screen coord of mouse
     * @returns
     */
    public getPickScreenUV(target?: Vector2): Vector2 {
        target ||= new Vector2();
        var x = this._outBuffer.outFloat32Array[2];
        var y = this._outBuffer.outFloat32Array[3];
        target.set(x, y);
        return target;
    }
}
