import { BoundingBox, GeometryBase, Vector3, VertexAttributeName } from "@orillusion/core";
import { GrassNode } from "../GrassNode";




export class GrassGeometry extends GeometryBase {
    public width: number;
    public height: number;
    public segmentW: number;
    public segmentH: number;
    public nodes: GrassNode[];

    constructor(width: number, height: number, segmentW: number = 1, segmentH: number = 1, count: number) {
        super();
        this.width = width;
        this.height = height;
        this.segmentW = segmentW;
        this.segmentH = segmentH;
        this.nodes = [];
        this.buildGrass(count);
    }

    private buildGrass(count: number) {
        var tw: number = this.segmentW + 1;
        var singleCont: number = tw * (this.segmentH + 1);
        let vertexCount = singleCont * count;
        let position_arr = new Float32Array(vertexCount * 3);
        let normal_arr = new Float32Array(vertexCount * 3);
        let uv_arr = new Float32Array(vertexCount * 2);
        let weights_arr = new Float32Array(vertexCount * 4);
        let modelID_arr = new Float32Array(vertexCount);

        let faceIndexCount = this.segmentW * this.segmentH * 2 * 3;
        let indexes: Uint32Array = new Uint32Array(faceIndexCount * count);
        var indexP: number = 0;
        var indexN: number = 0;
        var indexU: number = 0;
        var indexW: number = 0;
        var indexI: number = 0;
        let numIndices = 0;
        let cacheIndex = 0;

        let pi = 3.1415926 * 0.5;
        for (let gi = 0; gi < count; gi++) {
            let node = new GrassNode();
            this.nodes.push(node);

            let dir = new Vector3(1 * Math.random() - 0.5, 0.0, 1 * Math.random() - 0.5);
            let curvature = 0.5 * Math.random();

            for (var yi: number = 0; yi <= this.segmentH; ++yi) {
                for (var xi: number = 0; xi <= this.segmentW; ++xi) {
                    let weight = yi / this.segmentH;
                    let x = this.width * (xi / this.segmentW);
                    let y = this.height * (weight);
                    position_arr[indexP++] = (x - this.width * 0.5) * (1.0 - weight);
                    position_arr[indexP++] = 0;
                    position_arr[indexP++] = 0;

                    normal_arr[indexN++] = 0;
                    normal_arr[indexN++] = 0;
                    normal_arr[indexN++] = 1;

                    uv_arr[indexU++] = xi / this.segmentW;
                    uv_arr[indexU++] = 1.0 - yi / this.segmentH;

                    weights_arr[indexW++] = dir.x;
                    weights_arr[indexW++] = dir.y;
                    weights_arr[indexW++] = dir.z;
                    weights_arr[indexW++] = curvature;

                    modelID_arr[indexI++] = node.worldMatrix.index;
                }
            }

            for (let i = 0; i < this.segmentH; i++) {
                for (let j = 0; j < this.segmentW; j++) {
                    let base = j + i * tw + cacheIndex;
                    let i1 = (base + 1);
                    let i2 = base;
                    let i3 = (base + tw);

                    let i4 = (base + 1);;
                    let i5 = (base + tw);
                    let i6 = (base + tw + 1);

                    indexes[numIndices++] = i1;
                    indexes[numIndices++] = i2;
                    indexes[numIndices++] = i3;
                    indexes[numIndices++] = i4;
                    indexes[numIndices++] = i5;
                    indexes[numIndices++] = i6;
                }
            }

            cacheIndex += singleCont;
        }

        this.setIndices(indexes);
        this.setAttribute(VertexAttributeName.position, position_arr);
        this.setAttribute(VertexAttributeName.normal, normal_arr);
        this.setAttribute(VertexAttributeName.uv, uv_arr);
        this.setAttribute(VertexAttributeName.TEXCOORD_1, uv_arr);
        this.setAttribute(VertexAttributeName.vIndex, modelID_arr);
        this.setAttribute(VertexAttributeName.weights0, weights_arr);

        this.addSubGeometry({
            indexStart: 0,
            indexCount: indexes.length,
            vertexStart: 0,
            index: 0,
            vertexCount: 0,
            firstStart: 0,
            topology: 0
        });

        this.bounds = new BoundingBox(Vector3.ZERO, new Vector3(9999, 9999, 9999));
    }
}