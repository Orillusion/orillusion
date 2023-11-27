import { RenderNode } from "./RenderNode";
import { RegisterComponent } from '../../util/SerializeDecoration';
import { Color, ComputeShader, GPUContext, GlobalBindGroup, GraphicVoxelCompute, Material, MeshRenderer, StorageGPUBuffer, StructStorageGPUBuffer, VoxGeometry, View3D, VoxMaterial, Struct, BoxGeometry, VertexAttributeName } from "../..";

export class VoxelData {
    public sizeX: number;
    public sizeY: number;
    public sizeZ: number;
    public voxels: Uint8Array;
    public palatte: Color[];
}

export class VoxelInfo extends Struct {
    public sizeX: number = 0;
    public sizeY: number = 0;
    public sizeZ: number = 0;
    public count: number = 0;
}

/**
 * The voxel renderer component is a component used to render the voxel
 * @group Components
 */
@RegisterComponent(VoxRenderer, 'VoxRenderer')
export class VoxRenderer extends MeshRenderer {

    protected voxelBuffer: StorageGPUBuffer;
    protected palatteBuffer: StorageGPUBuffer;
    protected voxelInfo: StructStorageGPUBuffer<VoxelInfo>;
    protected drawBuffer: StorageGPUBuffer;

    private _voxelData: VoxelData;
    private _computeGeoShader: ComputeShader;
    private _needUpdate: boolean = false;

    constructor() {
        super();
    }

    public get voxelData(): VoxelData {
        return this._voxelData;
    }

    public set voxelData(value: VoxelData) {
        this._voxelData = value;
        this.buildVoxel();
    }

    public init(): void {
        super.init();
    }

    public start(): void {
        super.start();
        this._computeGeoShader.setStorageBuffer("vertexBuffer", this.geometry.vertexBuffer.vertexGPUBuffer);
        this._computeGeoShader.setStorageBuffer("voxelBuffer", this.voxelBuffer);
        this._computeGeoShader.setStorageBuffer("palatteBuffer", this.palatteBuffer);
        this._computeGeoShader.setStorageBuffer("voxelInfo", this.voxelInfo);
        this._computeGeoShader.setStorageBuffer("drawBuffer", this.drawBuffer);
        // this._computeGeoShader.setStorageBuffer("globalUniform", GlobalBindGroup.getCameraGroup(this.transform.scene3D.view.camera).uniformGPUBuffer);
    }

    protected buildVoxel() {
        this._computeGeoShader = new ComputeShader(GraphicVoxelCompute());

        this.voxelBuffer = new StorageGPUBuffer(this._voxelData.voxels.length); 
        let voxelBufferData = new Uint32Array(this._voxelData.voxels.length);
        for (let i = 0; i < this._voxelData.voxels.length; i++) {
            voxelBufferData[i] = this._voxelData.voxels[i];
        }
        this.voxelBuffer.setUint32Array("", voxelBufferData);
        this.voxelBuffer.apply();

        this.palatteBuffer = new StorageGPUBuffer(this._voxelData.palatte.length * 4);
        this.palatteBuffer.setColorArray("", this._voxelData.palatte)
        this.palatteBuffer.apply();

        let info = new VoxelInfo();
        info.sizeX = this._voxelData.sizeX;
        info.sizeY = this._voxelData.sizeY;
        info.sizeZ = this._voxelData.sizeZ;
        info.count = info.sizeX * info.sizeY * info.sizeZ;
        this.voxelInfo = new StructStorageGPUBuffer<VoxelInfo>(VoxelInfo, 1);
        this.voxelInfo.setStruct(VoxelInfo, 0, info);
        this.voxelInfo.apply();

        this.drawBuffer = new StorageGPUBuffer(4);

        if (!this.material) {
            let mat = new VoxMaterial();
            mat.palatte = this._voxelData.palatte;
            this.material = mat;
        }

        this.geometry = new VoxGeometry(info.count);

        this._needUpdate = true;
    }

    public onCompute(view: View3D, command: GPUCommandEncoder): void {
        if (this._needUpdate) {
            this._needUpdate = false;
            this._computeGeoShader.workerSizeX = 1;
            this._computeGeoShader.workerSizeY = 1;//Math.floor(this._voxelData.voxels.length / 256 + 1);
            this._computeGeoShader.workerSizeZ = 1;
            GPUContext.computeCommand(command, [this._computeGeoShader]);
        }
    }
}
