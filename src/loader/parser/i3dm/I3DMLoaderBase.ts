import { readMagicBytes } from "../b3dm/readMagicBytes";
import { BatchTable, FeatureTable } from "../b3dm/FeatureTable";

export class I3DMLoaderBase {

    public async parse(buffer: ArrayBuffer) {

        const dataView = new DataView(buffer);

        // 32-byte header

        // 4 bytes
        const magic = readMagicBytes(dataView);

        console.assert(magic === 'i3dm');

        // 4 bytes
        const version = dataView.getUint32(4, true);

        console.assert(version === 1);

        // 4 bytes
        const byteLength = dataView.getUint32(8, true);

        console.assert(byteLength === buffer.byteLength);

        // 4 bytes
        const featureTableJSONByteLength = dataView.getUint32(12, true);

        // 4 bytes
        const featureTableBinaryByteLength = dataView.getUint32(16, true);

        // 4 bytes
        const batchTableJSONByteLength = dataView.getUint32(20, true);

        // 4 bytes
        const batchTableBinaryByteLength = dataView.getUint32(24, true);

        // 4 bytes
        const gltfFormat = dataView.getUint32(28, true);

        // Feature Table
        const featureTableStart = 32;
        const featureTableBuffer = buffer.slice(
            featureTableStart,
            featureTableStart + featureTableJSONByteLength + featureTableBinaryByteLength,
        );
        const featureTable = new FeatureTable(
            featureTableBuffer,
            0,
            featureTableJSONByteLength,
            featureTableBinaryByteLength,
        );

        // Batch Table
        const batchTableStart = featureTableStart + featureTableJSONByteLength + featureTableBinaryByteLength;
        const batchTableBuffer = buffer.slice(
            batchTableStart,
            batchTableStart + batchTableJSONByteLength + batchTableBinaryByteLength,
        );
        const batchTable = new BatchTable(
            batchTableBuffer,
            featureTable.getData('INSTANCES_LENGTH'),
            0,
            batchTableJSONByteLength,
            batchTableBinaryByteLength,
        );

        const glbStart = batchTableStart + batchTableJSONByteLength + batchTableBinaryByteLength;
        const glbBytes = new Uint8Array(buffer, glbStart, byteLength - glbStart);

        return {
            version,
            featureTable,
            batchTable,
            glbBytes,
        };

    }

}

