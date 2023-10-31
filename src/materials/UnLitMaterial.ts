import { Engine3D } from '../Engine3D';
import { Texture } from '../gfx/graphics/webGpu/core/texture/Texture';
import { RenderShaderPass } from '../gfx/graphics/webGpu/shader/RenderShaderPass';
import { Color } from '../math/Color';
import { Vector4 } from '../math/Vector4';
import { Material } from './Material';
import { PassType } from '../gfx/renderJob/passRenderer/state/RendererType';
import { Shader, UnLitShader } from '..';

/**
 * Unlit Mateiral
 * A non glossy surface material without specular highlights.
 * @group Material
 */
export class UnLitMaterial extends Material {
    /**
     * @constructor
     */
    constructor() {
        super();
        this.shader = new UnLitShader();
        // default value
        this.baseMap = Engine3D.res.whiteTexture;
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

    /**
     * set environment texture, usually referring to cubemap
     */
    public set envMap(texture: Texture) {
        //not need env texture
    }

    /**
     * @internal
     * set shadow map
     */
    public set shadowMap(texture: Texture) {
        //not need shadowMap texture
    }
}
