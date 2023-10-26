import { StorageGPUBuffer } from "../gfx/graphics/webGpu/core/buffer/StorageGPUBuffer";
import { UniformGPUBuffer } from "../gfx/graphics/webGpu/core/buffer/UniformGPUBuffer";
import { Texture } from "../gfx/graphics/webGpu/core/texture/Texture";
import { RenderShaderPass } from "../gfx/graphics/webGpu/shader/RenderShaderPass";
import { PassType } from "../gfx/renderJob/passRenderer/state/RendererType";
import { Shader } from "../gfx/graphics/webGpu/shader/Shader";
import { Color } from "../math/Color";
import { Vector2 } from "../math/Vector2";
import { Vector3 } from "../math/Vector3";
import { Vector4 } from "../math/Vector4";
import { BlendMode } from "./BlendMode";

export class Material {

    /**
     *
     * Material Unique Identifier
     */
    public instanceID: string;

    /**
      *
      * name of this material
      */
    public name: string;

    public enable: boolean = true;

    private _defaultSubShader: RenderShaderPass;

    protected _shader: Shader;

    constructor() {
    }

    public set shader(shader: Shader) {
        this._shader = shader;
        this._defaultSubShader = shader.getDefaultShaders()[0];
    }

    public get shader(): Shader {
        return this._shader;
    }

    public get doubleSide(): boolean {
        return this._defaultSubShader.doubleSide;
    }

    public set doubleSide(value: boolean) {
        this._defaultSubShader.doubleSide = value;
    }

    public get castShadow(): boolean {
        return this._defaultSubShader.shaderState.castShadow;
    }

    public set castShadow(value: boolean) {
        this._defaultSubShader.shaderState.castShadow = value;
    }

    public get blendMode(): BlendMode {
        return this._defaultSubShader.blendMode;
    }

    public set blendMode(value: BlendMode) {
        this._defaultSubShader.blendMode = value;
    }

    public get depthCompare(): GPUCompareFunction {
        return this._defaultSubShader.depthCompare;
    }

    public set depthCompare(value: GPUCompareFunction) {
        this._defaultSubShader.depthCompare = value;
    }


    public get transparent(): boolean {
        return this._defaultSubShader.shaderState.transparent;
    }

    public set transparent(value: boolean) {
        this._defaultSubShader.shaderState.transparent = value;
        if (value) {
            this._defaultSubShader.renderOrder = 3000;
        }
    }

    public get cullMode(): GPUCullMode {
        return this._defaultSubShader.cullMode;
    }

    public set cullMode(value: GPUCullMode) {
        this._defaultSubShader.cullMode = value;
    }

    public get depthWriteEnabled(): boolean {
        return this._defaultSubShader.depthWriteEnabled;
    }

    public set depthWriteEnabled(value: boolean) {
        this._defaultSubShader.depthWriteEnabled = value;
    }

    public set useBillboard(value: boolean) {
        this._defaultSubShader.setDefine("USE_BILLBOARD", value);
    }

    /**
     * get render pass by renderType
     * @param passType 
     * @returns 
     */
    public getPass(passType: PassType) {
        return this._shader.getSubShaders(passType);
    }

    /**
     * get all color render pass
     * @returns 
     */
    public getAllPass(): RenderShaderPass[] {
        return this._shader.getSubShaders(PassType.COLOR);
    }

    /**
     * clone one material
     * @returns Material
     */
    public clone() {
        let newMat = new Material();
        newMat.shader = this.shader.clone();
        return newMat;
    }


    destroy(force: boolean) {
        this._shader.destroy();
        this._shader = null;
    }


    public setDefine(define: string, value: boolean) {
        this.shader.setDefine(define, value);
    }

    public setTexture(propertyName: string, texture: Texture) {
        this._shader.setTexture(propertyName, texture);
    }

    public setStorageBuffer(propertyName: string, buffer: StorageGPUBuffer) {
        this._shader.setStorageBuffer(propertyName, buffer);
    }

    public setUniformBuffer(propertyName: string, buffer: UniformGPUBuffer) {
        this._shader.setStorageBuffer(propertyName, buffer);
    }


    public setUniformFloat(propertyName: string, value: number) {
        this._shader.setUniformFloat(propertyName, value);
    }

    public setUniformVector2(propertyName: string, value: Vector2) {
        this._shader.setUniformVector2(propertyName, value);
    }

    public setUniformVector3(propertyName: string, value: Vector3) {
        this._shader.setUniformVector3(propertyName, value);
    }

    public setUniformVector4(propertyName: string, value: Vector4) {
        this._shader.setUniformVector4(propertyName, value);
    }

    public setUniformColor(propertyName: string, value: Color) {
        this._shader.setUniformColor(propertyName, value);
    }

    public getUniformFloat(str: string) {
        return this._shader.getUniform(str).data;
    }

    public getUniformV2(str: string): Vector2 {
        return this._shader.getUniformVector2(str);
    }

    public getUniformV3(str: string): Vector3 {
        return this._shader.getUniformVector3(str);
    }

    public getUniformV4(str: string): Vector4 {
        return this._shader.getUniformVector4(str);
    }

    public getUniformColor(str: string) {
        return this._shader.getUniformColor(str);
    }

    public getTexture(str: string) {
        return this._shader.getTexture(str);
    }

    public getStorageBuffer(str: string) {
        return this._shader.getStorageBuffer(str);
    }

    public getStructStorageBuffer(str: string) {
        return this._shader.getStructStorageBuffer(str);
    }

    public getUniformBuffer(str: string) {
        return this._shader.getUniformBuffer(str);
    }

    public applyUniform() {
        this._shader.applyUniform();
    }
}