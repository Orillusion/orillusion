// import { graphicTrailCompute } from "../../../../../assets/shader/graphic/GraphicTrailCompute";
// import { MeshRenderer } from "../../../../../components/renderer/MeshRenderer";
// import { View3D } from "../../../../../core/View3D";
// import { Object3D } from "../../../../../core/entities/Object3D";
// import { GeometryBase } from "../../../../../core/geometry/GeometryBase";
// import { UnLitTexArrayMaterial } from "../../../../../materials/UnLitTexArrayMaterial";
// import { Color } from "../../../../../math/Color";
// import { Vector2 } from "../../../../../math/Vector2";
// import { Vector4 } from "../../../../../math/Vector4";
// import { TrailGeometry } from "../../../../../shape/TrailGeometry";
// import { BitmapTexture2DArray } from "../../../../../textures/BitmapTexture2DArray";
// import { GeometryUtil } from "../../../../../util/GeometryUtil";
// import { Struct } from "../../../../../util/struct/Struct";
// import { GlobalBindGroup } from "../../../../graphics/webGpu/core/bindGroups/GlobalBindGroup";
// import { StorageGPUBuffer } from "../../../../graphics/webGpu/core/buffer/StorageGPUBuffer";
// import { ComputeShader } from "../../../../graphics/webGpu/shader/ComputeShader";
// import { GPUContext } from "../../../GPUContext";

// export class Ribbon extends Struct {
//     index: number = 1;
//     segment: number = 1;
//     visible: number = 1;
//     width: number = 1;
//     uv: Vector4 = new Vector4(0, 0, 1, 1);
//     uvSpeed: Vector2 = new Vector2(0, 0);
//     smooth: number = 0;
//     useBillboard: number = 0;

//     ids: Float32Array = new Float32Array(1024);
// }

// export class Graphic3DRibbonRenderer extends MeshRenderer {
//     public transformBuffer: StorageGPUBuffer;
//     public sourceGeometry: GeometryBase;
//     public texture: BitmapTexture2DArray;
//     public object3Ds: Object3D[];
//     public ribbon3Ds: Object3D[][];
//     public ribbons: Ribbon[];
//     public width: number = 1;
//     public ribbonCount: number = 10;
//     public uSegment: number = 1;
//     public vSegment: number = 1;
//     private _onChange: boolean = false;
//     private _computeShader: ComputeShader;
//     private _ribbonBuffer: StorageGPUBuffer;
//     public init(): void {
//         super.init();
//     }

//     public create(source: GeometryBase, tex: BitmapTexture2DArray, num: number) {
//         this.ribbons = [];
//         for (let i = 0; i < this.ribbons.length; i++) {
//             this.ribbons[i] = new Ribbon();
//         }

//         let mat = new UnLitTexArrayMaterial();
//         mat.baseMap = tex;
//         this.material = mat;

//         this.transformBuffer = new StorageGPUBuffer(num * (4 * 4), 0);
//         this.material.setStorageBuffer("graphicBuffer", this.transformBuffer);

//         this.object3Ds = [];
//         for (let i = 0; i < num; i++) {
//             const element = new Object3D();
//             this.object3Ds.push(element);
//             this.object3D.addChild(element);

//             this.transformBuffer.setFloat("matrix_" + i, element.transform.worldMatrix.index);
//             this.transformBuffer.setFloat("texId_" + i, 1);
//             this.transformBuffer.setFloat("texId2_" + i, 1);
//             this.transformBuffer.setFloat("texId3_" + i, 1);
//             this.transformBuffer.setColor("baseColor_" + i, new Color());
//             this.transformBuffer.setColor("emissiveColor_" + i, new Color(0, 0, 0, 0));
//             this.transformBuffer.setVector4("uvRect_" + i, new Vector4(0, 0, 1, 1));
//         }

//         this.transformBuffer.apply();
//         this.geometry = GeometryUtil.mergeNumber(source, num);
//     }

