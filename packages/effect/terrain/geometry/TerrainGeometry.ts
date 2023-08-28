import { BitmapTexture2D, Plane, PlaneGeometry, Texture, Vector3, VertexAttributeName, lerp } from "@orillusion/core"

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
        for (let ppy = 0; ppy < this.segmentH - 1; ppy++) {
            for (let ppx = 0; ppx < this.segmentW - 1; ppx++) {

                let px0 = Math.floor(ppx / tw * texture.width);
                let py0 = Math.floor(ppy / th * texture.height);

                let px1 = Math.floor((ppx + 1) / tw * texture.width);
                let py1 = Math.floor((ppy) / th * texture.height);

                let px2 = Math.floor((ppx) / tw * texture.width);
                let py2 = Math.floor((ppy + 1) / th * texture.height);

                let px3 = Math.floor((ppx + 1) / tw * texture.width);
                let py3 = Math.floor((ppy + 1) / th * texture.height);

                var tt = ppx / tw - Math.floor(ppx / tw);
                let t0 = tt;
                let t1 = tt;
                let t2 = tt * 1.2121;

                let index0 = py0 * texture.width + px0;
                let index1 = py1 * texture.width + px1;
                let index2 = py2 * texture.width + px2;
                let index3 = py3 * texture.width + px3;

                let h0 = pixelData.data[index0 * 4];
                let h1 = pixelData.data[index1 * 4];
                let h2 = pixelData.data[index2 * 4];
                let h3 = pixelData.data[index3 * 4];

                let h = lerp(h0, h1, t0);
                h = lerp(h, h2, t1);
                h = lerp(h, h3, t2);

                let sc = 0.05;
                if (h > 45 && h < 150) {
                    this._greenList.push(new Vector3(ppx, 0, ppy));
                }

                let posIndex = tw * ppy + ppx;
                let hd = h / 256 * height;
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