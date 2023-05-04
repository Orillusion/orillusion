import { Engine3D } from '../Engine3D';
import { Color } from '../math/Color';

import { Float16ArrayTexture } from './Float16ArrayTexture';
import { HDRTextureCube } from './HDRTextureCube';

/**
 * create a cube texture, which filled by solid color.
 * @group Texture
 */
export class SolidColorSky extends HDRTextureCube {
    private _internalTexture: Float16ArrayTexture;
    private readonly _minSize = 32;
    private _skyColor: Color;


    /**
     * create a cube texture, which filled by solid color.
     * @param color solid color
     * @returns
     */
    constructor(color: Color) {
        super();
        this._skyColor = color;
        this._internalTexture = new Float16ArrayTexture();
        let numbers = [];
        Engine3D.res.fillColor(numbers, this._minSize, this._minSize, this.color.r, this.color.g, this.color.b, this.color.a);
        this._internalTexture.create(this._minSize, this._minSize, numbers, false);
        this.createFromTexture(this._minSize, this._internalTexture);
        return this;
    }

    private changeColor(color: Color): this {
        this._skyColor = color;
        Engine3D.res.fillColor(this._internalTexture.floatArray, this._minSize, this._minSize, this.color.r, this.color.g, this.color.b, this.color.a);
        this._internalTexture.updateTexture(this._minSize, this._minSize, this._internalTexture.floatArray, false);
        this.uploadTexture(0, this._internalTexture);
        return this;
    }

    public get color(): Color {
        return this._skyColor;
    }

    /**
     * change solid color
     * @param value target color
     * @returns
     */
    public set color(value: Color) {
        this.changeColor(value);
    }

}
