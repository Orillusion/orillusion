import { Engine3D } from "../../../Engine3D";
import { BitmapTexture2D } from "../../../textures/BitmapTexture2D";
import { BytesArray } from "../../../util/BytesArray";
import { ParserBase } from "../ParserBase";
import { ParserFormat } from "../ParserFormat";
import { PrefabParser } from "./PrefabParser";


export class PrefabTextureParser extends ParserBase {
    static format: ParserFormat = ParserFormat.TEXT;

    public static async parserTexture(bytesStream: BytesArray, prefabParser: PrefabParser) {
        let preTextureCount = bytesStream.readInt32();

        // for (let i = 0; i < preTextureCount; i++) {
        //     const texName = bytesStream.readUTF();
        //     let tex = await Engine3D.res.loadTexture(this.baseUrl + texName, null, true) as BitmapTexture2D;
        //     this.texDic[tex.name] = tex;
        // }

        let textures = [];
        for (let i = 0; i < preTextureCount; i++) {
            const texName = bytesStream.readUTF();
            textures.push(prefabParser.baseUrl + texName);
        }

        for (let i = 0; i < textures.length; i++) {
            const texName = textures[i];
            let tex = await Engine3D.res.loadTexture(texName, null, true) as BitmapTexture2D;
            Engine3D.res.addTexture(tex.name, tex);
        }

        // let textureList = await Engine3D.res.loadBitmapTextures(textures, 1);
        // for (const tex of textureList) {
        //     this.texDic[tex.name] = tex;
        // }
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
}
