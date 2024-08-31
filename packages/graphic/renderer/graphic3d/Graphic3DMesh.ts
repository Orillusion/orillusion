import { GeometryBase, Scene3D, BitmapTexture2DArray, Object3D, Ctor } from "@orillusion/core";
import { Graphic3DMeshRenderer } from "./Graphic3DMeshRenderer";
import { Graphic3DRibbonRenderer } from "./Graphic3DRibbonRenderer";
import { Graphic3DFaceRenderer } from "./Graphic3DFaceRenderer";
import { DynamicFaceRenderer } from "./DynamicFaceRenderer";
import { DynamicDrawStruct } from "./DynamicDrawStruct";

export class Graphic3DMesh {
    public static meshMap: Map<GeometryBase, Graphic3DMeshRenderer> = new Map<GeometryBase, Graphic3DMeshRenderer>();
    public static meshDrawGroup: Map<string, Graphic3DMeshRenderer> = new Map<string, Graphic3DMeshRenderer>();
    public static ribbonMap: Map<string, Graphic3DRibbonRenderer> = new Map<string, Graphic3DRibbonRenderer>();
    public static nodeMap: Map<string, DynamicFaceRenderer> = new Map<string, DynamicFaceRenderer>();
    public static faceMap: Map<string, Graphic3DFaceRenderer> = new Map<string, Graphic3DFaceRenderer>();

    public static draw(scene: Scene3D, geo: GeometryBase, texture: BitmapTexture2DArray, count: number): Graphic3DMeshRenderer {
        if (!this.meshMap.has(geo)) {
            let object = new Object3D();
            let renderNode = object.addComponent(Graphic3DMeshRenderer);
            renderNode.create(geo, texture, count);
            this.meshMap.set(geo, renderNode);
            scene.addChild(object);
            return renderNode;
        }
    }

    public static drawRibbon(id: string, scene: Scene3D, texture: BitmapTexture2DArray, trailSegment: number, count: number): Graphic3DRibbonRenderer {
        if (!this.ribbonMap.has(id)) {
            let object = new Object3D();
            let renderNode = object.addComponent(Graphic3DRibbonRenderer);
            renderNode.startRibbon(texture, trailSegment, count);
            this.ribbonMap.set(id, renderNode);
            scene.addChild(object);
            return renderNode;
        }
    }

    public static drawShape(id: string, scene: Scene3D, texture: BitmapTexture2DArray): Graphic3DFaceRenderer {
        if (!this.faceMap.has(id)) {
            let object = new Object3D();
            let renderNode = object.addComponent(Graphic3DFaceRenderer);
            renderNode.startShape(texture);
            this.faceMap.set(id, renderNode);
            scene.addChild(object);
            return renderNode;
        }
    }

    public static drawNode<T extends DynamicFaceRenderer>(id: string, c: Ctor<T>, nodeStruct: Ctor<DynamicDrawStruct>,
        scene: Scene3D, texture: BitmapTexture2DArray, maxNodeCount: number, maxFaceCount?: number, standAloneMatrix?: boolean) {
        if (!this.nodeMap.has(id)) {
            let object = new Object3D();
            let renderNode = object.addComponent(c, {
                maxFaceCount: maxFaceCount ? maxFaceCount : 4294967295 / 3, //use index buffer u32
                maxNodeCount: maxNodeCount,
            }) as T;
            renderNode.set(nodeStruct, texture, standAloneMatrix);
            this.nodeMap.set(id, renderNode);
            scene.addChild(object);
            return renderNode;
        }
    }
}