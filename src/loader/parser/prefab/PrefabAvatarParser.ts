import { Engine3D } from "../../../Engine3D";
import { GeometryBase, LODDescriptor } from "../../../core/geometry/GeometryBase";
import { GeometryVertexType } from "../../../core/geometry/GeometryVertexType";
import { VertexAttributeName } from "../../../core/geometry/VertexAttributeName";
import { BytesArray } from "../../../util/BytesArray";
import { ParserBase } from "../ParserBase";
import { ParserFormat } from "../ParserFormat";
import { PrefabParser } from "./PrefabParser";
import { PrefabAvatarData } from "./prefabData/PrefabAvatarData";


export class PrefabAvatarParser extends ParserBase {
    static format: ParserFormat = ParserFormat.BIN;
    public static parser(bytesStream: BytesArray, prefabParser: PrefabParser) {
        let avatarCount = bytesStream.readInt32();
        for (let j = 0; j < avatarCount; j++) {
            let prefabAvatarData = new PrefabAvatarData();
            prefabAvatarData.formBytes(bytesStream.readBytesArray());
            Engine3D.res.addObj(prefabAvatarData.name, prefabAvatarData);
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

let MeshVertexAttribute = {
    "Position": VertexAttributeName.position,
    "Normal": VertexAttributeName.normal,
    "Color": VertexAttributeName.color,
    "Tangent": VertexAttributeName.TANGENT,
    "TexCoord0": VertexAttributeName.uv,
    "TexCoord1": VertexAttributeName.TEXCOORD_1,
    "TexCoord2": VertexAttributeName.TEXCOORD_2,
    "TexCoord3": VertexAttributeName.TEXCOORD_2,
    "TexCoord4": VertexAttributeName.TEXCOORD_4,
    "TexCoord5": VertexAttributeName.TEXCOORD_5,
    "TexCoord6": VertexAttributeName.TEXCOORD_6,
    "TexCoord7": VertexAttributeName.TEXCOORD_7,
    "BlendIndices": VertexAttributeName.joints0,
    "BlendWeight": VertexAttributeName.weights0,
}




