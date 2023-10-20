import { BytesArray } from "../../../../util/BytesArray";
import { BlendShapePropertyData } from "./BlendShapePropertyData";

export class BlendShapeData {
    public vertexCount: number;
    public shapeNames: string[];
    public shapeIndexs: number[];

    public blendCount: number;

    // public positionList: Float32Array;
    // public normalList: Float32Array;

    public blendShapePropertyDatas: BlendShapePropertyData[];
    public blendShapeMap: Map<string, BlendShapePropertyData>;

    public formBytes(byteArray: BytesArray) {
        this.blendShapeMap = new Map<string, BlendShapePropertyData>();
        this.blendShapePropertyDatas = [];
        let bytes = byteArray.readBytesArray();

        this.vertexCount = bytes.readInt32();
        this.shapeNames = bytes.readStringArray();
        this.shapeIndexs = bytes.readIntArray();

        this.blendCount = bytes.readInt32();

        // let posCount = bytes.readInt32();
        // this.positionList = bytes.readFloat32Array(posCount * 3);
        // let normalCount = bytes.readInt32();
        // this.normalList = bytes.readFloat32Array(normalCount * 3);


        for (let i = 0; i < this.blendCount; i++) {
            let propertyData = new BlendShapePropertyData();
            propertyData.formBytes(bytes);

            this.blendShapePropertyDatas.push(propertyData);
            this.blendShapeMap.set(propertyData.shapeName, propertyData);
        }
        return byteArray;
    }

}