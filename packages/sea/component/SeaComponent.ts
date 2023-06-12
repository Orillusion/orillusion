import { ComponentBase, LitMaterial, PlaneGeometry, RenderNode } from "@orillusion/core";
import { SeaMaterial } from "../material/SeaMaterial";

export class SeaComponent extends RenderNode {
    public mat: SeaMaterial;

    constructor() {
        super();
        this.mat = new SeaMaterial();
    }

    public init(param?: any): void {
        this.geometry = new PlaneGeometry(500, 500, 199, 199);
        this.materials[0] = this.mat;
    }

    public start(): void {

    }
}