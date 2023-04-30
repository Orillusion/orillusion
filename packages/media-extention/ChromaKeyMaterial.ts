import { Engine3D, MaterialBase, ShaderLib, Vector4, Color, BlendMode, registerMaterial } from "@orillusion/core";
import ChromaKeyShader from "./ChromaKeyShader.wgsl?raw";

/**
 * Video 材质(ChromaKey)
 * 不计算光照，仅通过Video像素颜色渲染的基础材质，并且过滤了背景色.
 * @group Material
 */
export class ChromaKeyMaterial extends MaterialBase {

        /**
         * 创建新的Video材质对象
         */
        constructor() {
                super();
                ShaderLib.register("ChromaKeyShader", ChromaKeyShader);
                let shader = this.setShader(`ChromaKeyShader`, `ChromaKeyShader`);
                shader.setShaderEntry(`VertMain`, `FragMain`)

                shader.setUniformVector4(`transformUV1`, new Vector4(0, 0, 1, 1));
                shader.setUniformVector4(`transformUV2`, new Vector4(0, 0, 1, 1));
                shader.setUniformColor(`baseColor`, new Color());
                shader.setUniformVector4(`rectClip`, new Vector4(0, 0, 0, 0));
                shader.setUniformFloat(`alphaCutoff`, 0.5);

                shader.setUniformColor(`keyColor`, new Color(0, 1, 0, 0));
                shader.setUniformFloat(`colorCutoff`, 0.4);
                shader.setUniformFloat(`colorFeathering`, 0.5);
                shader.setUniformFloat(`maskFeathering`, 1);
                shader.setUniformFloat(`sharpening`, 0.5);
                shader.setUniformFloat(`despoil`, 0.6);
                shader.setUniformFloat(`despoilLuminanceAdd`, 0);

                let shaderState = shader.shaderState;
                shaderState.acceptShadow = false;
                shaderState.receiveEnv = false;
                shaderState.acceptGI = false;
                shaderState.useLight = false;
                shaderState.castShadow = false;
                shaderState.useZ = false;
                shaderState.blendMode = BlendMode.ALPHA;

                // default value
                this.baseMap = Engine3D.res.whiteTexture;
        }

        public set rectClip(value: Vector4) {
                this.renderShader.uniforms[`rectClip`].vector4 = value;
        }

        public get rectClip(): Vector4 {
                return this.renderShader.uniforms[`rectClip`].vector4;
        }

        /**
         * 背景关键色
         */
        public set keyColor(value: Color) {
                this.renderShader.uniforms[`keyColor`].color = value;
        }

        /**
         * 背景关键色
         */
        public get keyColor(): Color {
                return this.renderShader.uniforms[`keyColor`].color;
        }

        /**
         * 颜色裁剪系数
         */
        public set colorCutoff(value: number) {
                this.renderShader.uniforms[`colorCutoff`].value = value;
        }

        /**
         * 颜色裁剪系数
         */
        public get colorCutoff(): number {
                return this.renderShader.uniforms[`colorCutoff`].value;
        }

        /**
         * 颜色羽化系数
         */
        public set colorFeathering(value: number) {
                this.renderShader.uniforms[`colorFeathering`].value = value;
        }

        /**
         * 颜色羽化系数
         */
        public get colorFeathering(): number {
                return this.renderShader.uniforms[`colorFeathering`].value;
        }

        /**
         * 遮罩羽化系数
         */
        public set maskFeathering(value: number) {
                this.renderShader.uniforms[`maskFeathering`].value = value;
        }

        /**
         * 遮罩羽化系数
         */
        public get maskFeathering(): number {
                return this.renderShader.uniforms[`maskFeathering`].value;
        }

        /**
         * 锐化系数
         */
        public set sharpening(value: number) {
                this.renderShader.uniforms[`sharpening`].value = value;
        }

        /**
         * 锐化系数
         */
        public get sharpening(): number {
                return this.renderShader.uniforms[`sharpening`].value;
        }

        /**
         * 消除系数
         */
        public set despoil(value: number) {
                this.renderShader.uniforms[`despoil`].value = value;
        }

        /**
         * 消除系数
         */
        public get despoil(): number {
                return this.renderShader.uniforms[`despoil`].value;
        }

        /**
         * 光场消除系数
         */
        public set despoilLuminanceAdd(value: number) {
                this.renderShader.uniforms[`despoilLuminanceAdd`].value = value;
        }

        /**
         * 光场消除系数
         */
        public get despoilLuminanceAdd(): number {
                return this.renderShader.uniforms[`despoilLuminanceAdd`].value;
        }

        /**
         * 启用GUI调试
         */
        debug() {
        }
}

registerMaterial('ChromaKeyMaterial', ChromaKeyMaterial);