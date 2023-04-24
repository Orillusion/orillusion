import { Texture } from '../gfx/graphics/webGpu/core/texture/Texture';
import { ShaderState } from '../gfx/graphics/webGpu/shader/value/ShaderState';
import { RendererType } from '../gfx/renderJob/passRenderer/state/RendererType';
import { Color } from '../math/Color';
import { Vector4 } from '../math/Vector4';
import { UUID } from '../util/Global';
import { MaterialPass } from './MaterialPass';
import { registerMaterial } from './MaterialRegister';

/**
 *
 * The base class for all shaders,
 * describing how an object's surface should be rendered
 * @internal
 * @group Material
 */
export class MaterialBase extends MaterialPass {

    /**
     *
     * name of this material
     */
    public name: string;

    /**
     *
     * Material Unique Identifier
     */
    public instanceID: string;

    /**
     * is PassMaterial
     */
    public isPassMaterial: boolean = false;

    /**
     * Whether to receive environment effect
     */
    public receiveEnv: boolean = true;

    private _normalMapYFlip: boolean;


    public get shaderState(): ShaderState {
        return this.renderShader.shaderState;
    }

    public set shaderState(value: ShaderState) {
        this.renderShader.shaderState = value;
    }


    public get normalMapYFlip(): boolean {
        return this._normalMapYFlip;
    }

    public set normalMapYFlip(value: boolean) {
        this._normalMapYFlip = value;
        if (value) {
            this.renderShader.setDefine("USE_NORMALFILPY", true);
        }
    }

    /**
     *  Set shadow map
     */
    public set shadowMap(texture: Texture) {
        this.renderShader.setTexture(`shadowMap`, texture);
    }

    /**
     * Set environment map
     */
    public set envMap(texture: Texture) {
        this.renderShader.setTexture(`envMap`, texture);
    }

    /**
     *  Set base map(main map)
     */
    public set baseMap(texture: Texture) {
        this.renderShader.setTexture(`baseMap`, texture);

        this.notifyPropertyChange(`baseMap`, texture);
    }

    /**
     * Get base map(main map)
     */
    public get baseMap(): Texture {
        return this.renderShader.textures[`baseMap`];
    }

    /**
     * Get normal map
     */
    public get normalMap(): Texture {
        return this.renderShader.textures[`normalMap`];
    }

    /**
     * Set normal map
     */
    public set normalMap(texture: Texture) {
        this.renderShader.setTexture(`normalMap`, texture);
        this.notifyPropertyChange(`normalMap`, texture);
    }

    /**
     * Get emissive map
     */
    public get emissiveMap(): Texture {
        return this.renderShader.textures[`emissiveMap`];
    }

    /**
     * Get emissive color
     */
    public get emissiveColor(): Color {
        return this.renderShader.uniforms[`emissiveColor`].color;
    }

    /**
     * Set emissive color
     */
    public set emissiveColor(value: Color) {
        this.renderShader.setUniformColor(`emissiveColor`, value);
        this.notifyPropertyChange(`emissiveColor`, value);
    }

    /**
     * Set emissive intensity
     */
    public set emissiveIntensity(value: number) {
        this.renderShader.setUniformFloat(`emissiveIntensity`, value);
        this.notifyPropertyChange(`emissiveIntensity`, value);
    }

    /**
     * Get emissive intensity
     */
    public get emissiveIntensity(): number {
        return this.renderShader.uniforms[`emissiveIntensity`].value;
    }



    /**
     * Set emissive map
     */
    public set emissiveMap(value: Texture) {
        // this.textures[7] = value;
        this.renderShader.setTexture(`emissiveMap`, value);
        this.notifyPropertyChange(`emissiveMap`, value);
        // this.onChange = true;
    }

    /**
     * Get envionment effect intensity
     */
    public get envIntensity() {
        return this.renderShader.uniforms[`envIntensity`].value;
    }

    /**
     * Set envionment effect intensity
     */
    public set envIntensity(value: number) {
        if (`envIntensity` in this.renderShader.uniforms) this.renderShader.uniforms[`envIntensity`].value = value;
        this.notifyPropertyChange(`envIntensity`, value);
    }

    /**
     * Get normal strength
     */
    public get normalScale() {
        return this.renderShader.uniforms[`normalScale`].value;
    }

    /**
     * Set normal strength
     */
    public set normalScale(value: number) {
        if (`normalScale` in this.renderShader.uniforms) this.renderShader.uniforms[`envIntensity`].value = value;
        this.notifyPropertyChange(`normalScale`, value);
    }

