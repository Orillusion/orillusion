import { Quaternion } from "../../../../math/Quaternion";
import { Vector3 } from "../../../../math/Vector3";
import { BytesArray } from "../../../../util/BytesArray";
import { KV } from "./KVData";

export class ComData {
    comName: string;
    data: KV[];

    public static parser(bytesArray: BytesArray): ComData {
        let comBuffer = bytesArray.readBytesArray();

        let comData = new ComData();
        comData.comName = comBuffer.readUTF();
        comData.data = [];

        let count = comBuffer.readInt32();
        for (let i = 0; i < count; i++) {
            let kv = new KV();
            kv.formBytes(comBuffer);
            comData.data.push(kv);
        }
        return comData;
    }
}

export class PrefabNode {
    name: string;

    parentName: string;

    position: Vector3;

    rotation: Quaternion;

    scale: Vector3;

    comDatas: ComData[];

    child: PrefabNode[];

    public static parser(bytesArray: BytesArray) {
        let nodeBytes = bytesArray.readBytesArray();

        let prefabNode = new PrefabNode();
        prefabNode.name = nodeBytes.readUTF();
        prefabNode.parentName = nodeBytes.readUTF();
        prefabNode.position = nodeBytes.readVector3();
        prefabNode.rotation = nodeBytes.readQuaternion();
        prefabNode.scale = nodeBytes.readVector3();
        prefabNode.comDatas = [];
        prefabNode.child = [];

        let comCount = nodeBytes.readInt32();
        for (let i = 0; i < comCount; i++) {
            const comData = ComData.parser(nodeBytes);
            prefabNode.comDatas.push(comData);
        }

        let childCount = nodeBytes.readInt32();
        for (let i = 0; i < childCount; i++) {
            const childNodeData = PrefabNode.parser(nodeBytes);
            prefabNode.child.push(childNodeData);
        }
        return prefabNode;
    }
}