//     public startRibbon(texture: BitmapTexture2DArray, trailSegment: number, width: number, count: number) {
//         this.ribbonCount = count;
//         this.width = width;
//         // this.uSegment = uSegment;
//         // this.vSegment = vSegment;

//         this.create(new TrailGeometry(trailSegment), texture, count);

//         this._computeShader = new ComputeShader(graphicTrailCompute);
//         this._ribbonBuffer = new StorageGPUBuffer(count * (4 + 4 + 2 + 2 + 128));

//         this.ribbon3Ds = [];
//         for (let i = 0; i < count; i++) {
//             this._ribbonBuffer.setFloat(`${i}_index`, i);
//             this._ribbonBuffer.setFloat(`${i}_segment`, trailSegment);
//             this._ribbonBuffer.setFloat(`${i}_visible`, 1);
//             this._ribbonBuffer.setFloat(`${i}_width`, this.width);
//             this._ribbonBuffer.setVector4(`${i}_uv`, new Vector4(0, 0, this.uSegment, this.vSegment));
//             this._ribbonBuffer.setVector2(`${i}_uvSpeed`, new Vector2(0, Math.random() * 4));
//             this._ribbonBuffer.setFloat(`${i}_smooth`, 0);
//             this._ribbonBuffer.setFloat(`${i}_useBillboard`, 0);

//             this.ribbon3Ds[i] = [];
//             let arr = new Float32Array(1024);
//             for (let j = 0; j < 1024; j++) {
//                 const element = new Object3D();
//                 this.ribbon3Ds[i].push(element);
//                 this.object3D.addChild(element);
//                 arr[j] = element.transform.worldMatrix.index;
//             }
//             this._ribbonBuffer.setFloat32Array(`${i}_ids`, arr);
//         }
//         this._ribbonBuffer.apply();

//         this.start = () => {
//             this._computeShader.setStorageBuffer("vertexBuffer", this.geometry.vertexBuffer.vertexGPUBuffer);
//             this._computeShader.setStorageBuffer("trailBuffer", this._ribbonBuffer);
//             this._computeShader.setStorageBuffer("models", GlobalBindGroup.modelMatrixBindGroup.matrixBufferDst);
//             this._computeShader.setStorageBuffer("globalUniform", GlobalBindGroup.getCameraGroup(this.transform.scene3D.view.camera).uniformGPUBuffer);
//         }

//         this.onCompute = (view: View3D, command: GPUCommandEncoder) => this.computeTrail(view, command);
//     }

//     public setTextureID(i: number, id: number) {
//         this.transformBuffer.setFloat("texId_" + i, id);
//         this._onChange = true;
//     }

//     // public setTexture2ID(i: number, id: number) {
//     //     this.transformBuffer.setFloat("texId_" + i, id);
//     //     this._onChange = true;
//     // }

//     // public setTexture3ID(i: number, id: number) {
//     //     this.transformBuffer.setFloat("texId_" + i, id);
//     //     this._onChange = true;
//     // }

//     public setBaseColor(i: number, color: Color) {
//         this.transformBuffer.setColor("baseColor_" + i, color);
//         this._onChange = true;
//     }

//     public setEmissiveColor(i: number, color: Color) {
//         this.transformBuffer.setColor("emissiveColor_" + i, color);
//         this._onChange = true;
//     }

//     public setUVRect(i: number, v: Vector4) {
//         this.transformBuffer.setVector4("uvRect_" + i, v);
//         this._onChange = true;
//     }

//     public onUpdate(view?: View3D) {
//         if (this._onChange) {
//             this._onChange = false;
//             this.transformBuffer.apply();
//         }
//     }

//     private computeTrail(view: View3D, command: GPUCommandEncoder) {
//         this._computeShader.workerSizeX = this.ribbonCount;
//         GPUContext.computeCommand(command, [this._computeShader]);
//     }

// }