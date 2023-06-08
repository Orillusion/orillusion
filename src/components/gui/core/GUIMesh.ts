import { Camera3D } from "../../../core/Camera3D";
import { BoundingBox } from "../../../core/bound/BoundingBox";
import { IBound } from "../../../core/bound/IBound";
import { Object3D } from "../../../core/entities/Object3D";
import { Texture } from "../../../gfx/graphics/webGpu/core/texture/Texture";
import { Vector3 } from "../../../math/Vector3";
import { GUISpace, GUIConfig } from "../GUIConfig";
import { GUIGeometry } from "./GUIGeometry";
import { GUIMaterial } from "./GUIMaterial";
import { GUIRenderer } from "./GUIRenderer";

/**
 * A object3D for GUI, holding material/geometry/renderer
 * @group GPU GUI
 */
export class GUIMesh extends Object3D {
    public uiRenderer: GUIRenderer;
    public geometry: GUIGeometry;
    public limitVertexCount: number = 0;
    private readonly _maxCount: number = 128;

    private _uiMaterial: GUIMaterial;

    constructor(space: GUISpace) {
        super();
        this._maxCount = space == GUISpace.World ? GUIConfig.quadMaxCountForWorld : GUIConfig.quadMaxCountForView;
        this.create(space);
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
        this._boundWorld ||= new BoundingBox(new Vector3(), new Vector3(1, 1, 1).multiplyScalar(Number.MAX_VALUE * 0.1));
    }

    public get bound(): IBound {
        return this._boundWorld;
    }

    private create(space: GUISpace) {
        this.uiRenderer = this.addComponent(GUIRenderer);
        this.geometry = this.uiRenderer.geometry = new GUIGeometry(this._maxCount).create();
        this._uiMaterial = this.uiRenderer.material = new GUIMaterial(space);

        this.uiRenderer.renderOrder = GUIConfig.SortOrderStartWorld;
    }

    private _setTextures(textures: Texture[]): this {
        this._uiMaterial.setTextures(textures);
        return this;
    }

    public updateGUIData(screenWidth: number, screenHeight: number, camera: Camera3D) {
        this._uiMaterial.setScreenSize(screenWidth, screenHeight);
    }
}
