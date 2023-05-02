import { Engine3D, MaterialBase, ShaderLib, Vector4, Color, BlendMode, registerMaterial } from "@orillusion/core";
import ChromaKeyShader from "./ChromaKeyShader.wgsl?raw";

/**
 * ChromaKey Material
 * Do not compute light, only read pixel color from a video source with a background color filter
 * @group Material
 */
export class ChromaKeyMaterial extends MaterialBase {

        /**
         * Create new ChromaKey material
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

        /**
         * Set the clip rect area
         */
        public set rectClip(value: Vector4) {
                this.renderShader.uniforms[`rectClip`].vector4 = value;
        }

        /**
         * Get current clip rect area
         */
        public get rectClip(): Vector4 {
                return this.renderShader.uniforms[`rectClip`].vector4;
        }

        /**
         * Set the chromakey color
         */
        public set keyColor(value: Color) {
                this.renderShader.uniforms[`keyColor`].color = value;
        }

        /**
         * Get the chromakey color
         */
        public get keyColor(): Color {
                return this.renderShader.uniforms[`keyColor`].color;
        }

        /**
         * Set the color cutoff factor
         */
        public set colorCutoff(value: number) {
                this.renderShader.uniforms[`colorCutoff`].value = value;
        }

        /**
         * Get the color cutoff factor
         */
        public get colorCutoff(): number {
                return this.renderShader.uniforms[`colorCutoff`].value;
        }

        /**
         * Set the color feather factor
         */
        public set colorFeathering(value: number) {
                this.renderShader.uniforms[`colorFeathering`].value = value;
        }

        /**
         * Get the color feather factor
         */
        public get colorFeathering(): number {
                return this.renderShader.uniforms[`colorFeathering`].value;
        }

        /**
         * Set the mask feather factor
         */
        public set maskFeathering(value: number) {
                this.renderShader.uniforms[`maskFeathering`].value = value;
        }

        /**
         * Get the mask feather factor
         */
        public get maskFeathering(): number {
                return this.renderShader.uniforms[`maskFeathering`].value;
        }

        /**
         * Set the sharpen factor
         */
        public set sharpening(value: number) {
                this.renderShader.uniforms[`sharpening`].value = value;
        }

        /**
         * Get the sharpen factor
         */
        public get sharpening(): number {
                return this.renderShader.uniforms[`sharpening`].value;
        }

        /**
         * Set the despoil factor
         */
        public set despoil(value: number) {
                this.renderShader.uniforms[`despoil`].value = value;
        }

        /**
         * Get the despoil factor
         */
        public get despoil(): number {
                return this.renderShader.uniforms[`despoil`].value;
        }

        /**
         * Set the despoil luminance factor
         */
        public set despoilLuminanceAdd(value: number) {
                this.renderShader.uniforms[`despoilLuminanceAdd`].value = value;
        }

        /**
         * Get the despoil luminance factor
         */
        public get despoilLuminanceAdd(): number {
                return this.renderShader.uniforms[`despoilLuminanceAdd`].value;
        }

        /**
         * Show a debug GUI
         */
        debug() {
        }
}

registerMaterial('ChromaKeyMaterial', ChromaKeyMaterial);