import { RenderShaderCompute } from "../compute/RenderShaderCompute";
import { GPUBufferBase } from "../core/buffer/GPUBufferBase";
import { StorageGPUBuffer } from "../core/buffer/StorageGPUBuffer";
import { StructStorageGPUBuffer } from "../core/buffer/StructStorageGPUBuffer";
import { UniformGPUBuffer } from "../core/buffer/UniformGPUBuffer";
import { Texture } from "../core/texture/Texture";
import { RenderShaderPass } from "./RenderShaderPass";
import { UniformValue } from "./value/UniformValue";
import { PassType } from "../../../renderJob/passRenderer/state/RendererType";
import { Color } from "../../../../math/Color";
import { Vector2 } from "../../../../math/Vector2";
import { Vector3 } from "../../../../math/Vector3";
import { Vector4 } from "../../../../math/Vector4";
import { Struct } from "../../../../util/struct/Struct";

export class Shader {


    public computes: RenderShaderCompute[];

    public passShader: Map<PassType, RenderShaderPass[]>;

    constructor() {
        this.computes = [];
        this.passShader = new Map<PassType, RenderShaderPass[]>();
    }

    public addRenderPass(renderShader: RenderShaderPass, index: number = -1) {
        let subShader: RenderShaderPass[] = this.passShader.get(renderShader.passType) || [];
        if (index == -1) {
            subShader.push(renderShader);
        } else {
            subShader.splice(index, -1, renderShader);
        }
        this.passShader.set(renderShader.passType, subShader);
    }

    public removeShader(renderShader: RenderShaderPass, index: number = -1) {
        let subShader: RenderShaderPass[] = this.passShader.get(renderShader.passType);
        if (subShader) {
            if (index == -1) {
                let index = subShader.indexOf(renderShader);
                if (index != -1) {
                    subShader.splice(index);
                }
            } else {
                subShader.splice(index, 1);
            }
        }
    }

    public removeShaderByIndex(passType: PassType, index: number = -1) {
        let subShader: RenderShaderPass[] = this.passShader.get(passType);
        if (subShader) {
            if (index == -1) {
                this.passShader.delete(passType);
            } else {
                subShader.splice(index, 1);
            }
        }
    }

    public getSubShaders(passType: PassType): RenderShaderPass[] {
        return this.passShader.get(passType) || [];
    }

    public hasSubShaders(passType: PassType): boolean {
        let subs = this.passShader.get(passType);
        return subs.length > 0;
    }

    public getDefaultShaders(): RenderShaderPass[] {
        return this.passShader.get(PassType.COLOR);
    }

    public getDefaultColorShader(): RenderShaderPass {
        return this.passShader.get(PassType.COLOR)[0];
    }

    public setDefine(arg0: string, arg1: boolean) {
        for (const pass of this.passShader) {
            for (const rd of pass[1]) {
                rd.setDefine(arg0, arg1);
            }
        }
    }

    public deleteDefine(arg0: string) {
        for (const pass of this.passShader) {
            for (const rd of pass[1]) {
                rd.deleteDefine(arg0);
            }
        }
    }

    public setUniform(arg0: string, arg1: UniformValue) {
        for (const pass of this.passShader) {
            for (const rd of pass[1]) {
                rd.setUniform(arg0, arg1);
            }
        }
    }

    public setUniformFloat(arg0: string, arg1: number) {
        for (const pass of this.passShader) {
            for (const rd of pass[1]) {
                rd.setUniformFloat(arg0, arg1);
            }
        }
    }

    public setUniformVector2(arg0: string, arg1: Vector2) {
        for (const pass of this.passShader) {
            for (const rd of pass[1]) {
                rd.setUniformVector2(arg0, arg1);
            }
        }
    }

    public setUniformVector3(arg0: string, arg1: Vector3) {
        for (const pass of this.passShader) {
            for (const rd of pass[1]) {
                rd.setUniformVector3(arg0, arg1);
            }
        }
    }

    public setUniformVector4(arg0: string, arg1: Vector4) {
        for (const pass of this.passShader) {
            for (const rd of pass[1]) {
                rd.setUniformVector4(arg0, arg1);
            }
        }
    }

    public setUniformColor(arg0: string, arg1: Color) {
        for (const pass of this.passShader) {
            for (const rd of pass[1]) {
                rd.setUniformColor(arg0, arg1);
            }
        }
    }

    public getUniform(arg0: string): any {
        return this.getDefaultColorShader().getUniform(arg0);
    }

    public getUniformFloat(arg0: string): number {
        return this.getDefaultColorShader().getUniformFloat(arg0);
    }

    public getUniformVector2(arg0: string): Vector2 {
        return this.getDefaultColorShader().getUniformVector2(arg0);
    }

    public getUniformVector3(arg0: string): Vector3 {
        return this.getDefaultColorShader().getUniformVector3(arg0);
    }

    public getUniformVector4(arg0: string): Vector4 {
        return this.getDefaultColorShader().getUniformVector4(arg0);
    }

    public getUniformColor(arg0: string): Color {
        return this.getDefaultColorShader().getUniformColor(arg0);
    }

    public setTexture(arg0: string, arg1: Texture) {
        for (const pass of this.passShader) {
            for (const rd of pass[1]) {
                rd.setTexture(arg0, arg1);
            }
        }
        this.setDefine(`USE_${arg0.toLocaleUpperCase()}`, true);
    }

    public getTexture(arg0: string): Texture {
        return this.getDefaultColorShader().textures[arg0];
    }

    public setUniformBuffer(arg0: string, arg1: UniformGPUBuffer) {
        for (const pass of this.passShader) {
            for (const rd of pass[1]) {
                rd.setUniformBuffer(arg0, arg1);
            }
        }
    }

    public getUniformBuffer(arg0: string): GPUBufferBase {
        return this.getDefaultColorShader().getBuffer(arg0);
    }

    public setStorageBuffer(arg0: string, arg1: StorageGPUBuffer) {
        for (const pass of this.passShader) {
            for (const rd of pass[1]) {
                rd.setStorageBuffer(arg0, arg1);
            }
        }
    }

    public getStorageBuffer(arg0: string): StorageGPUBuffer {
        return this.getDefaultColorShader().getBuffer(arg0);
    }

    public setStructStorageBuffer<T extends Struct>(arg0: string, arg1: StructStorageGPUBuffer<T>) {
        for (const pass of this.passShader) {
            for (const rd of pass[1]) {
                rd.setStructStorageBuffer(arg0, arg1);
            }
        }
    }

    public getStructStorageBuffer(arg0: string): GPUBufferBase {
        return this.getDefaultColorShader().getBuffer(arg0);
    }

    public noticeValueChange() {
        for (const pass of this.passShader) {
            for (const rd of pass[1]) {
                rd.noticeValueChange();
            }
        }
    }

    public destroy() {
        this.getDefaultColorShader().destroy();
    }

    public clone() {
        let newShader = new Shader();
        let sourceShaderPassList = this.getDefaultShaders();
        for (const shadePass of sourceShaderPassList) {
            newShader.addRenderPass(shadePass);
        }
        return newShader;
    }

    applyUniform() {
        for (const pass of this.passShader) {
            for (const rd of pass[1]) {
                rd.applyUniform();
            }
        }
    }
}