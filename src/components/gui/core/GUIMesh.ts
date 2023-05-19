import { IBound } from "../../..";
import { Camera3D } from "../../../core/Camera3D";
import { Object3D } from "../../../core/entities/Object3D";
import { Texture } from "../../../gfx/graphics/webGpu/core/texture/Texture";
import { BillboardComponent } from "../../BillboardComponent";
import { GUISpace, GUIConfig, BillboardType } from "../GUIConfig";
import { GUIGeometry } from "./GUIGeometry";
import { GUIMaterial } from "./GUIMaterial";
import { GUIRenderer } from "./GUIRenderer";

export class GUIMesh extends Object3D {
    public uiRenderer: GUIRenderer;
    public geometry: GUIGeometry;
    public readonly space: GUISpace;

    private readonly _maxCount: number = 128;

    private _billboard: BillboardComponent;
    private _uiMaterial: GUIMaterial;

    constructor(space: GUISpace, param?) {
        super();
        this.space = space;
        this._maxCount = space == GUISpace.World ? GUIConfig.quadMaxCountForWorld : GUIConfig.quadMaxCountForView;
        this.create(param);
    }

    /**
     * Return How many Quads can a single GUIGeometry support at most
     */
    public get quadMaxCount(): number {
        return this._maxCount;
    }

    public updateBound() {
        // don't remove this function
        // override function
    }

    public set bound(value: IBound) {
        this._bound = value;
    }

    public get bound(): IBound {
        return this._bound;
    }

    private create(param?) {
        this.uiRenderer = this.addComponent(GUIRenderer, { count: this._maxCount, space: this.space });

        this.geometry = this.uiRenderer.geometry as GUIGeometry;
        this._uiMaterial = this.uiRenderer.material as GUIMaterial;

        let useBillboard = param && param.billboard;
        if (this.space == GUISpace.World && useBillboard) {
            this._billboard = this.addComponent(BillboardComponent);
            this._billboard.type = BillboardType.BillboardXYZ;
        }

        this.uiRenderer.renderOrder = GUIConfig.SortOrderStart;
    }

    private _setTextures(textures: Texture[]): this {
        this._uiMaterial.setTextures(textures);
        return this;
    }

    public updateGUIData(screenWidth: number, screenHeight: number, camera: Camera3D) {
        this._uiMaterial.setScreenSize(screenWidth, screenHeight);
        // this.transform.localPosition.copy(worldPanel.worldPosition);
        // if (this.billboard) {
        //     this.billboard.enable = worldPanel.rotation == null;
        // }
        // if (worldPanel.rotation) {
        //     if (worldPanel.rotation instanceof Quaternion) {
        //         this.transform.localRotQuat.copyFrom(worldPanel.rotation);
        //     } else if (worldPanel.rotation instanceof Vector3) {
        //         this.transform.localRotation.copyFrom(worldPanel.rotation);
        //         // this.transform.localRotation.order = 'YZX';
        //     } else {
        //         this.transform.localRotQuat.copyFrom(worldPanel.rotation.localRotation);
        //     }
        // }
    }
}
