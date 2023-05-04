import { ComponentBase, MaterialBase, MeshRenderer, LitMaterial, Engine3D, Color, Interpolator } from "../@orillusion/core";

export class MaterialStateComponent extends ComponentBase {
    private _materials: MaterialBase[];

    public start() {
        let mr = this.object3D.getComponent(MeshRenderer);
        if (mr) {
            this._materials = mr.materials;
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
            let phyMat = this._materials[i] as LitMaterial;
            phyMat.emissiveColor = tartColor;
            Interpolator.to(phyMat, { emissiveIntensity: tartColor.a }, time);
        }
    }

}