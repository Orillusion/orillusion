import { BitmapTexture2D, Plane, PlaneGeometry, Texture, Vector3, VertexAttributeName } from "@orillusion/core"

export class TerrainGeometry extends PlaneGeometry {

    private _heightData: number[][];
    private _greenList: Vector3[];


    constructor(width: number, height: number, segmentW: number = 199, segmentH: number = 199) {
        super(width, height, segmentW, segmentH, Vector3.Y_AXIS);
    }

    public setHeight(texture: BitmapTexture2D, height: number) {
        var offscreen = new OffscreenCanvas(texture.width, texture.height);
        let context = offscreen.getContext(`2d`);
        context.drawImage(texture.sourceImageData as ImageBitmap, 0, 0);

        let posAttrData = this.getAttribute(VertexAttributeName.position);
        let pixelData = context.getImageData(0, 0, texture.width, texture.height);

        this._greenList = [];

        let tw = this.segmentW + 1;
        let th = this.segmentH + 1;
        for (let ppy = 0; ppy < this.segmentH; ppy++) {
            for (let ppx = 0; ppx < this.segmentW; ppx++) {
                let px = Math.floor(ppx / tw * texture.width);
                let py = Math.floor(ppy / th * texture.height);

                let index = py * texture.width + px;
                let r = pixelData.data[index * 4];

                // if (r < 200 && g > 50 && b < 200) {
                //     this._greenList.push(new Vector3(ppx, 0, ppy));
                // }

                let sc = 0.05;
                if (r > 45 && r < 150) {
                    this._greenList.push(new Vector3(ppx, 0, ppy));
                }

                let posIndex = tw * ppy + ppx;
                let hd = r / 256 * height;
                posAttrData.data[posIndex * 3 + 1] = hd;

                this._heightData ||= [];
                this._heightData[ppy] ||= [];
                this._heightData[ppy][ppx] = hd;
            }
        }

        // position attr need to be upload
        this.vertexBuffer.upload(VertexAttributeName.position, posAttrData);

        //update normals
        this.computeNormals();
    }

    public get heightData(): number[][] {
        return this._heightData;
    }

    public get greenData(): Vector3[] {
        return this._greenList;
    }
}