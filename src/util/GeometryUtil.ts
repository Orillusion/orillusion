import { Matrix4, VertexAttributeName } from '..';
import { GeometryBase } from '../core/geometry/GeometryBase';
import { ShaderReflection } from '../gfx/graphics/webGpu/shader/value/ShaderReflectionInfo';
/**
 * @internal
 */
export class GeometryUtil {
    public static merge(geometries: GeometryBase[], matrixes: Matrix4[], target?: GeometryBase) {

    }

    public static mergeNumber(geometries: GeometryBase, num: number, target?: GeometryBase) {
        let targetGeo = target || new GeometryBase();

        let posLen = geometries.getAttribute(VertexAttributeName.position).data.length / 3;
        let meshIndexList = new Float32Array(posLen * num);
        for (const iterator of geometries.vertexAttributeMap) {
            let attName = iterator[1].attribute;
            if (attName == VertexAttributeName.indices) continue;

            let data = geometries.getAttribute(attName).data;
            let len = data.length;
            let attData = new Float32Array(len * num);
            for (let i = 0; i < num; i++) {
                attData.set(data, len * i);
                for (let ii = 0; ii < posLen; ii++) {
                    meshIndexList[posLen * i + ii] = i;
                }
            }
            targetGeo.setAttribute(attName, attData);
        }
        targetGeo.setAttribute(VertexAttributeName.vIndex, meshIndexList);

        let indexArray = geometries.getAttribute(VertexAttributeName.indices).data as Int16Array;
        let indexLen = indexArray.length;
        let newIndexArray = new Uint32Array(indexArray.length * num);
        for (let i = 0; i < num; i++) {
            for (let j = 0; j < indexLen; j++) {
                let skipFace = i * posLen;
                let index = i * indexLen;
                const ii = indexArray[j] + skipFace;
                newIndexArray[index + j] = ii;
            }
        }

        targetGeo.setIndices(newIndexArray);
        targetGeo.addSubGeometry({
            indexStart: 0,
            indexCount: newIndexArray.length,
            vertexStart: 0,
            index: 0,
            vertexCount: 0,
            firstStart: 0,
            topology: 0
        })
        return targetGeo;
    }

    public static generateNormal() { }
    public static generateTangent() { }
    public static packUV() { }
}
