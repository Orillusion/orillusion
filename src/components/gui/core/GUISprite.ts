import { Engine3D } from "../../../Engine3D";
import { Vector2 } from "../../../math/Vector2";
import { Vector4 } from "../../../math/Vector4";
import { GUITexture } from "./GUITexture";

export class GUISprite {
    public id: string;
    public guiTexture: GUITexture;
    //Information on maps in the atlas
    //xy：offset， zw：width，height
    public uvRec: Vector4 = new Vector4(0, 0, 1, 1);
    public uvBorder: Vector4 = new Vector4(0, 0, 0, 0);
    //Real white space used to restore the map
    public offsetSize: Vector4 = new Vector4(0, 0, 4, 4);
    public borderSize: Vector4 = new Vector4(0, 0, 0, 0);
    //size after trim
    public trimSize: Vector2 = new Vector2();
    public isSliced: boolean = false;
    public height: number = 4;
    public width: number = 4;

    public xadvance: number = 0;
    public xoffset: number = 0;
    public yoffset: number = 0;

    constructor(texture?: GUITexture) {
        this.guiTexture = texture || Engine3D.res.defaultGUITexture;
    }
}
