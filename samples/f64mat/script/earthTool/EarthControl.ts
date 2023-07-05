import { EarthTool } from './EarthTool';
import { BuildTileTool } from './BuildTileTool';
import { Camera3D, HoverCameraController, Vector2 } from '@orillusion/core';
import {Mesh64Renderer} from "@orillusion/float64-material";



export class EarthControl {
    scene: any;
    rangeAera: number;
    maxTilesCount: number;
    tilesCount: number;
    tilesRemoveCount: number;
    level: number;
    tiles: any[];
    checkForTile: boolean;
    stoprendering: boolean;
    nVisible: number;
    nHidden: number;
    camera: any;

    pixelXY: Vector2 | undefined;
    tileXY: Vector2 | undefined;
    tileInfo: any;
    static TilesbyQuadKey: any;
    _tileTexturCB: (() => void) | undefined;
    topleftLatLon: Vector2 | undefined;
    time: any;
    checkInterval: any;
    distance:any;
    roll:any;
    pitch:any;
    controller: HoverCameraController;
    constructor(scene: any,camera:Camera3D,controller:HoverCameraController) {
        this.scene = scene,
            this.rangeAera = 6,
            this.maxTilesCount = 512,
            this.tilesCount = 0,
            this.tilesRemoveCount = 0,
            this.level = 0,
            this.tiles = [],
            this.checkForTile = true,
            this.stoprendering = false,
            this.nVisible = 0,
            this.nHidden = 0,
            this.camera = camera,
            this.drawMinimalEarth(),
            EarthTool.SetLevel();
            this.controller = controller;
            this.tick(controller);
            this.camera.onLateUpdate = ()=>{
                this.distance = controller.distance;
               this.roll = controller.roll;
               this.pitch =  controller.pitch;
             }
             let timer: any = null;
            this.camera.onUpdate = ()=>{
                
                if(this.distance != controller.distance||this.roll != controller.roll||this.pitch != controller.pitch ){
                    if(timer){
                        clearTimeout(timer);
                    }
                    timer = setTimeout(()=>{
                                           this.tick(controller)
        
                        
                },200)
                }
                
                

            }
            // this.scene.registerBeforeRender(this._tick)
            this.keyHelper(controller);
    }

    drawMinimalEarth() {
        this.pixelXY = EarthTool.LatLongToPixelXY(90, -180, 3),
            this.tileXY = EarthTool.PixelXYToTileXY(this.pixelXY.x, this.pixelXY.y),
            this.tileInfo = EarthTool.ComputeVisibleTiles(this.tileXY.x, this.tileXY.y, 3, 8, false);
        for (let t = 0; t < this.tileInfo.length; t++) {
            if (void 0 !== EarthControl.TilesbyQuadKey[this.tileInfo[t].quadKey])
                continue;
            this._tileTexturCB = () => this.updateGeoInfo();
            const i = new BuildTileTool(this.scene, this.tileInfo[t].quadKey, 360 / this.tileInfo[t].nFaces, 
            this.tileInfo[t].offsetX, this.tileInfo[t].offsetY, 16, this.tileInfo[t].level, this.tileInfo[t].tileX, 
            this.tileInfo[t].tileY, this._tileTexturCB);
                this.tiles.push(i),
                EarthControl.TilesbyQuadKey[this.tileInfo[t].quadKey] = i,
                this.tilesCount++
        }
    }
    tick(controller:HoverCameraController) {
        this.level = this.getBestLevelResolution(controller);
        this.level = Math.min(this.level, 22);
        this.getGeoInfo(this.level,controller)
    }
    getBestLevelResolution(controller:HoverCameraController) {
        console.warn(`distance: ${controller.distance}`);
        const e = EarthTool.MapNumberToInterval(controller.distance, 6378137, 10378137, 0, 50);
        return EarthTool.GetBestLevelResolution(e, 1080)
    }

    getGeoInfo(levelOfDetail:number,controller:HoverCameraController) {
        const LatLong = EarthTool.CameraToLatlong(controller.roll, controller.pitch);

        this.pixelXY = EarthTool.LatLongToPixelXY(LatLong.x, LatLong.y, levelOfDetail),
            this.tileXY = EarthTool.PixelXYToTileXY(this.pixelXY.x, this.pixelXY.y),
            this.tileInfo = EarthTool.ComputeVisibleTiles(this.tileXY.x, this.tileXY.y, levelOfDetail, this.rangeAera, true);

        for (let n = 0; n < this.tileInfo.length; n++) {
            if (EarthControl.TilesbyQuadKey[this.tileInfo[n].quadKey]!= undefined)
                continue;
            const t = new BuildTileTool(this.scene, this.tileInfo[n].quadKey, 360 / this.tileInfo[n].nFaces,
            this.tileInfo[n].offsetX, this.tileInfo[n].offsetY, 16, this.tileInfo[n].level, this.tileInfo[n].tileX,
            this.tileInfo[n].tileY, this._tileTexturCB);

            this.tiles.push(t);
                EarthControl.TilesbyQuadKey[this.tileInfo[n].quadKey] = t,
                this.tilesCount++
        }

        this.topleftLatLon = void 0;
            this.showHide(this.level);
            this.removeTile()
    }
    updateGeoInfo() {
        this.time = Date.now(),
            this.checkInterval || (this.checkInterval = setInterval(() => {
                Date.now() - this.time >= 150 && (this.level = this.getBestLevelResolution(this.controller),
                    this.getGeoInfo(this.level,this.controller),
                    clearInterval(this.checkInterval),
                    this.checkInterval = null)
            }
                , 150))
    }
    showHide(e:number) {
        for (let t = 0; t < this.tiles.length; t++)
        this.tiles[t].level === e && (this.tiles[t].hasChild(),
            this.tiles[t].tile.getComponent(Mesh64Renderer).enable = true)
            
    }
    removeTile() {
        for (; this.tilesCount >= this.maxTilesCount;) {
            let t = this.tiles.shift();
            if (t.lock) {
                this.tiles.push(t);
                continue
            }
            t.tile.dispose(true, true),
                this.tilesCount--,
                this.tilesRemoveCount++;
            const i = t.quadKey;
            t = null,
                EarthControl.TilesbyQuadKey[i] = null,
                delete EarthControl.TilesbyQuadKey[i]
        }
    }
    removeAllTile() {
        for (; this.tilesCount > 0;) {
            let t = this.tiles.shift();
            if (t) {
                t.tile.dispose(true, true),
                    this.tilesCount--;
                const i = t.quadKey;
                t = null,
                    EarthControl.TilesbyQuadKey[i] = null,
                    delete EarthControl.TilesbyQuadKey[i]
            }
        }
    }
    getUperLeftLatlong() {
        const e = this.scene.pick(0, 0);
        return e.hit ? (this.topleftLatLon = EarthTool.Vec3ToLatLong(e.pickedPoint, false),
            this.topleftLatLon) : null
    }

    keyHelper(controller:HoverCameraController) {

    }

}
EarthControl.TilesbyQuadKey = [];