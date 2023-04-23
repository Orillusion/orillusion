import { Transform } from "../../../components/Transform";
import { Matrix4 } from "../../../math/Matrix4";
import { Vector3 } from "../../../math/Vector3";
import { Orientation3D } from "../../../math/Orientation3D";
import { Object3D } from "../../../core/entities/Object3D";
import { TileSet } from "../../../loader/parser/tileRenderer/TileSet";
import { Engine3D } from "../../../Engine3D";

export class TilesRenderer {
    public readonly group: Object3D;
    private _modelList: Object3D[];
    private _tileSet: TileSet;
    private _rootPath: string;

    constructor() {
        this.group = new Object3D();
    }

    public async loadTileSet(rootPath: string, file: string) {
        this._modelList = [];
        this._rootPath = rootPath;
        let combinePath = rootPath + '/' + file;
        this._tileSet = (await Engine3D.res.loadJSON(combinePath)) as TileSet;
        if (this._tileSet.root.transform) {
            let rootMatrix = new Matrix4();
            for (let i = 0; i < 16; i++) {
                rootMatrix.rawData[i] = this._tileSet.root.transform[i];
            }
            // this.applyTransform(this.group.transform, rootMatrix);

        }

        let adjustmentTransform: Matrix4 = new Matrix4()
        const upAxis = this._tileSet.asset && this._tileSet.asset.gltfUpAxis || 'y';

        switch (upAxis.toLowerCase()) {

            case 'x':
                adjustmentTransform.makeRotationAxis(Vector3.Y_AXIS, -Math.PI / 2);
                break;

            case 'y':
                adjustmentTransform.makeRotationAxis(Vector3.X_AXIS, Math.PI / 2);
                break;

            case 'z':
                adjustmentTransform.identity();
                break;
        }
        let invertMatrix = adjustmentTransform.clone();
        invertMatrix.invert();
        this.applyTransform(this.group.transform, invertMatrix);
        for (let item of this._tileSet.root.children) {
            let uriList: string[] = [];
            if (item.content && item.content.uri) {
                uriList.push(item.content.uri);
            }
            if (item.contents) {
                for (let c of item.contents) {
                    uriList.push(c.uri);
                }
            }
            for (let uriPath of uriList) {
                let url = this._rootPath + '/' + uriPath;
                let functions = {
                    onProgress: (e) => this.onLoadProgress(e),
                    onComplete: (e) => this.onComplete(e)
                };
                let tileObject3D: Object3D;
                if (url.endsWith('.glb')) {
                    tileObject3D = (await Engine3D.res.loadGltf(url, functions)) as Object3D;
                    this.applyTransform(tileObject3D.transform, adjustmentTransform)
                } else if (url.endsWith('tileset.json')) {
                    let childTilesetUrl = url.replace('/tileset.json', '');
                    let tilesRenderer = new TilesRenderer();
                    await tilesRenderer.loadTileSet(childTilesetUrl, 'tileset.json');
                    tileObject3D = tilesRenderer.group;
                } else if (url.endsWith('.i3dm')) {
                    tileObject3D = (await Engine3D.res.loadI3DM(url, functions, adjustmentTransform)) as Object3D;
                } else if (url.endsWith('.b3dm')) {
                    tileObject3D = (await Engine3D.res.loadB3DM(url, functions, adjustmentTransform)) as Object3D;
                }

                if (tileObject3D) {
                    this._modelList.push(tileObject3D);
                    this.group.addChild(tileObject3D);
                }


            }


        }

    }

    private onLoadProgress(e) {
    }

    private onComplete(e) {
    }

    private applyTransform(transform: Transform, matrix: Matrix4) {
        let prs: Vector3[] = matrix.decompose(Orientation3D.QUATERNION);

        transform.localRotQuat.copyFrom(prs[1]);
        transform.localRotQuat = transform.localRotQuat;

        transform.localPosition.copyFrom(prs[0]);
        transform.localPosition = transform.localPosition;

        transform.localScale.copyFrom(prs[2]);
        transform.localScale = transform.localScale;
    }

}