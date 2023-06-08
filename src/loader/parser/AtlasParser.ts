import { GUIAtlasTexture } from "../../components/gui/core/GUIAtlasTexture";
import { GUITexture } from "../../components/gui/core/GUITexture";
import { Engine3D } from "../../Engine3D";
import { Texture } from "../../gfx/graphics/webGpu/core/texture/Texture";
import { ParserBase } from "../../loader/parser/ParserBase";

export class AtlasParser extends ParserBase {
    static format: string = 'text';

    private _json: any;
    private _texture: Texture;

    public async parseString(data: string) {
        this._json = JSON.parse(data);
        let textureUrl = this.userData.replace('.json', '.png');
        this._texture = await Engine3D.res.loadTexture(textureUrl, null, true);

        this.data = { json: this._json, texture: this._texture };
        this.parseAtlas();
    }

    /**
     * Verify parsing validity
     * @param ret
     * @returns
     */
    public verification(): boolean {
        if (this.data) {
            return true;
        }
        throw new Error('verify failed.');
    }

    private parseAtlas() {
        let atlas: GUIAtlasTexture = new GUIAtlasTexture(this._json.size);
        let texture: GUITexture = new GUITexture(this._texture);

        let atlasInfo = this._json.atlas;
        for (const key in atlasInfo) {
            atlas.setTexture(texture, key, atlasInfo[key]);
        }
        Engine3D.res.addAtlas(this.baseUrl, atlas);
        this.data = atlas;
    }
}
