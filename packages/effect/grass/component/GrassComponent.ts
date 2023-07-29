import { BoundingBox, Color, ComponentBase, GPUPrimitiveTopology, LightingFunction_frag, MeshRenderer, Texture, UnLitMaterial, Vector3, VertexAttributeName } from "@orillusion/core";
import { GrassMaterial } from "../material/GrassMaterial";
import { GrassGeometry } from "../geometry/GrassGeometry";
import { GrassNode } from "../GrassNode";

export class GrassComponent extends MeshRenderer {


    public grassMaterial: GrassMaterial;
    public grassGeometry: GrassGeometry;

    constructor() {
        super();
        this.grassMaterial = new GrassMaterial();
        this.alwaysRender = true;
    }

    public init(param?: any): void {
        super.init();
    }

    public setGrass(grassWidth: number, grassHeight: number, segment: number, density: number, count: number = 1000) {
        this.grassGeometry = this.geometry = new GrassGeometry(grassWidth, grassHeight, 1, segment, count);
        this.material = this.grassMaterial;
        // this.material.topology = GPUPrimitiveTopology.line_list;
        // this.material = this.grassMaterial;
    }

    setWindNoiseTexture(gustNoiseTexture: Texture) {
        this.grassMaterial.windMap = gustNoiseTexture;
    }


    public setMinMax(min: Vector3, max: Vector3) {
        this.grassGeometry.bounds = new BoundingBox(new Vector3(), new Vector3(1, 1, 1));
        this.grassGeometry.bounds.setFromMinMax(min, max);
    }

    public setGrassTexture(grassTexture: Texture) {
        this.grassMaterial.baseMap = grassTexture;
    }

    public get nodes(): GrassNode[] {
        return this.grassGeometry.nodes;
    }
}