    /**
     * Get alphaCutoff, channel transparency threshold parameter
     */
    public get alphaCutoff() {
        return this.renderShader.uniforms[`alphaCutoff`].value;
    }

    /**
     * Set alphaCutoff, channel transparency threshold parameter
     */
    public set alphaCutoff(value: number) {
        if (`alphaCutoff` in this.renderShader.uniforms) {
            this.renderShader.uniforms[`alphaCutoff`].value = value;
            if (value < 1.0 && value != 0) {
                this.renderShader.setDefine("USE_ALPHACUT", true);
                console.log("USE_ALPHACUT");
            } else {
                this.renderShader.setDefine("USE_ALPHACUT", false);
            }
            this.notifyPropertyChange(`alphaCutoff`, value);
        }
    }

    /**
     * Get irradiance map
     */
    public get irradianceMap(): Texture {
        return this.renderShader.textures[`irradianceMap`];
    }

    /**
     * Set irradiance map
     */
    public set irradianceMap(value: Texture) {
        this.renderShader.setTexture(`irradianceMap`, value);
        this.notifyPropertyChange(`irradianceMap`, value);
    }

    /**
     * Get irradiance depth map
     */
    public get irradianceDepthMap(): Texture {
        return this.renderShader.textures[`irradianceDepthMap`];
    }

    /**
     * Set irradiance depth map
     */
    public set irradianceDepthMap(value: Texture) {
        this.renderShader.setTexture(`irradianceDepthMap`, value);
        this.notifyPropertyChange(`irradianceDepthMap`, value);
    }

    /**
     * Get base color(tint color)
     */
    public get baseColor(): Color {
        return this.renderShader.uniforms[`baseColor`].color;
    }

    /**
     * Set base color(tint color)
     */
    public set baseColor(value: Color) {
        this.renderShader.setUniformColor(`baseColor`, value);
        this.notifyPropertyChange(`baseColor`, value);
    }


    /**
     * Get uvTransform_1
     */
    public get uvTransform_1(): Vector4 {
        return this.renderShader.uniforms[`transformUV1`].vector4;
    }

    /**
     * Set uvTransform_1
     */
    public set uvTransform_1(value: Vector4) {
        this.renderShader.uniforms[`transformUV1`].vector4 = value;
        this.notifyPropertyChange(`transformUV1`, value);
    }

    /**
     * Get uvTransform_2
     */
    public get uvTransform_2(): Vector4 {
        return this.renderShader.uniforms[`transformUV2`].vector4;
    }

    /**
     * Set uvTransform_2
     */
    public set uvTransform_2(value: Vector4) {
        this.renderShader.uniforms[`transformUV2`].vector4 = value;
        this.notifyPropertyChange(`uvTransform_2`, value);
    }

    constructor() {
        super();
        this.instanceID = UUID();
        this.renderPasses = new Map<RendererType, MaterialPass[]>();
    }

    protected notifyPropertyChange(property: string, value: any) {
        // this.renderPasses.forEach((v, k) => {
        //     v.forEach((v2) => {
        //         if (v2 != this) {
        //             v2[property] = value;
        //         }
        //     })
        // });
    }

    /**
    * Enable/Disable the definition of shaders
    * @param {string} define key
    * @param {boolean} [value=true] values
    * @memberof MaterialBase
    */
    public setDefine(define: string, bool: boolean) {
        this.renderShader.setDefine(define, true);
    }

    public hasPass(passType: RendererType) {
        return this.renderPasses.has(passType);
    }

    public addPass(passType: RendererType, pass: MaterialPass, index: number = -1): MaterialPass[] {
        if (!this.renderPasses.has(passType)) this.renderPasses.set(passType, []);

        let passList = this.renderPasses.get(passType);

        let has = passList.indexOf(pass) != -1;
        if (!has) {
            if (index == -1) {
                passList.push(pass);
            } else {
                passList.splice(index, -1, pass);
            }
        }
        return passList;
    }

    public removePass(passType: RendererType, index: number) {
        if (this.renderPasses.has(passType)) {
            let list = this.renderPasses.get(passType);
            if (index < list.length) {
                list.splice(index, 1);
            }
        }
    }


    /**
     * destroy self
     */
    public destroy(): void {
        super.destroy();
    }


    /**
     * clone one material
     * @returns Material
     */
    public clone() {
        return null;
    }

}

registerMaterial("MaterialBase", MaterialBase);