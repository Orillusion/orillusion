import { GeometryUtil, Scene3D, StorageGPUBuffer } from "../../../../..";
import { Object3D } from "../../../../../core/entities/Object3D";
import { GeometryBase } from "../../../../../core/geometry/GeometryBase";
import { Material } from "../../../../../materials/Material";
import { UnLitTexArrayMaterial } from "../../../../../materials/UnLitTexArrayMaterial";
import { BoxGeometry } from "../../../../../shape/BoxGeometry";
import { BitmapTexture2DArray } from "../../../../../textures/BitmapTexture2DArray";
import { EntityCollect } from "../../../collect/EntityCollect";
import { Graphic3DMeshRenderer } from "./Graphic3DMeshRenderer";

export interface MaterialUniform {
    index: number;
}

export class GraphicMesh {
    public sourceGeometry: GeometryBase;
    public geometry: GeometryBase;
    public material: UnLitTexArrayMaterial;
    public texture: BitmapTexture2DArray;
    public object3Ds: Object3D[];
    public materialUniforms: MaterialUniform[];
    public renderNode: Graphic3DMeshRenderer;
    public transformBuffer: StorageGPUBuffer;
    public init() {
        this.material = new UnLitTexArrayMaterial();
        this.material.baseMap = this.texture;
        this.geometry = this.generateGeometry();

        this.transformBuffer = new StorageGPUBuffer(5000 * 16);
        this.material.setStorageBuffer("transformBuffer", this.transformBuffer);

        let object = new Object3D();
        this.renderNode = object.addComponent(Graphic3DMeshRenderer);
        this.renderNode.graphicMesh = this;
    }

    public generateGeometry(): GeometryBase {
        let geo = GeometryUtil.mergeNumber(this.sourceGeometry, 5000);
        return geo;
    }
}

export class Graphic3DMesh {
    public static meshMap: Map<GeometryBase, GraphicMesh> = new Map<GeometryBase, GraphicMesh>();
    public static meshDrawGroup: Map<string, GraphicMesh> = new Map<string, GraphicMesh>();
    public static draw(scene: Scene3D, geo: GeometryBase, texture: BitmapTexture2DArray): GraphicMesh {
        if (!this.meshMap.has(geo)) {
            let meshGroup = new GraphicMesh();
            meshGroup.sourceGeometry = geo;
            meshGroup.texture = texture;
            meshGroup.init();
            this.meshMap.set(geo, meshGroup);
            EntityCollect.instance.addRenderNode(scene, meshGroup.renderNode);
            return meshGroup;
        }
    }
}