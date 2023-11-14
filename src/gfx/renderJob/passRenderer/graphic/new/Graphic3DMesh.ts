import { Scene3D } from "../../../../../core/Scene3D";
import { Object3D } from "../../../../../core/entities/Object3D";
import { GeometryBase } from "../../../../../core/geometry/GeometryBase";
import { BitmapTexture2DArray } from "../../../../../textures/BitmapTexture2DArray";
import { Graphic3DMeshRenderer } from "./Graphic3DMeshRenderer";
import { Graphic3DRibbonRenderer } from "./Graphic3DRibbonRenderer";
import { Graphic3DFaceRenderer } from "./Graphic3DFaceRenderer";

export class Graphic3DMesh {
    public static meshMap: Map<GeometryBase, Graphic3DMeshRenderer> = new Map<GeometryBase, Graphic3DMeshRenderer>();
    public static meshDrawGroup: Map<string, Graphic3DMeshRenderer> = new Map<string, Graphic3DMeshRenderer>();
    public static ribbonMap: Map<string, Graphic3DRibbonRenderer> = new Map<string, Graphic3DRibbonRenderer>();
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
        if (!this.ribbonMap.has(id)) {
            let object = new Object3D();
            let renderNode = object.addComponent(Graphic3DFaceRenderer);
            renderNode.startShape(texture);
            this.faceMap.set(id, renderNode);
            scene.addChild(object);
            return renderNode;
        }
    }
}