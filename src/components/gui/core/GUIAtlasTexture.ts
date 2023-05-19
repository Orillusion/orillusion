import { GUISprite, } from './GUISprite';
import { GUITexture } from './GUITexture';
import { Vector2 } from '../../../math/Vector2';
import { makeGUISprite } from '../GUIExtension';

export class GUIAtlasTexture {
    private _spriteMap: Map<string, GUISprite> = new Map<string, GUISprite>();
    private _spriteList: GUISprite[] = [];

    //Record Texture Size
    public readonly textureSize: Vector2 = new Vector2();
    public name: string;

    //constructor
    constructor(size: { x: number, y: number }) {
        this.textureSize.set(size.x, size.y);
    }

    /**
     * create a sprite 
     * @param srcTexture Usually it's an atlas diagram
     * @param id key of sprite
     * @param detail description of sprite
     * @returns GUISprite
     */
    public setTexture(srcTexture: GUITexture, id: string, detail: any): GUISprite {
        let sprite = makeGUISprite(srcTexture, id, detail);
        this._spriteMap.set(sprite.id, sprite);
        this._spriteList.push(sprite);
        return sprite;
    }

    /**
    * get a sprite by key/id/name
    * @param id key of sprite
    * @returns GUISprite
    */
    public getSprite(id: string): GUISprite {
        return this._spriteMap.get(id);
    }

    /**
    * Returns all sprite list
    * @returns list of GUISprite
    */
    public get spriteList() {
        return this._spriteList;
    }

}
