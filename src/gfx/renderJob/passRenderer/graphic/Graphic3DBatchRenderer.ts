import { RenderNode } from "../../../../components/renderer/RenderNode";
import { BoundingBox } from "../../../../core/bound/BoundingBox";
import { View3D } from "../../../../core/View3D";
import { Color } from "../../../../math/Color";
import { Vector3 } from "../../../../math/Vector3";
import { RendererMask } from "../state/RendererMask";
import { RendererPassState } from "../state/RendererPassState";
import { RendererType } from "../state/RendererType";
import { ClusterLightingRender } from "../cluster/ClusterLightingRender";
import { Graphic3DFixedRenderPipeline } from "./Graphic3DFixedRenderPipeline";
import { GraphicConfig } from "./GraphicConfig";
import { Graphics3DShape } from "./Graphics3DShape";
import { ClusterLightingBuffer } from "../cluster/ClusterLightingBuffer";

/**
* @internal
*/
export class Graphic3DBatchRenderer extends RenderNode {
    public shapes: Map<string, Graphics3DShape>;
    protected mDirtyData: boolean = false;
    protected mMinIndexCount: number;
    protected mGPUPrimitiveTopology: GPUPrimitiveTopology;
    protected mRenderPipeline: Graphic3DFixedRenderPipeline;

    constructor(minIndexCount: number, topology: GPUPrimitiveTopology) {
        super();
        this.alwaysRender = true;
        this.mMinIndexCount = minIndexCount;
        this.mGPUPrimitiveTopology = topology;
        this.shapes = new Map<string, Graphics3DShape>();
        this.addRendererMask(RendererMask.Particle);
    }

    public fillShapeData(uuid: string, type: string, color: Color, points: Vector3[]) {
        this.mDirtyData = true;
        var data: Graphics3DShape;

        if (this.shapes.has(uuid)) {
            data = this.shapes.get(uuid);
            if (data.shapeData.length < GraphicConfig.ShapeVertexSize * points.length) {
                data.shapeData = new Float32Array(GraphicConfig.ShapeVertexSize * points.length);
            }
        } else {
            data = new Graphics3DShape(this.transform._worldMatrix.index);
            data.type = type;
            data.color = color;
            data.shapeData = new Float32Array(GraphicConfig.ShapeVertexSize * points.length);
        }

        const shapeData = data.shapeData;
        const transformIndex = this.transform._worldMatrix.index;
        for (let i = 0, index = 0; i < points.length; ++i) {
            const point = points[i];
            shapeData[index++] = point.x;
            shapeData[index++] = point.y;
            shapeData[index++] = point.z;
            shapeData[index++] = transformIndex;
            shapeData[index++] = color.r;
            shapeData[index++] = color.g;
            shapeData[index++] = color.b;
            shapeData[index++] = color.a;
        }
        this.shapes.set(uuid, data);
    }

    public init() {
        super.init();
        this.castGI = false;
        this.castShadow = false;
        this.mRenderPipeline = new Graphic3DFixedRenderPipeline(this.mMinIndexCount, this.mGPUPrimitiveTopology);
    }

    public removeShape(uuid: string) {
        if (this.shapes.has(uuid)) {
            this.mDirtyData = true;
            this.shapes.delete(uuid);
        }
    }

    protected initPipeline() {
        this.object3D.bound = new BoundingBox(Vector3.ZERO, Vector3.MAX);
        this._readyPipeline = true;
    }

    public nodeUpdate(view: View3D, passType: RendererType, renderPassState: RendererPassState, clusterLightingBuffer?: ClusterLightingBuffer) {
        // if(!this.enable || passType != RendererType.COLOR ) return ;
        if (this.mDirtyData) {
            this.mRenderPipeline.reset();
            this.shapes.forEach((shape, uuid) => {
                this.mRenderPipeline.addShapeData(shape);
            });
            this.mDirtyData = false;
        }
        return;
    }

    public renderPass2(view: View3D, passType: RendererType, rendererPassState: RendererPassState, clusterLightingBuffer: ClusterLightingBuffer, encoder: GPURenderPassEncoder, useBundle: boolean = false) {
        // if(!this.enable || passType != RendererType.COLOR ) return ;
        this.mRenderPipeline.render(rendererPassState, encoder);
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
}