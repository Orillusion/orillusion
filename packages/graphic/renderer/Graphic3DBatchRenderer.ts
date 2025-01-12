
import { ClusterLightingBuffer, Color, GeometryBase, PassType, RendererMask, RendererPassState, RenderNode, Vector3, VertexAttributeName, View3D } from "@orillusion/core";
import { Graphics3DShape } from "./Graphics3DShape";
import { Graphic3DFixedRenderMaterial } from "./Graphic3DFixedRenderMaterial";

/**
* @internal
*/
export class Graphic3DBatchRenderer extends RenderNode {
    public shapes: Map<string, Graphics3DShape>;
    protected mDirtyData: boolean = false;
    protected mBatchSize: number;
    protected mMinIndexCount: number;
    protected mGPUPrimitiveTopology: GPUPrimitiveTopology;

    constructor(minIndexCount: number, topology: GPUPrimitiveTopology) {
        super();
        this.alwaysRender = true;
        this.mMinIndexCount = minIndexCount;
        this.mBatchSize = Math.trunc(65536 / this.mMinIndexCount);
        this.mGPUPrimitiveTopology = topology;
        this.shapes = new Map<string, Graphics3DShape>();
    }

    public init() {
        super.init();
        this.addRendererMask(RendererMask.Graphic3D);
        this.castGI = false;
        this.castShadow = false;
        this.geometry = new GeometryBase();

        let indexData = new Uint16Array((Math.trunc(this.mMinIndexCount * this.mBatchSize / 4) + 1) * 4);
        for (let i = 0; i < indexData.length; i++) {
            indexData[i] = i;
        }
        this.geometry.setIndices(indexData);

        this.geometry.setAttribute(VertexAttributeName.position, new Float32Array(4 * indexData.length));
        this.geometry.setAttribute(VertexAttributeName.color, new Float32Array(4 * indexData.length));

        this.geometry.addSubGeometry({
            indexStart: 0,
            indexCount: 0,
            vertexStart: 0,
            vertexCount: 0,
            firstStart: 0,
            index: 0,
            topology: 0,
        });

        this.materials = [new Graphic3DFixedRenderMaterial(this.mGPUPrimitiveTopology)];
    }

    public fillShapeData(uuid: string, type: string, color: Color, points: Vector3[]) {
        this.mDirtyData = true;
        var data: Graphics3DShape;

        if (this.shapes.has(uuid)) {
            data = this.shapes.get(uuid);
            if (data.pointData.length < 4 * points.length) {
                data.pointData = new Float32Array(4 * points.length);
                data.colorData = new Float32Array(4 * points.length);
            }
        } else {
            data = new Graphics3DShape(this.transform._worldMatrix.index);
            data.type = type;
            data.color = color;
            data.pointData = new Float32Array(4 * points.length);
            data.colorData = new Float32Array(4 * points.length);
        }

        const pointData = data.pointData;
        const colorData = data.colorData;
        const transformIndex = this.transform._worldMatrix.index;
        for (let i = 0, index = 0; i < points.length; ++i) {
            const point = points[i];
            pointData[index] = point.x;
            colorData[index++] = color.r;

            pointData[index] = point.y;
            colorData[index++] = color.g;

            pointData[index] = point.z;
            colorData[index++] = color.b;

            pointData[index] = transformIndex;
            colorData[index++] = color.a;
        }

        this.shapes.set(uuid, data);
    }

    public removeShape(uuid: string) {
        if (this.shapes.has(uuid)) {
            this.mDirtyData = true;
            this.shapes.delete(uuid);
        }
    }

    public clear(){
        this.shapes.clear();
        this.mDirtyData = true;
    }

    public nodeUpdate(view: View3D, passType: PassType, renderPassState: RendererPassState, clusterLightingBuffer?: ClusterLightingBuffer) {
        if(this.isDestroyed)
            return
        if (this.mDirtyData) {
            let offset = 0;
            let posAttrData = this.geometry.getAttribute(VertexAttributeName.position);
            let colAttrData = this.geometry.getAttribute(VertexAttributeName.color);

            this.shapes.forEach((shape, uuid) => {
                posAttrData.data.set(shape.pointData, offset);
                colAttrData.data.set(shape.colorData, offset);
                offset += shape.pointData.length;
            });

            this.geometry.vertexBuffer.upload(VertexAttributeName.position, posAttrData);
            this.geometry.vertexBuffer.upload(VertexAttributeName.color, colAttrData);

            let count = offset / 4;
            let indexCount = count;
            this.geometry.subGeometries[0].lodLevels[0].indexCount = indexCount;


            this.mDirtyData = false;
        }
        super.nodeUpdate(view, passType, renderPassState, clusterLightingBuffer);
    }

    public allocGraphics3DShape(uuid: string, transformIndex: number) {
        let shape: Graphics3DShape;

        if (this.shapes.has(uuid)) {
            shape = this.shapes.get(uuid);
            shape.reset();
        } else {
            shape = new Graphics3DShape(transformIndex);
            shape.uuid = uuid;
            shape.type = 'line';
            shape.color = Color.COLOR_WHITE;
            this.shapes.set(shape.uuid, shape);
        }

        this.mDirtyData = true;
        return shape;
    }

    public destroy(force?: boolean): void {
        super.destroy(force);
    }
}