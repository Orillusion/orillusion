import { Engine3D } from '../Engine3D';
import { Texture } from '../gfx/graphics/webGpu/core/texture/Texture';
import { EntityCollect } from '../gfx/renderJob/collect/EntityCollect';
import { defaultRes } from '../textures/DefaultRes';
import { View3D } from './View3D';
import { Object3D } from './entities/Object3D';


/**
 * It represents an independent 3D scene where 3D objects can be created and manipulated.
 * @group Entity
 */
export class Scene3D extends Object3D {
    private _envMap: Texture;
    private skyObject: Object3D;
    public envMapChange: boolean = true;
    public view: View3D;
    /**
     *
     * @constructor
     */
    constructor() {
        super();
        this.transform.scene3D = this;
        this.skyObject = new Object3D();
        this.addChild(this.skyObject);
        this._isScene3D = true;
        this.envMap ||= defaultRes.defaultSky;
    }

    /**
     *
     * get environment texture
     */
    public get envMap(): Texture {
        return this._envMap;
    }

    /**
     * set environment texture
     */
    public set envMap(value: Texture) {
        if (this._envMap != value) {
            this.envMapChange = true;
        }
        this._envMap = value;
        if (EntityCollect.instance.sky)
            EntityCollect.instance.sky.map = value;
    }

    public showSky() {
        // if (EntityCollect.instance.sky)
        //     EntityCollect.instance.sky.enable = true;
    }

    public hideSky() {
        // if (EntityCollect.instance.sky)
        //     EntityCollect.instance.sky.enable = false;
    }

    /**
     * Exposure of Sky Box. A larger value produces a sky box with stronger exposure and a brighter appearance.
     *  A smaller value produces a sky box with weaker exposure and a darker appearance.
     */
    public get exposure() {
        if (EntityCollect.instance.sky)
            return EntityCollect.instance.sky.exposure;
        return 0;
    }

    /**
     * Set the exposure of the Sky Box.
     */
    public set exposure(value) {
        if (EntityCollect.instance.sky)
            EntityCollect.instance.sky.exposure = value;
        Engine3D.setting.sky.skyExposure = value;
    }

    /**
     * Get the roughness of the Sky Box.
     */
    public get roughness() {
        if (EntityCollect.instance.sky)
            return EntityCollect.instance.sky.roughness;
    }

    /**
     * Set the roughness of the Sky Box.
     */
    public set roughness(value) {
        if (EntityCollect.instance.sky)
            EntityCollect.instance.sky.skyMaterial.roughness = value;
    }

}
