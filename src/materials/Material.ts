import { BlendMode, Color, Engine3D, GPUCompareFunction, StorageGPUBuffer, Texture, UniformGPUBuffer, Vector2, Vector3, Vector4 } from "..";
import { RenderShader } from "../gfx/graphics/webGpu/shader/RenderShader";
import { RendererType } from "../gfx/renderJob/passRenderer/state/RendererType";

export class Material {

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

    public enable: boolean = true;

    private _defaultPass: RenderShader;

    private _renderPasses: Map<RendererType, RenderShader[]>;

    private _depthCompare: GPUCompareFunction = GPUCompareFunction.less;

    constructor() {
        this._renderPasses = new Map<RendererType, RenderShader[]>();
    }

    public get depthCompare(): GPUCompareFunction {
        return this._depthCompare;
    }

    public set depthCompare(value: GPUCompareFunction) {
        this._depthCompare = value;
        this._defaultPass.depthCompare = value;
    }

    public get defaultPass(): RenderShader {
        return this._defaultPass;
    }

    public set defaultPass(value: RenderShader) {
        this._defaultPass = value;
        this.addPass(RendererType.COLOR, value);
    }

    public get doubleSide(): boolean {
        return this._defaultPass.doubleSide;
    }

    public set doubleSide(value: boolean) {
        this._defaultPass.doubleSide = value;
    }

    public get castShadow(): boolean {
        let colorPass = this.defaultPass;
        return colorPass.shaderState.castShadow;
    }

    public set castShadow(value: boolean) {
        let colorPass = this.defaultPass;
        colorPass.shaderState.castShadow = value;
    }

    public get blendMode(): BlendMode {
        let colorPass = this.defaultPass;
        return colorPass.blendMode;
    }

    public set blendMode(value: BlendMode) {
        let colorPass = this.defaultPass;
        colorPass.blendMode = value;
    }


    public get transparent(): boolean {
        let colorPass = this.defaultPass;
        return colorPass.shaderState.transparent;
    }

    public set transparent(value: boolean) {
        let colorPass = this.defaultPass;
        colorPass.shaderState.transparent = value;
        if (value) {
            colorPass.renderOrder = 3000;
        }
    }

    public get cullMode(): GPUCullMode {
        let colorPass = this.defaultPass;
        return colorPass.cullMode;
    }

    public set cullMode(value: GPUCullMode) {
        let colorPass = this.defaultPass;
        colorPass.cullMode = value;
    }

    /**
     * @param passType 
     * @returns 
     */
    public hasPass(passType: RendererType) {
        return this._renderPasses.has(passType);
    }

    /**
     * get render pass by renderType
     * @param passType 
     * @returns 
     */
    public getPass(passType: RendererType) {
        return this._renderPasses.get(passType);
    }

    /**
     * get all color render pass
     * @returns 
     */
    public getAllPass(): RenderShader[] {
        return this._renderPasses.get(RendererType.COLOR);
    }

    public addPass(passType: RendererType, pass: RenderShader, index: number = -1): RenderShader[] {
        if (!this._renderPasses.has(passType)) this._renderPasses.set(passType, []);

        let passList = this._renderPasses.get(passType);
        if (passType == RendererType.COLOR && passList.length == 0) {
            this._defaultPass = pass;
        }

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
        if (this._renderPasses.has(passType)) {
            let list = this._renderPasses.get(passType);
            if (index < list.length) {
                list.splice(index, 1);
            }
        }
    }

    /**
     * clone one material
     * @returns Material
     */
    public clone() {
        return null;
    }

    protected _shader: RenderShader;
    public set shader(shader: RenderShader) {
        this._shader = shader;
        this.defaultPass = shader;
    }

    public get shader(): RenderShader {
        return this._shader;
    }

    destroy(force: boolean) {
        for (const iterator of this._renderPasses) {
            let passList = iterator[1];
            for (const pass of passList) {
                for (const textureName in pass.textures) {
                    if (textureName.indexOf("defaultOri") == -1) {
                        let texture = pass.textures[textureName];
                        texture.destroy(force);
                    }
                }
            }
        }
    }

    public setTexture(propertyName: string, texture: Texture) {
        for (const iterator of this._renderPasses) {
            let passList = iterator[1];
            for (const pass of passList) {
                pass.setTexture(propertyName, texture);
            }
        }
    }

    public setStorageBuffer(propertyName: string, buffer: StorageGPUBuffer) {
        for (const iterator of this._renderPasses) {
            let passList = iterator[1];
            for (const pass of passList) {
                pass.setStorageBuffer(propertyName, buffer);
            }
        }
    }

    public setUniformBuffer(propertyName: string, buffer: UniformGPUBuffer) {
        for (const iterator of this._renderPasses) {
            let passList = iterator[1];
            for (const pass of passList) {
                pass.setUniformBuffer(propertyName, buffer);
            }
        }
    }


    public setFloat(propertyName: string, value: number) {
        for (const iterator of this._renderPasses) {
            let passList = iterator[1];
            for (const pass of passList) {
                pass.setUniform(propertyName, value);
            }
        }
    }

    public setVector2(propertyName: string, value: Vector2) {
        for (const iterator of this._renderPasses) {
            let passList = iterator[1];
            for (const pass of passList) {
                pass.setUniformVector2(propertyName, value);
            }
        }
    }

    public setVector3(propertyName: string, value: Vector3) {
        for (const iterator of this._renderPasses) {
            let passList = iterator[1];
            for (const pass of passList) {
                pass.setUniformVector3(propertyName, value);
            }
        }
    }

    public setVector4(propertyName: string, value: Vector4) {
        for (const iterator of this._renderPasses) {
            let passList = iterator[1];
            for (const pass of passList) {
                pass.setUniformVector4(propertyName, value);
            }
        }
    }

    public setColor(propertyName: string, value: Color) {
        for (const iterator of this._renderPasses) {
            let passList = iterator[1];
            for (const pass of passList) {
                pass.setUniformColor(propertyName, value);
            }
        }
    }
}