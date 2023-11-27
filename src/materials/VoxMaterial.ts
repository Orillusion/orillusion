import { Color, Engine3D, Material, Texture, VoxShader } from "..";

export class VoxMaterial extends Material {
    private _palatte: Color[];

    /**
     * @constructor
     */
    constructor() {
        super();
        this.shader = new VoxShader();
        // default value
        this.baseMap = Engine3D.res.whiteTexture;
    }

    public set palatte(value: Color[]) {
        this._palatte = value;
    }

    public get palatte(): Color[] {
        return this._palatte;
    }

    public set baseMap(texture: Texture) {
        this.shader.setTexture(`baseMap`, texture);
    }

    public get baseMap() {
        return this.shader.getTexture(`baseMap`);
    }

    /**
     * set base color (tint color)
     */
    public set baseColor(color: Color) {
        this.shader.setUniformColor(`baseColor`, color);
    }

    /**
     * get base color (tint color)
     */
    public get baseColor() {
        return this.shader.getUniformColor("baseColor");
    }
}
