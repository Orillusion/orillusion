import { Engine3D } from "../../../Engine3D";
import { BitmapTexture2D } from "../../../textures/BitmapTexture2D";
import { BytesArray } from "../../../util/BytesArray";
import { LoaderFunctions } from "../../LoaderFunctions";
import { ParserBase } from "../ParserBase";
import { ParserFormat } from "../ParserFormat";
import { PrefabParser } from "./PrefabParser";


export class PrefabTextureParser extends ParserBase {
    static format: ParserFormat = ParserFormat.TEXT;

    public static async parserTexture(bytesStream: BytesArray, prefabParser: PrefabParser, loaderFunctions: LoaderFunctions) {
        let preTextureCount = bytesStream.readInt32();

        let textures = [];
        for (let i = 0; i < preTextureCount; i++) {
            let texName = bytesStream.readUTF();
            if (PrefabParser.useWebp) {
                texName = texName.replace("png", "webp");
                texName = texName.replace("jpb", "webp");
                textures.push(prefabParser.baseUrl + `webp\/` + texName);
            } else {
                textures.push(prefabParser.baseUrl + texName);
            }

        }

        let textureList = await Engine3D.res.loadBitmapTextures(textures, Engine3D.setting.loader.numConcurrent, loaderFunctions, true);
        for (const tex of textureList) {
            Engine3D.res.addTexture(tex.name, tex);
        }
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
