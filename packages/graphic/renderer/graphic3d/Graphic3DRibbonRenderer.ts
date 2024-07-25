import { BitmapTexture2DArray, Color, ComputeShader, GeometryBase, GeometryUtil, GlobalBindGroup, GPUContext, MeshRenderer, Object3D, StorageGPUBuffer, Struct, StructStorageGPUBuffer, TrailGeometry, UnLitTexArrayMaterial, Vector2, Vector4, View3D } from "@orillusion/core";
import { graphicTrailCompute } from '../../compute/graphic3d/GraphicTrailCompute'

export enum FaceMode {
    FaceToCamera,
    FaceToPath,
    FaceToUp
}

export class RibbonStruct extends Struct {
    public index: number = 1;
    public segment: number = 5;
    public visible: number = 1;
    public width: number = 0.25;
    public uv: Vector4 = new Vector4(0, 0, 1, 30);
    public uvSpeed: Vector2 = new Vector2(0, 2.1);
    public smooth: number = 0;
    public faceMode: number = FaceMode.FaceToCamera;
    public up: Vector4 = new Vector4(0, 1, 0);
    public ids: Float32Array = new Float32Array(Graphic3DRibbonRenderer.maxRibbonSegment);
    public ribbonPoint: Object3D[] = [];
}

export class Graphic3DRibbonRenderer extends MeshRenderer {
    public static maxRibbonSegment: number = 256;
    public transformBuffer: StorageGPUBuffer;
    public sourceGeometry: GeometryBase;
    public texture: BitmapTexture2DArray;
    public object3Ds: Object3D[];
    // public ribbon3Ds: Object3D[][];
    public ribbons: RibbonStruct[];
    public ribbonCount: number = 10;

    private _onChange: boolean = false;
    private _computeShader: ComputeShader;
    private _ribbonBuffer: StructStorageGPUBuffer<RibbonStruct>;
    ribbonSegment: number;
    public init(): void {
        super.init();
    }

    public create(ribbonSegment: number, tex: BitmapTexture2DArray, num: number) {
        this.ribbons = [];
        this.ribbonSegment = ribbonSegment;
        for (let i = 0; i < num; i++) {
            this.ribbons[i] = new RibbonStruct();
            this.ribbons[i].index = i;
            this.ribbons[i].segment = ribbonSegment;
            this.ribbons[i].width = 0.5;
            this.ribbons[i].faceMode = FaceMode.FaceToCamera;
        }

        let geo = new TrailGeometry(ribbonSegment)
        let mat = new UnLitTexArrayMaterial();
        mat.baseMap = tex;
        this.material = mat;

        this.transformBuffer = new StorageGPUBuffer(num * (7 * 4), 0);
        this.material.setStorageBuffer("graphicBuffer", this.transformBuffer);

        this.object3Ds = [];
        for (let i = 0; i < num; i++) {
            const element = new Object3D();
            this.object3Ds.push(element);
            this.object3D.addChild(element);

            this.transformBuffer.setFloat("matrix_" + i, element.transform.worldMatrix.index);
            this.transformBuffer.setFloat("texId_" + i, 1);
            this.transformBuffer.setFloat("texId2_" + i, 1);
            this.transformBuffer.setFloat("texId3_" + i, 1);
            this.transformBuffer.setColor("baseColor_" + i, new Color());
            this.transformBuffer.setColor("lineColor_" + i, new Color());
            this.transformBuffer.setColor("emissiveColor_" + i, new Color(0, 0, 0, 0));
            this.transformBuffer.setVector4("uvRect_" + i, new Vector4(0, 0, 1, 1));
            this.transformBuffer.setVector4("uvRect2_" + i, new Vector4(0, 0, 1, 1));
            this.transformBuffer.setVector4("uvSpeed_" + i, new Vector4(0, 0, 0, 0));
        }

        this.transformBuffer.apply();
        this.geometry = GeometryUtil.mergeNumber(geo, num);
    }

    public startRibbon(texture: BitmapTexture2DArray, ribonSegment: number, count: number) {
        this.ribbonCount = count;

        this.create(ribonSegment, texture, count);

        this._computeShader = new ComputeShader(graphicTrailCompute(Graphic3DRibbonRenderer.maxRibbonSegment));
        this._ribbonBuffer = new StructStorageGPUBuffer(RibbonStruct, count);

        for (let i = 0; i < count; i++) {
            this.ribbons[i].ribbonPoint = [];
            for (let j = 0; j < Graphic3DRibbonRenderer.maxRibbonSegment; j++) {
                const element = new Object3D();
                this.object3D.addChild(element);
                this.ribbons[i].ribbonPoint[j] = element;
                this.ribbons[i].ids[j] = element.transform.worldMatrix.index;
            }
        }

        this._ribbonBuffer.setStructArray(RibbonStruct, this.ribbons);
        this._ribbonBuffer.apply();

        this.start = () => {
            this._computeShader.setStorageBuffer("vertexBuffer", this.geometry.vertexBuffer.vertexGPUBuffer);
            this._computeShader.setStorageBuffer("trailBuffer", this._ribbonBuffer);
            this._computeShader.setStorageBuffer("models", GlobalBindGroup.modelMatrixBindGroup.matrixBufferDst);
            this._computeShader.setStorageBuffer("globalUniform", GlobalBindGroup.getCameraGroup(this.transform.scene3D.view.camera).uniformGPUBuffer);
        }

        this.onCompute = (view: View3D, command: GPUCommandEncoder) => this.computeTrail(view, command);
    }

    public setTextureID(i: number, id: number) {
        this.transformBuffer.setFloat("texId_" + i, id);
        this._onChange = true;
    }

    // public setTexture2ID(i: number, id: number) {
    //     this.transformBuffer.setFloat("texId_" + i, id);
    //     this._onChange = true;
    // }

    // public setTexture3ID(i: number, id: number) {
    //     this.transformBuffer.setFloat("texId_" + i, id);
    //     this._onChange = true;
    // }

    public setBaseColor(i: number, color: Color) {
        this.transformBuffer.setColor("baseColor_" + i, color);
        this._onChange = true;
    }

    public setEmissiveColor(i: number, color: Color) {
        this.transformBuffer.setColor("emissiveColor_" + i, color);
        this._onChange = true;
    }

    public setUVRect(i: number, v: Vector4) {
        this.transformBuffer.setVector4("uvRect_" + i, v);
        this._onChange = true;
    }

    public setLineUVRect(i: number, v: Vector4) {
        this.transformBuffer.setVector4("uvRect1_" + i, v);
        this._onChange = true;
    }

    public onUpdate(view?: View3D) {
        if (this._onChange) {
            this._onChange = false;
            this.transformBuffer.apply();
        }
    }

    private computeTrail(view: View3D, command: GPUCommandEncoder) {
        this._computeShader.workerSizeX = this.ribbonCount;
        this._computeShader.workerSizeY = 1;// Math.floor(this.ribbonSegment / Graphic3DRibbonRenderer.maxRibbonSegment);
        // this._computeShader.workerSizeX = 1;
        GPUContext.computeCommand(command, [this._computeShader]);
    }

}