import { Scene3D } from "../../../../../core/Scene3D";
import { Object3D } from "../../../../../core/entities/Object3D";
import { GeometryBase } from "../../../../../core/geometry/GeometryBase";
import { BitmapTexture2DArray } from "../../../../../textures/BitmapTexture2DArray";
import { Graphic3DMeshRenderer } from "./Graphic3DMeshRenderer";

export interface MaterialUniform {
    index: number;
}

export class Graphic3DMesh {
    public static meshMap: Map<GeometryBase, Graphic3DMeshRenderer> = new Map<GeometryBase, Graphic3DMeshRenderer>();
    public static meshDrawGroup: Map<string, Graphic3DMeshRenderer> = new Map<string, Graphic3DMeshRenderer>();
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
}