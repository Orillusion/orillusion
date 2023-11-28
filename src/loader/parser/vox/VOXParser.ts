import { Color, Object3D, VoxMaterial, VoxRenderer, VoxelData } from "../../..";
import { ParserBase } from "../ParserBase";
import { ParserFormat } from "../ParserFormat";

export class VOXParser extends ParserBase {
    static format: ParserFormat = ParserFormat.BIN;
    private _bytes: DataView;

    async parseBuffer(buffer: ArrayBuffer) {
        this.initBytes(buffer);

        let mainChunk = new VOXMainChunk();

        // "VOX "
        let magic = this.readString(4);
        if (magic != "VOX ") {
            console.error(`VOXParser: invalid VOX file`);
            return false;
        }

        // veraion
        mainChunk.version = this.readBytes(4);
        console.warn(`VOXFile version:${mainChunk.version}`);

        let chunkId = this.readString(4);
        if (chunkId != "MAIN") {
            console.error(`VOXParser: Invalid MainChunk ID, main chunk expected`);
            return null;
        }

        let chunkSize = this.readInt32();
        let childrenSize = this.readInt32();

        // skip
        this.readBytes(chunkSize);

        let readSize = 0;
        while (readSize < childrenSize) {
            chunkId = this.readString(4);
            if (chunkId == "PACK") {
                let chunkContentBytes = this.readInt32();
                let childrenBytes = this.readInt32();
                // skip
                this.readInt32();
                readSize += chunkContentBytes + childrenBytes + 4 * 3;
            } else if (chunkId == "SIZE") {
                readSize += this.readSizeChunk(mainChunk);
            } else if (chunkId == "XYZI") {
                readSize += this.readVoxelChunk(mainChunk.voxelChunk);
            } else if (chunkId == "RGBA") {
                mainChunk.palatte = new Array<Color>(256);
                readSize += this.readPalattee(mainChunk.palatte);
            } else {
                console.warn("VOXParser: Unknown chunk type: " + chunkId);
                let chunkContentBytes = this.readInt32();
                let childrenBytes = this.readInt32();
                this.readBytes(chunkContentBytes + childrenBytes);
                readSize += chunkContentBytes + childrenBytes + 12;
            }
        }

        const generateFaces = false;
        if (generateFaces) {
            this.generateFaces(mainChunk.voxelChunk);
        }

        if (mainChunk.palatte == null) {
            mainChunk.palatte = VOXMainChunk.defaultPalatte;
        }

        let obj = new Object3D();
        let voxRender = obj.addComponent(VoxRenderer);

        let voxelData = new VoxelData();
        voxelData.sizeX = mainChunk.sizeX;
        voxelData.sizeY = mainChunk.sizeY;
        voxelData.sizeZ = mainChunk.sizeZ;
        voxelData.palatte = mainChunk.palatte;
        voxelData.voxels = mainChunk.voxelChunk.voxels;
        voxRender.voxelData = voxelData;

        let mat = new VoxMaterial();
        mat.palatte = mainChunk.palatte;
        voxRender.material = mat;

        this.data = obj;
        return this.data;
    }

    protected readSizeChunk(mainChunk: VOXMainChunk): number {
        let chunkSize = this.readInt32();
        let childrenSize = this.readInt32();

        mainChunk.sizeX = this.readInt32();
        mainChunk.sizeY = this.readInt32();
        mainChunk.sizeZ = this.readInt32();

        mainChunk.voxelChunk = new VOXVoxelChunk();
        mainChunk.voxelChunk.sizeX = mainChunk.sizeX;
        mainChunk.voxelChunk.sizeY = mainChunk.sizeY;
        mainChunk.voxelChunk.sizeZ = mainChunk.sizeZ;
        mainChunk.voxelChunk.voxels = new Uint8Array(mainChunk.sizeX * mainChunk.sizeY * mainChunk.sizeZ);

        if (childrenSize > 0) {
            this.readBytes(childrenSize);
            console.warn("VOXParser: Nested chunk not supported");
        }

        return chunkSize + childrenSize + 4 * 3;
    }

