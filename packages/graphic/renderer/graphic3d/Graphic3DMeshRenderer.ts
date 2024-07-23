import { MeshRenderer, StorageGPUBuffer, GeometryBase, BitmapTexture2DArray, Object3D, ComputeShader, UnLitTexArrayMaterial, Vector3, Color, Vector4, GeometryUtil, View3D, GPUContext } from "@orillusion/core";

export class Graphic3DMeshRenderer extends MeshRenderer {
    public transformBuffer: StorageGPUBuffer;
    public sourceGeometry: GeometryBase;
    public texture: BitmapTexture2DArray;
    public object3Ds: Object3D[];

    private _onChange: boolean = false;
    private _computeShader: ComputeShader;

    public init(): void {
        super.init();
    }

    public create(source: GeometryBase, tex: BitmapTexture2DArray, num: number) {
        let mat = new UnLitTexArrayMaterial();
        mat.baseMap = tex;
        this.material = mat;

        this.transformBuffer = new StorageGPUBuffer(num * (8 * 4), 0);
        this.material.setStorageBuffer("graphicBuffer", this.transformBuffer);

        let vec3Zero: Vector3 = new Vector3(0, 0, 0);
        this.object3Ds = [];
        for (let i = 0; i < num; i++) {
            const element = new Object3D();
            this.object3Ds.push(element);
            this.object3D.addChild(element);

            this.transformBuffer.setFloat("matrix_" + i, element.transform.worldMatrix.index);
            this.transformBuffer.setFloat("texId_" + i, 1);
            this.transformBuffer.setFloat("texId2_" + i, 1);
            this.transformBuffer.setFloat("texId3_" + i, 1);
            this.transformBuffer.setFloat("texId3_" + i, 1);
            this.transformBuffer.setFloat("fillRotation_" + i, 0);
            this.transformBuffer.setVector3("empty_" + i, vec3Zero);

            this.transformBuffer.setColor("baseColor_" + i, new Color());
            this.transformBuffer.setColor("lineColor_" + i, new Color());
            this.transformBuffer.setColor("emissiveColor_" + i, new Color(0, 0, 0, 0));
            this.transformBuffer.setVector4("uvRect_" + i, new Vector4(0, 0, 1, 1));
            this.transformBuffer.setVector4("uvRect2_" + i, new Vector4(0, 0, 1, 1));
            this.transformBuffer.setVector4("uvSpeed_" + i, new Vector4(0, 0, 0, 0));
        }

        this.transformBuffer.apply();
        this.geometry = GeometryUtil.mergeNumber(source, num);
    }

    public startSpark() {

    }

    public setTextureID(i: number, id: number) {
        this.transformBuffer.setFloat("texId_" + i, id);
        this._onChange = true;
    }

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

    public onUpdate(view?: View3D) {
        if (this._onChange) {
            this._onChange = false;
            this.transformBuffer.apply();
        }
    }

    private computeTrail(view: View3D, command: GPUCommandEncoder) {
        GPUContext.computeCommand(command, [this._computeShader]);
    }

}