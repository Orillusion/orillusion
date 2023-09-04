import { Engine3D, ShaderLib, Vector4, Color, BlendMode, Material, RenderShader, Texture } from "@orillusion/core";
import ChromaKeyShader from "./ChromaKeyShader.wgsl?raw";

/**
 * ChromaKey Material
 * Do not compute light, only read pixel color from a video source with a background color filter
 * @group Material
 */
export class ChromaKeyMaterial extends Material {

        /**
         * Create new ChromaKey material
         */
        constructor() {
                super();

                ShaderLib.register("ChromaKeyShader", ChromaKeyShader);
                this.defaultPass = new RenderShader(`ChromaKeyShader`, `ChromaKeyShader`);
                this.defaultPass.setShaderEntry(`VertMain`, `FragMain`)

                this.defaultPass.setUniformVector4(`transformUV1`, new Vector4(0, 0, 1, 1));
                this.defaultPass.setUniformVector4(`transformUV2`, new Vector4(0, 0, 1, 1));
                this.defaultPass.setUniformColor(`baseColor`, new Color());
                this.defaultPass.setUniformVector4(`rectClip`, new Vector4(0, 0, 0, 0));
                this.defaultPass.setUniformFloat(`alphaCutoff`, 0.5);

                this.defaultPass.setUniformColor(`keyColor`, new Color(0, 1, 0, 0));
                this.defaultPass.setUniformFloat(`colorCutoff`, 0.4);
                this.defaultPass.setUniformFloat(`colorFeathering`, 0.5);
                this.defaultPass.setUniformFloat(`maskFeathering`, 1);
                this.defaultPass.setUniformFloat(`sharpening`, 0.5);
                this.defaultPass.setUniformFloat(`despoil`, 0.6);
                this.defaultPass.setUniformFloat(`despoilLuminanceAdd`, 0);

                let shaderState = this.defaultPass.shaderState;
                shaderState.acceptShadow = false;
                shaderState.receiveEnv = false;
                shaderState.acceptGI = false;
                shaderState.useLight = false;
                shaderState.castShadow = false;
                shaderState.useZ = false;
                shaderState.blendMode = BlendMode.ALPHA;

                // default value
                this.defaultPass.setTexture(`baseMap`, Engine3D.res.whiteTexture);
        }
        public set baseMap(texture: Texture) {
                this.defaultPass.setTexture(`baseMap`, texture);
        }

        public get baseMap() {
                return this.defaultPass.getTexture(`baseMap`);
        }

        /**
         * Set the clip rect area
         */
        public set rectClip(value: Vector4) {
                this.defaultPass.uniforms[`rectClip`].vector4 = value;
        }

        /**
         * Get current clip rect area
         */
        public get rectClip(): Vector4 {
                return this.defaultPass.uniforms[`rectClip`].vector4;
        }

        /**
         * Set the chromakey color
         */
        public set keyColor(value: Color) {
                this.defaultPass.uniforms[`keyColor`].color = value;
        }

        /**
         * Get the chromakey color
         */
        public get keyColor(): Color {
                return this.defaultPass.uniforms[`keyColor`].color;
        }

        /**
         * Set the color cutoff factor
         */
        public set colorCutoff(value: number) {
                this.defaultPass.uniforms[`colorCutoff`].value = value;
        }

        /**
         * Get the color cutoff factor
         */
        public get colorCutoff(): number {
                return this.defaultPass.uniforms[`colorCutoff`].value;
        }

        /**
         * Set the color feather factor
         */
        public set colorFeathering(value: number) {
                this.defaultPass.uniforms[`colorFeathering`].value = value;
        }

        /**
         * Get the color feather factor
         */
        public get colorFeathering(): number {
                return this.defaultPass.uniforms[`colorFeathering`].value;
        }

        /**
         * Set the mask feather factor
         */
        public set maskFeathering(value: number) {
                this.defaultPass.uniforms[`maskFeathering`].value = value;
        }

        /**
         * Get the mask feather factor
         */
        public get maskFeathering(): number {
                return this.defaultPass.uniforms[`maskFeathering`].value;
        }

        /**
         * Set the sharpen factor
         */
        public set sharpening(value: number) {
                this.defaultPass.uniforms[`sharpening`].value = value;
        }

        /**
         * Get the sharpen factor
         */
        public get sharpening(): number {
                return this.defaultPass.uniforms[`sharpening`].value;
        }

        /**
         * Set the despoil factor
         */
        public set despoil(value: number) {
                this.defaultPass.uniforms[`despoil`].value = value;
        }

        /**
         * Get the despoil factor
         */
        public get despoil(): number {
                return this.defaultPass.uniforms[`despoil`].value;
        }

        /**
         * Set the despoil luminance factor
         */
        public set despoilLuminanceAdd(value: number) {
                this.defaultPass.uniforms[`despoilLuminanceAdd`].value = value;
        }

        /**
         * Get the despoil luminance factor
         */
        public get despoilLuminanceAdd(): number {
                return this.defaultPass.uniforms[`despoilLuminanceAdd`].value;
        }

        /**
         * Show a debug GUI
         */
        debug() {
        }
}