    protected readVoxelChunk(chunk: VOXVoxelChunk): number {
        let chunkSize = this.readInt32();
        let childrenSize = this.readInt32();
        let numVoxels = this.readInt32();

        for (let i = 0; i < numVoxels; ++i) {
            let x = this.readByte();
            let y = this.readByte();
            let z = this.readByte();

            let index = z * chunk.sizeX * chunk.sizeY + y * chunk.sizeX + x;
            chunk.voxels[index] = this.readByte();
        }

        if (childrenSize > 0) {
            this.readBytes(childrenSize);
            console.warn("VOXParser: Nested chunk not supported");
        }

        return chunkSize + childrenSize + 4 * 3;
    }

    protected readPalattee(colors: Color[]) {
        let chunkSize = this.readInt32();
        let childrenSize = this.readInt32();

        for (let i = 0; i < 256; ++i) {
            let r = this.readByte() / 255.0;
            let g = this.readByte() / 255.0;
            let b = this.readByte() / 255.0;
            let a = this.readByte() / 255.0;
            colors[i] = new Color(r, g, b, a);
        }

        if (childrenSize > 0) {
            this.readBytes(childrenSize);
            console.warn("VOXParser: Nested chunk not supported");
        }

        return chunkSize + childrenSize + 4 * 3;
    }

    protected generateFaces(voxelChunk: VOXVoxelChunk) {
    }

    private initBytes(buffer: ArrayBuffer) {
        this._bytes = new DataView(buffer);
        this._bytes['pos'] = 0;
    }

    private readInt32(): number {
        let pos = this._bytes['pos'];
        let result = this._bytes.getInt32(pos, true);
        this._bytes['pos'] += 4;
        return result;
    }

    private readByte(): number {
        let pos = this._bytes['pos'];
        let result = this._bytes.getUint8(pos);
        this._bytes['pos'] += 1;
        return result;
    }

    private readBytes(len: number): Uint8Array {
        let result = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            result[i] = this.readByte();
        }
        return result
    }

    private readString(len: number): string {
        let bytes = this.readBytes(len);
        let x = [];
        bytes.forEach(b => x.push(b));
        return String.fromCharCode(...x);
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
        throw new Error('Method not implemented.');
    }
}

