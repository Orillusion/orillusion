import { BitmapTexture2D } from '../../../textures/BitmapTexture2D';
import { ParserBase } from '../ParserBase';
import { GLTF_Info } from './GLTFInfo';
import { GLTFSubParser } from './GLTFSubParser';

/**
 * @internal
 * @group Loader
 */
export class GLBHeader {
    magic: number;
    version: number;
    length: number;
}

/**
 * @internal
 * @group Loader
 */
export class GLBChunk {
    chunkLength: number;
    chunkType: number;
    chunkData: Uint8Array;
}

/**
 * GLB file parser
 * @internal
 * @group Loader
 */
export class GLBParser extends ParserBase {
    static format: string = 'bin';

    private _gltf: GLTF_Info;

    public async parseBuffer(buffer: ArrayBuffer) {
        let byteArray = new Uint8Array(buffer);
        byteArray['pos'] = 0;

        const fileHeader: GLBHeader = this.parseHeader(byteArray);

        if (fileHeader.magic != 0x46546c67) {
            console.error(`invalid GLB file`);
            return false;
        }

        if (fileHeader.version !== 2.0) {
            console.error(`GLBParser only support glTF 2.0 for now! Received glTF version: ${fileHeader.version}`);
            return false;
        }

        let chunks: Array<GLBChunk> = [];
        while (byteArray['pos'] < byteArray.length) {
            let chunk = this.parseChunk(byteArray);
            chunks.push(chunk);
        }

        if (chunks[0].chunkType != 0x4e4f534a) {
            console.error(`invalid GLBChunk`);
            return false;
        }

        let time = performance.now();
        let gltfJSON = '';
        let maxCount = 65535;
        let chunkJSONData = chunks[0].chunkData;
        for (let i = 0; i < chunkJSONData.length; i += maxCount) {
            let count = chunkJSONData.length - i;
            count = Math.min(count, maxCount);
            let newUint = chunkJSONData.subarray(i, i + count);
            gltfJSON += String.fromCharCode(...newUint);
        }
        console.log(performance.now() - time);

        // let gltfJSON = String.fromCharCode(...chunks[0].chunkData) ;//.apply(null, chunks[0].chunkData);
        let obj = JSON.parse(gltfJSON) as object;
        this._gltf = new GLTF_Info();
        this._gltf = { ...this._gltf, ...obj };
        this._gltf.resources = {};
        for (let i = 0; i < this._gltf.buffers.length; i++) {
            let buffer = this._gltf.buffers[i];
            buffer.isParsed = true;
            buffer.dbuffer = chunks[i + 1].chunkData.buffer;
        }

        if (this._gltf.images) {
            for (let i = 0; i < this._gltf.images.length; i++) {
                let image = this._gltf.images[i];
                image.name = image.name || 'bufferView_' + image.bufferView.toString();
                const bufferView = this._gltf.bufferViews[image.bufferView];
                const buffer = this._gltf.buffers[bufferView.buffer];
                let dataBuffer = new Uint8Array(buffer.dbuffer, bufferView.byteOffset, bufferView.byteLength);
                let imgData = new Blob([dataBuffer], { type: image.mimeType });
                let dtexture = new BitmapTexture2D();
                await dtexture.loadFromBlob(imgData);
                dtexture.name = image.name;
                this._gltf.resources[image.name] = dtexture;
            }
        }

        let subParser = new GLTFSubParser();
        let nodes = await subParser.parse(this.initUrl, this._gltf, this._gltf.scene);
        if (nodes) {
            this.data = nodes.rootNode;
            return nodes.rootNode;
        }
        return null;
    }

    public async parseJsonAndBuffer(obj: object, bin: ArrayBuffer) {
        this._gltf = new GLTF_Info();
        this._gltf = { ...this._gltf, ...obj };
        this._gltf.resources = {};
        let dbuffer = this._gltf.buffers[0];
        dbuffer.isParsed = true;
        dbuffer.dbuffer = bin;

        if (this._gltf.images) {
            for (let i = 0; i < this._gltf.images.length; i++) {
                let image = this._gltf.images[i];
                image.name = image.name || 'bufferView_' + image.bufferView.toString();
                const bufferView = this._gltf.bufferViews[image.bufferView];
                const buffer = this._gltf.buffers[bufferView.buffer];
                let dataBuffer = new Uint8Array(buffer.dbuffer, bufferView.byteOffset, bufferView.byteLength);
                let imgData = new Blob([dataBuffer], { type: image.mimeType });
                let dtexture = new BitmapTexture2D();
                await dtexture.loadFromBlob(imgData);
                dtexture.name = image.name;
                this._gltf.resources[image.name] = dtexture;
            }
        }

        let subParser = new GLTFSubParser();
        let nodes = await subParser.parse(this.initUrl, this._gltf, this._gltf.scene);
        if (nodes) {
            this.data = nodes.rootNode;
            return nodes.rootNode;
        }
        return null;
    }

    public verification(): boolean {
        if (this.data) {
            return true;
        }
        throw new Error('Method not implemented.');
    }

    private parseHeader(buffer: Uint8Array): GLBHeader {
        let pos = buffer['pos'];
        let result = new GLBHeader();
        let data = new Uint32Array(buffer.buffer, pos, 3);
        buffer['pos'] += data.byteLength;
        result.magic = data[0];
        result.version = data[1];
        result.length = data[2];
        return result;
    }

    private parseChunk(buffer: Uint8Array): GLBChunk {
        let pos = buffer['pos'];
        let result = new GLBChunk();
        let data = new Uint32Array(buffer.buffer, pos, 2);
        pos = buffer['pos'] += data.byteLength;
        result.chunkLength = data[0];
        result.chunkType = data[1];
        result.chunkData = new Uint8Array(buffer.buffer, pos, result.chunkLength);
        const bytes = new Uint8Array(result.chunkLength);
        for (let i = 0; i < result.chunkLength; i++) bytes[i] = result.chunkData[i];
        result.chunkData = bytes;
        buffer['pos'] += result.chunkLength;
        return result;
    }
}
