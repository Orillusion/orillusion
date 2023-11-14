import { BitmapTexture2D, Vector2 } from "../../../..";

export class PrefabTextureData {

    public property: string;
    public name: string;
    public texture: BitmapTexture2D;
    public texelSize: Vector2;
    public wrapModeU: number;
    public wrapModeV: number;
    public wrapModeW: number;
    public wrapMode: number;
    public anisoLevel: number;
    public dimension: number;
    public filterMode: number;
}