class VOXMainChunk {
    public voxelChunk: VOXVoxelChunk;
    public palatte: Color[];
    public sizeX: number;
    public sizeY: number;
    public sizeZ: number;
    public version: Uint8Array;
    public static readonly defaultPalatte: Color[] = [
        new Color(1.000000, 1.000000, 1.000000),
        new Color(1.000000, 1.000000, 0.800000),
        new Color(1.000000, 1.000000, 0.600000),
        new Color(1.000000, 1.000000, 0.400000),
        new Color(1.000000, 1.000000, 0.200000),
        new Color(1.000000, 1.000000, 0.000000),
        new Color(1.000000, 0.800000, 1.000000),
        new Color(1.000000, 0.800000, 0.800000),
        new Color(1.000000, 0.800000, 0.600000),
        new Color(1.000000, 0.800000, 0.400000),
        new Color(1.000000, 0.800000, 0.200000),
        new Color(1.000000, 0.800000, 0.000000),
        new Color(1.000000, 0.600000, 1.000000),
        new Color(1.000000, 0.600000, 0.800000),
        new Color(1.000000, 0.600000, 0.600000),
        new Color(1.000000, 0.600000, 0.400000),
        new Color(1.000000, 0.600000, 0.200000),
        new Color(1.000000, 0.600000, 0.000000),
        new Color(1.000000, 0.400000, 1.000000),
        new Color(1.000000, 0.400000, 0.800000),
        new Color(1.000000, 0.400000, 0.600000),
        new Color(1.000000, 0.400000, 0.400000),
        new Color(1.000000, 0.400000, 0.200000),
        new Color(1.000000, 0.400000, 0.000000),
        new Color(1.000000, 0.200000, 1.000000),
        new Color(1.000000, 0.200000, 0.800000),
        new Color(1.000000, 0.200000, 0.600000),
        new Color(1.000000, 0.200000, 0.400000),
        new Color(1.000000, 0.200000, 0.200000),
        new Color(1.000000, 0.200000, 0.000000),
        new Color(1.000000, 0.000000, 1.000000),
        new Color(1.000000, 0.000000, 0.800000),
        new Color(1.000000, 0.000000, 0.600000),
        new Color(1.000000, 0.000000, 0.400000),
        new Color(1.000000, 0.000000, 0.200000),
        new Color(1.000000, 0.000000, 0.000000),
        new Color(0.800000, 1.000000, 1.000000),
        new Color(0.800000, 1.000000, 0.800000),
        new Color(0.800000, 1.000000, 0.600000),
        new Color(0.800000, 1.000000, 0.400000),
        new Color(0.800000, 1.000000, 0.200000),
        new Color(0.800000, 1.000000, 0.000000),
        new Color(0.800000, 0.800000, 1.000000),
        new Color(0.800000, 0.800000, 0.800000),
        new Color(0.800000, 0.800000, 0.600000),
        new Color(0.800000, 0.800000, 0.400000),
        new Color(0.800000, 0.800000, 0.200000),
        new Color(0.800000, 0.800000, 0.000000),
        new Color(0.800000, 0.600000, 1.000000),
        new Color(0.800000, 0.600000, 0.800000),
        new Color(0.800000, 0.600000, 0.600000),
        new Color(0.800000, 0.600000, 0.400000),
        new Color(0.800000, 0.600000, 0.200000),
        new Color(0.800000, 0.600000, 0.000000),
        new Color(0.800000, 0.400000, 1.000000),
        new Color(0.800000, 0.400000, 0.800000),
        new Color(0.800000, 0.400000, 0.600000),
        new Color(0.800000, 0.400000, 0.400000),
        new Color(0.800000, 0.400000, 0.200000),
        new Color(0.800000, 0.400000, 0.000000),
        new Color(0.800000, 0.200000, 1.000000),
        new Color(0.800000, 0.200000, 0.800000),
        new Color(0.800000, 0.200000, 0.600000),
        new Color(0.800000, 0.200000, 0.400000),
        new Color(0.800000, 0.200000, 0.200000),
        new Color(0.800000, 0.200000, 0.000000),
        new Color(0.800000, 0.000000, 1.000000),
        new Color(0.800000, 0.000000, 0.800000),
        new Color(0.800000, 0.000000, 0.600000),
        new Color(0.800000, 0.000000, 0.400000),
        new Color(0.800000, 0.000000, 0.200000),
        new Color(0.800000, 0.000000, 0.000000),
        new Color(0.600000, 1.000000, 1.000000),
        new Color(0.600000, 1.000000, 0.800000),
        new Color(0.600000, 1.000000, 0.600000),
        new Color(0.600000, 1.000000, 0.400000),
        new Color(0.600000, 1.000000, 0.200000),
        new Color(0.600000, 1.000000, 0.000000),
        new Color(0.600000, 0.800000, 1.000000),
        new Color(0.600000, 0.800000, 0.800000),
        new Color(0.600000, 0.800000, 0.600000),
        new Color(0.600000, 0.800000, 0.400000),
        new Color(0.600000, 0.800000, 0.200000),
        new Color(0.600000, 0.800000, 0.000000),
        new Color(0.600000, 0.600000, 1.000000),
        new Color(0.600000, 0.600000, 0.800000),
        new Color(0.600000, 0.600000, 0.600000),
        new Color(0.600000, 0.600000, 0.400000),
        new Color(0.600000, 0.600000, 0.200000),
        new Color(0.600000, 0.600000, 0.000000),
        new Color(0.600000, 0.400000, 1.000000),
        new Color(0.600000, 0.400000, 0.800000),
        new Color(0.600000, 0.400000, 0.600000),
        new Color(0.600000, 0.400000, 0.400000),
        new Color(0.600000, 0.400000, 0.200000),
        new Color(0.600000, 0.400000, 0.000000),
        new Color(0.600000, 0.200000, 1.000000),
        new Color(0.600000, 0.200000, 0.800000),
        new Color(0.600000, 0.200000, 0.600000),
        new Color(0.600000, 0.200000, 0.400000),
        new Color(0.600000, 0.200000, 0.200000),
        new Color(0.600000, 0.200000, 0.000000),
        new Color(0.600000, 0.000000, 1.000000),
        new Color(0.600000, 0.000000, 0.800000),
        new Color(0.600000, 0.000000, 0.600000),
        new Color(0.600000, 0.000000, 0.400000),
        new Color(0.600000, 0.000000, 0.200000),
        new Color(0.600000, 0.000000, 0.000000),
        new Color(0.400000, 1.000000, 1.000000),
        new Color(0.400000, 1.000000, 0.800000),
        new Color(0.400000, 1.000000, 0.600000),
        new Color(0.400000, 1.000000, 0.400000),
        new Color(0.400000, 1.000000, 0.200000),
        new Color(0.400000, 1.000000, 0.000000),
        new Color(0.400000, 0.800000, 1.000000),
        new Color(0.400000, 0.800000, 0.800000),
        new Color(0.400000, 0.800000, 0.600000),
        new Color(0.400000, 0.800000, 0.400000),
        new Color(0.400000, 0.800000, 0.200000),
        new Color(0.400000, 0.800000, 0.000000),
        new Color(0.400000, 0.600000, 1.000000),
        new Color(0.400000, 0.600000, 0.800000),
        new Color(0.400000, 0.600000, 0.600000),
        new Color(0.400000, 0.600000, 0.400000),
        new Color(0.400000, 0.600000, 0.200000),
        new Color(0.400000, 0.600000, 0.000000),
        new Color(0.400000, 0.400000, 1.000000),
        new Color(0.400000, 0.400000, 0.800000),
        new Color(0.400000, 0.400000, 0.600000),
        new Color(0.400000, 0.400000, 0.400000),
        new Color(0.400000, 0.400000, 0.200000),
        new Color(0.400000, 0.400000, 0.000000),
        new Color(0.400000, 0.200000, 1.000000),
        new Color(0.400000, 0.200000, 0.800000),
        new Color(0.400000, 0.200000, 0.600000),
        new Color(0.400000, 0.200000, 0.400000),
        new Color(0.400000, 0.200000, 0.200000),
        new Color(0.400000, 0.200000, 0.000000),
        new Color(0.400000, 0.000000, 1.000000),
        new Color(0.400000, 0.000000, 0.800000),
        new Color(0.400000, 0.000000, 0.600000),
        new Color(0.400000, 0.000000, 0.400000),
        new Color(0.400000, 0.000000, 0.200000),
        new Color(0.400000, 0.000000, 0.000000),
        new Color(0.200000, 1.000000, 1.000000),
        new Color(0.200000, 1.000000, 0.800000),
        new Color(0.200000, 1.000000, 0.600000),
        new Color(0.200000, 1.000000, 0.400000),
        new Color(0.200000, 1.000000, 0.200000),
        new Color(0.200000, 1.000000, 0.000000),
        new Color(0.200000, 0.800000, 1.000000),
        new Color(0.200000, 0.800000, 0.800000),
        new Color(0.200000, 0.800000, 0.600000),
        new Color(0.200000, 0.800000, 0.400000),
        new Color(0.200000, 0.800000, 0.200000),
        new Color(0.200000, 0.800000, 0.000000),
        new Color(0.200000, 0.600000, 1.000000),
        new Color(0.200000, 0.600000, 0.800000),
        new Color(0.200000, 0.600000, 0.600000),
        new Color(0.200000, 0.600000, 0.400000),
        new Color(0.200000, 0.600000, 0.200000),
        new Color(0.200000, 0.600000, 0.000000),
        new Color(0.200000, 0.400000, 1.000000),
        new Color(0.200000, 0.400000, 0.800000),
        new Color(0.200000, 0.400000, 0.600000),
        new Color(0.200000, 0.400000, 0.400000),
        new Color(0.200000, 0.400000, 0.200000),
        new Color(0.200000, 0.400000, 0.000000),
        new Color(0.200000, 0.200000, 1.000000),
        new Color(0.200000, 0.200000, 0.800000),
        new Color(0.200000, 0.200000, 0.600000),
        new Color(0.200000, 0.200000, 0.400000),
        new Color(0.200000, 0.200000, 0.200000),
        new Color(0.200000, 0.200000, 0.000000),
        new Color(0.200000, 0.000000, 1.000000),
        new Color(0.200000, 0.000000, 0.800000),
        new Color(0.200000, 0.000000, 0.600000),
        new Color(0.200000, 0.000000, 0.400000),
        new Color(0.200000, 0.000000, 0.200000),
        new Color(0.200000, 0.000000, 0.000000),
        new Color(0.000000, 1.000000, 1.000000),
        new Color(0.000000, 1.000000, 0.800000),
        new Color(0.000000, 1.000000, 0.600000),
        new Color(0.000000, 1.000000, 0.400000),
        new Color(0.000000, 1.000000, 0.200000),
        new Color(0.000000, 1.000000, 0.000000),
        new Color(0.000000, 0.800000, 1.000000),
        new Color(0.000000, 0.800000, 0.800000),
        new Color(0.000000, 0.800000, 0.600000),
        new Color(0.000000, 0.800000, 0.400000),
        new Color(0.000000, 0.800000, 0.200000),
        new Color(0.000000, 0.800000, 0.000000),
        new Color(0.000000, 0.600000, 1.000000),
        new Color(0.000000, 0.600000, 0.800000),
        new Color(0.000000, 0.600000, 0.600000),
        new Color(0.000000, 0.600000, 0.400000),
        new Color(0.000000, 0.600000, 0.200000),
        new Color(0.000000, 0.600000, 0.000000),
        new Color(0.000000, 0.400000, 1.000000),
        new Color(0.000000, 0.400000, 0.800000),
        new Color(0.000000, 0.400000, 0.600000),
        new Color(0.000000, 0.400000, 0.400000),
        new Color(0.000000, 0.400000, 0.200000),
        new Color(0.000000, 0.400000, 0.000000),
        new Color(0.000000, 0.200000, 1.000000),
        new Color(0.000000, 0.200000, 0.800000),
        new Color(0.000000, 0.200000, 0.600000),
        new Color(0.000000, 0.200000, 0.400000),
        new Color(0.000000, 0.200000, 0.200000),
        new Color(0.000000, 0.200000, 0.000000),
        new Color(0.000000, 0.000000, 1.000000),
        new Color(0.000000, 0.000000, 0.800000),
        new Color(0.000000, 0.000000, 0.600000),
        new Color(0.000000, 0.000000, 0.400000),
        new Color(0.000000, 0.000000, 0.200000),
        new Color(0.933333, 0.000000, 0.000000),
        new Color(0.866667, 0.000000, 0.000000),
        new Color(0.733333, 0.000000, 0.000000),
        new Color(0.666667, 0.000000, 0.000000),
        new Color(0.533333, 0.000000, 0.000000),
        new Color(0.466667, 0.000000, 0.000000),
        new Color(0.333333, 0.000000, 0.000000),
        new Color(0.266667, 0.000000, 0.000000),
        new Color(0.133333, 0.000000, 0.000000),
        new Color(0.066667, 0.000000, 0.000000),
        new Color(0.000000, 0.933333, 0.000000),
        new Color(0.000000, 0.866667, 0.000000),
        new Color(0.000000, 0.733333, 0.000000),
        new Color(0.000000, 0.666667, 0.000000),
        new Color(0.000000, 0.533333, 0.000000),
        new Color(0.000000, 0.466667, 0.000000),
        new Color(0.000000, 0.333333, 0.000000),
        new Color(0.000000, 0.266667, 0.000000),
        new Color(0.000000, 0.133333, 0.000000),
        new Color(0.000000, 0.066667, 0.000000),
        new Color(0.000000, 0.000000, 0.933333),
        new Color(0.000000, 0.000000, 0.866667),
        new Color(0.000000, 0.000000, 0.733333),
        new Color(0.000000, 0.000000, 0.666667),
        new Color(0.000000, 0.000000, 0.533333),
        new Color(0.000000, 0.000000, 0.466667),
        new Color(0.000000, 0.000000, 0.333333),
        new Color(0.000000, 0.000000, 0.266667),
        new Color(0.000000, 0.000000, 0.133333),
        new Color(0.000000, 0.000000, 0.066667),
        new Color(0.933333, 0.933333, 0.933333),
        new Color(0.866667, 0.866667, 0.866667),
        new Color(0.733333, 0.733333, 0.733333),
        new Color(0.666667, 0.666667, 0.666667),
        new Color(0.533333, 0.533333, 0.533333),
        new Color(0.466667, 0.466667, 0.466667),
        new Color(0.333333, 0.333333, 0.333333),
        new Color(0.266667, 0.266667, 0.266667),
        new Color(0.133333, 0.133333, 0.133333),
        new Color(0.066667, 0.066667, 0.066667),
        new Color(0.000000, 0.000000, 0.000000)
    ];
}

class VOXVoxelChunk {
    public voxels: Uint8Array;
    public faces: VOXFaceCollection[];
    public x: number;
    public y: number;
    public z: number;
    public sizeX: number;
    public sizeY: number;
    public sizeZ: number;
}

class VOXFaceCollection {
    public colorIndices: Uint8Array;
}
