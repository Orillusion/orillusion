import { Vector3 } from "../../..";
import { ParserBase } from "../ParserBase";
import { ParserFormat } from "../ParserFormat";
import { GeoJsonStruct, GeoType } from "./GeoJsonParser";

export class GeoJsonUtil {
    public static getPath(data: GeoJsonStruct) {
        let lineArray: Vector3[][] = [];
        for (let i = 0; i < data.features.length; i++) {
            const element = data.features[i];
            switch (element.geometry.type) {
                case GeoType.LineString:
                    // lineArray.push(element.geometry.coordinates);
                    break;
                case GeoType.MultiPolygon:
                    let point3s = [];
                    for (let i = 0; i < element.geometry.coordinates.length; i++) {
                        const pointArray = element.geometry.coordinates[i];
                        for (const list of pointArray) {
                            for (const iterator of list) {
                                let point3 = new Vector3(iterator[0], 0, iterator[1]);
                                point3s.push(point3);
                            }
                        }
                    }
                    lineArray.push(point3s);
                    break;
                default:
                    break;
            }
        }
        return lineArray;
    }
}