import { Engine3D } from "../../../Engine3D";
import { GeometryBase, LODDescriptor } from "../../../core/geometry/GeometryBase";
import { GeometryVertexType } from "../../../core/geometry/GeometryVertexType";
import { VertexAttributeName } from "../../../core/geometry/VertexAttributeName";
import { BytesArray } from "../../../util/BytesArray";
import { ParserBase } from "../ParserBase";
import { ParserFormat } from "../ParserFormat";
import { PrefabParser } from "./PrefabParser";
import { BlendShapeData } from "./prefabData/BlendShapeData";
import { PrefabMeshData } from "./prefabData/PrefabMeshData";


export class PrefabMeshParser extends ParserBase {
    static format: ParserFormat = ParserFormat.BIN;

    public async parseBuffer(buffer: ArrayBuffer) {
    }

    public static parserMeshs(bytesStream: BytesArray, prefabParser: PrefabParser) {


        let meshCount = bytesStream.readInt32();
        for (let j = 0; j < meshCount; j++) {
            let prefabMesh = new PrefabMeshData();
            let meshBytesArray = bytesStream.readBytesArray();;
            prefabMesh.meshName = meshBytesArray.readUTF();
            prefabMesh.meshID = meshBytesArray.readUTF();

            let useTangent = meshBytesArray.readFloat32() > 0;
            let useColor = meshBytesArray.readFloat32() > 0;
            let useSecondUV = meshBytesArray.readFloat32() > 0;
            let useSkeleton = meshBytesArray.readFloat32() > 0;
            let useBlendShape = meshBytesArray.readFloat32() > 0;

            if (useSkeleton) {
                prefabMesh.bones = meshBytesArray.readStringArray();
                prefabMesh.bindPose = meshBytesArray.readMatrix44Array();
            }

            if (useBlendShape) {
                prefabMesh.blendShapeData = new BlendShapeData();
                prefabMesh.blendShapeData.formBytes(meshBytesArray);
            }

            let vertexBlock = meshBytesArray.readBytesArray();
            let vertexBuffer = meshBytesArray.readBytesArray();

            let attCount = vertexBlock.readInt32();
            let vertex_dim = 0;
            let attributes = [];
            for (let i = 0; i < attCount; i++) {
                attributes[i] = {};
                attributes[i].att = MeshVertexAttribute[vertexBlock.readUTF()];
                attributes[i].dim = vertexBlock.readInt32();
                vertex_dim += attributes[i].dim;
                attributes[i].format = vertexBlock.readUTF();
            }

            prefabMesh.vertexCount = vertexBlock.readInt32();
            prefabMesh.vertexBuffer = vertexBuffer.getFloat32Array();

            let tmpIndices = meshBytesArray.readInt32Array();
            let subMesh: LODDescriptor[] = [];
            let subMeshCount = meshBytesArray.readInt32();
            for (let jj = 0; jj < subMeshCount; jj++) {
                let subMesh_topology = meshBytesArray.readInt32();
                let subMesh_indexStart = meshBytesArray.readInt32();
                let subMesh_indexCount = meshBytesArray.readInt32();
                let subMesh_baseVertex = meshBytesArray.readInt32();
                let subMesh_firstVertex = meshBytesArray.readInt32();
                let subMesh_vertexCount = meshBytesArray.readInt32();
                let subMesh_boundMin = meshBytesArray.readVector3();
                let subMesh_boundMax = meshBytesArray.readVector3();
                let subDes: LODDescriptor = {
                    indexStart: subMesh_indexStart,
                    indexCount: subMesh_indexCount,
                    vertexStart: subMesh_baseVertex,
                    vertexCount: subMesh_vertexCount,
                    firstStart: subMesh_firstVertex,
                    topology: subMesh_topology,
                    index: jj
                }
                subMesh.push(subDes);
            }


            if (tmpIndices.length > 65535) {
                prefabMesh.indices = new Uint32Array(tmpIndices);
            } else {
                prefabMesh.indices = new Uint16Array(tmpIndices);
            }

            let geometry = new GeometryBase();
            geometry.vertexDim = vertex_dim;
            geometry.geometryType = GeometryVertexType.compose_bin;
            geometry.setIndices(prefabMesh.indices);
            geometry.setAttribute(VertexAttributeName.all, prefabMesh.vertexBuffer);
            if (useSkeleton) {
                geometry.skinNames = prefabMesh.bones;
                geometry.bindPose = prefabMesh.bindPose;
            }
            if (useBlendShape) {
                geometry.blendShapeData = prefabMesh.blendShapeData;
                geometry.morphTargetsRelative = true;
                geometry.morphTargetDictionary = {};
                for (let i = 0; i < prefabMesh.blendShapeData.blendCount; i++) {
                    // if (i == 0) {
                    //     for (let index = 0; index < prefabMesh.blendShapeData.blendShapePropertyDatas[i].blendPositionList.length; index++) {
                    //         if (prefabMesh.blendShapeData.blendShapePropertyDatas[i].blendPositionList[index] != 0) {
                    //             console.error("has");
                    //         }
                    //     }
                    // }
                    geometry.setAttribute("a_morphPositions_" + i, prefabMesh.blendShapeData.blendShapePropertyDatas[i].blendPositionList);
                    geometry.setAttribute("a_morphNormals_" + i, prefabMesh.blendShapeData.blendShapePropertyDatas[i].blendNormalList);
                    for (let i = 0; i < prefabMesh.blendShapeData.blendCount; i++) {
                        let blendName = prefabMesh.blendShapeData.shapeNames[i];
                        let blendIndex = prefabMesh.blendShapeData.shapeIndexs[i];
                        geometry.morphTargetDictionary[blendName] = blendIndex;
                    }
                }


                // geometry.setAttribute("a_morphPositions_0", prefabMesh.blendShapeData.positionList);
                // geometry.setAttribute("a_morphNormals_0", prefabMesh.blendShapeData.normalList);
                // geometry.morphTargetsRelative = true;
                // geometry.morphTargetDictionary = {};
                // for (let i = 0; i < prefabMesh.blendShapeData.blendCount; i++) {
                //     let blendName = prefabMesh.blendShapeData.shapeNames[i];
                //     let blendIndex = prefabMesh.blendShapeData.shapeIndexs[i];
                //     geometry.morphTargetDictionary[blendName] = blendIndex;
                // }
            }
            for (let ii = 0; ii < attributes.length; ii++) {
                const element = attributes[ii].att;
                geometry.setAttribute(element, null);//3
            }

            for (let kk = 0; kk < subMesh.length; kk++) {
                const element = subMesh[kk];
                geometry.addSubGeometry(element);
            }

            geometry.name = prefabMesh.meshName;
            Engine3D.res.addGeometry(prefabMesh.meshID, geometry);
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
    "TexCoord7": VertexAttributeName.vIndex,
    "BlendIndices": VertexAttributeName.joints0,
    "BlendWeight": VertexAttributeName.weights0,
}




