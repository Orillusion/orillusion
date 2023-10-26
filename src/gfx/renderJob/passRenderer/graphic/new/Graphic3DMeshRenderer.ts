import { MeshRenderer } from "../../../../../components/renderer/MeshRenderer";
import { RenderNode } from "../../../../../components/renderer/RenderNode";
import { GraphicMesh } from "./Graphic3DMesh";

export class Graphic3DMeshRenderer extends MeshRenderer {
    private _graphicMesh: GraphicMesh;

    public init(): void {
        super.init();
    }

    public set graphicMesh(graphicMesh: GraphicMesh) {
        this._graphicMesh = graphicMesh;
        this.geometry = graphicMesh.geometry;
        this.material = graphicMesh.material;
    }

    public get graphicMesh(): GraphicMesh {
        return this._graphicMesh;
    }

}