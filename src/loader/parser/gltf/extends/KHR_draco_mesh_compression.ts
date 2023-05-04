//https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_draco_mesh_compression

import { GLTF_Primitives } from "../GLTFInfo";
import { FileLoader } from "../../../FileLoader";
import { GLTFSubParser } from "../GLTFSubParser";

/**
 * @internal
 * @group Loader
 */
export class KHR_draco_mesh_compression {
    private static _workerCode: string;
    private static _workers: Map<any, Worker> = new Map()
    public static async apply(parser: GLTFSubParser, primitive: GLTF_Primitives) {
        if (!primitive.extensions) {
            return;
        }

        const extensionArgs = primitive.extensions['KHR_draco_mesh_compression'];
        if (!extensionArgs) {
            return;
        }

        let worker = this._workers.get(parser.gltf)
        if (!worker) {
            worker = new Worker(await this.initDecoder())
            this._workers.set(parser.gltf, worker)
        }

        worker.postMessage({
            type: 'init',
            decoderConfig: {
                // wasmBinary: dracoDecoderWasm
            },
        });

        let buffer = parser.parseBufferView(extensionArgs.bufferView);
        if (!buffer.result) {
            let result = await new Promise((resolve, reject) => {
                worker.onmessage = e => {
                    const msg = e.data;
                    if (msg.type == 'decode') {
                        resolve(msg.result);
                    } else if (msg.type == 'error') {
                        reject(msg.error);
                    }
                };
                worker.postMessage({
                    type: 'decoder',
                    buffer: buffer,
                    attributes: extensionArgs.attributes
                }, [buffer]);
            });
            buffer.result = result;
        }
        return buffer.result;
    }
    public static unload(gltf: any) {
        let worker = this._workers.get(gltf)
        if (worker) {
            worker.terminate()
            this._workers.delete(gltf)
        }
    }
    protected static async initDecoder() {
        if (!this._workerCode) {
            let dracoDecoderJs = await new FileLoader().loadTxt('https://cdn.orillusion.com/draco_decoder_gltf.js');
            // let dracoDecoderWasm = await new FileLoader().loadBinData('draco/draco_decoder_gltf.js');
            const blob = new Blob([dracoDecoderJs['data'], '', `(${dracoDecoderWoeker})()`], { type: 'application/javascript' });
            this._workerCode = URL.createObjectURL(blob);
        }
        return this._workerCode;
    }
}

function dracoDecoderWoeker() {
    let decoderConfig;
    let decoderPending;
    onmessage = e => {
        const msg = e.data;
        switch (msg.type) {
            case 'init':
                decoderConfig = msg.decoderConfig;
                decoderPending = new Promise((resolve, reject) => {
                    decoderConfig.onModuleLoaded = draco => {
                        resolve({
                            draco: draco
                        });
                    };
                    // @ts-ignore
                    DracoDecoderModule(decoderConfig);
                });
                break;
            case 'decoder':
                const buffer = msg.buffer;
                const attributes = msg.attributes;
                decoderPending.then(module => {
                    const draco = module.draco;
                    let decoder = new draco.Decoder();
                    let decoderBuffer = new draco.DecoderBuffer();
                    decoderBuffer.Init(new Int8Array(buffer), buffer.byteLength);

                    let status, dracoGeometry;

                    try {
                        const geometryType = decoder.GetEncodedGeometryType(decoderBuffer);
                        if (geometryType == draco.TRIANGULAR_MESH) {
                            dracoGeometry = new draco.Mesh();
                            status = decoder.DecodeBufferToMesh(decoderBuffer, dracoGeometry);
                        } /*else if (geometryType == draco.POINT_CLOUD) {
                                dracoGeometry = new draco.PointCloud();
                                status = decoder.DecodeBufferToPointCloud(decoderBuffer, dracoGeometry);
                            } */else {
                            self.postMessage(new Error('INVALID_GEOMETRY_TYPE:' + geometryType));
                        }

                        if (!status.ok()) {
                            self.postMessage(new Error('DracoDecode:' + status.error_msg()));
                        }

                        let result = {};
                        for (const attributeName in attributes) {
                            let attribute = decoder.GetAttributeByUniqueId(dracoGeometry, attributes[attributeName]);
                            const numComponents = attribute.num_components();
                            const numPoints = dracoGeometry.num_points();
                            const numValues = numPoints * numComponents;
                            const byteLength = numValues * Float32Array.BYTES_PER_ELEMENT;
                            const dataType = draco.DT_FLOAT32; // getDracoDataType(draco, Float32Array);
                            const ptr = draco._malloc(byteLength);
                            decoder.GetAttributeDataArrayForAllPoints(dracoGeometry, attribute, dataType, byteLength, ptr);
                            const array = new Float32Array(draco.HEAPF32.buffer, ptr, numValues).slice();
                            draco._free(ptr);

                            result[attributeName] = {
                                data: array,
                                numComponents,
                                normalize: false,
                            };
                        }

                        {
                            const numFaces = dracoGeometry.num_faces();
                            const numIndices = numFaces * 3;
                            const byteLength = numIndices * 4;
                            const ptr = draco._malloc(byteLength);
                            decoder.GetTrianglesUInt32Array(dracoGeometry, byteLength, ptr);
                            const index = new Uint32Array(draco.HEAPF32.buffer, ptr, numIndices).slice();
                            draco._free(ptr);
                            result['indices'] = {
                                data: index,
                                numComponents: 1,
                                normalize: false,
                            };
                        }

                        self.postMessage({
                            type: 'decode',
                            result
                        });
                    } catch (error) {
                        self.postMessage({
                            type: 'error',
                            error: error.message
                        });
                    } finally {
                        draco.destroy(dracoGeometry);
                        draco.destroy(decoder);
                        draco.destroy(decoderBuffer);
                    }
                });
                break;
        }
    };
}
