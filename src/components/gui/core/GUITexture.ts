import { Engine3D } from "../../../Engine3D";
import { Texture } from "../../../gfx/graphics/webGpu/core/texture/Texture";

export class GUITexture {
    private static _maxUid: number = -1;
    //Self increasing number, starting from 0
    private readonly _staticId: number = -1;
    //When rendering, dynamically assign subscripts.
    //Given the ability, the maximum UI map in the engine can be unlimited,
    public dynamicId: number = -1;
    public texture: Texture;
    public width: number = 1;
    public height: number = 1;

    public get staticId(): number {
        return this._staticId;
    }

    constructor(texture: Texture) {
        texture ||= Engine3D.res.whiteTexture;
        this.texture = texture;
        GUITexture._maxUid++;
        this._staticId = GUITexture._maxUid;
        this.init();
    }

    private init(): void {
        this.dynamicId = -1;
        this.width = this.texture.width;
        this.height = this.texture.height;
    }
}