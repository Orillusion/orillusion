import { ComponentBase, MaterialBase, MeshRenderer, LitMaterial, Color, Interpolator, Engine3D } from "@orillusion/core";

export class MaterialStateComponent extends ComponentBase {
    private _materials: MaterialBase[];

    start() {
        let renderer = this.object3D.getComponent(MeshRenderer);
        if (renderer) {
            this._materials = renderer.materials;
            for (let i = 0; i < this._materials.length; i++) {
                if (this._materials[i] instanceof LitMaterial) {
                    const element = this._materials[i] as LitMaterial;
                    element.emissiveMap = Engine3D.res.whiteTexture;
                    element.emissiveColor = new Color(0, 0, 0, 0);
                }
            }
        }
    }

    public changeColor(tartColor: Color, time: number) {
        for (let i = 0; i < this._materials.length; i++) {
            let material = this._materials[i] as LitMaterial;
            material.emissiveColor = tartColor;
            Interpolator.to(material, { emissiveIntensity: tartColor.a }, time);
        }
    }

}