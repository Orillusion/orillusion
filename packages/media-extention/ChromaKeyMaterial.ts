import { Engine3D, ShaderLib, Vector4, Color, BlendMode, registerMaterial, Material, RenderShaderPass, Texture, Shader, PassType } from "@orillusion/core";
import { ChromaKeyShader } from "./ChromaKeyShader";

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
        let newShader = new Shader();

        let colorPass = new RenderShaderPass(
            `ChromaKeyShader`,
            `ChromaKeyShader`
        );
        colorPass.setShaderEntry(`VertMain`, `FragMain`);
        colorPass.passType = PassType.COLOR;

        colorPass.setUniformVector4(
            `transformUV1`,
            new Vector4(0, 0, 1, 1)
        );
        colorPass.setUniformVector4(
            `transformUV2`,
            new Vector4(0, 0, 1, 1)
        );
        colorPass.setUniformColor(`baseColor`, new Color());
        colorPass.setUniformVector4(`rectClip`, new Vector4(0, 0, 0, 0));
        colorPass.setUniformFloat(`alphaCutoff`, 0.5);

        colorPass.setUniformColor(`keyColor`, new Color(0, 1, 0, 0));
        colorPass.setUniformFloat(`colorCutoff`, 0.4);
        colorPass.setUniformFloat(`colorFeathering`, 0.5);
        colorPass.setUniformFloat(`maskFeathering`, 1);
        colorPass.setUniformFloat(`sharpening`, 0.5);
        colorPass.setUniformFloat(`despoil`, 0.6);
        colorPass.setUniformFloat(`despoilLuminanceAdd`, 0);

        newShader.addRenderPass(colorPass);

        let shaderState = colorPass.shaderState;
        shaderState.acceptShadow = false;
        shaderState.receiveEnv = false;
        shaderState.acceptGI = false;
        shaderState.useLight = false;
        shaderState.castShadow = false;
        shaderState.useZ = false;
        shaderState.blendMode = BlendMode.ALPHA;
        this.shader = newShader;
        
        // default value
        this.shader.setTexture(`baseMap`, Engine3D.res.whiteTexture);
    }

    public set baseMap(value: Texture) {
        this.shader.setTexture(`baseMap`, value);
    }

    public get baseMap() {
        return this.shader.getTexture(`baseMap`);
    }

    /**
     * Set the clip rect area
     */
    public set rectClip(value: Vector4) {
        this.shader.setUniformVector4(`rectClip`, value);
    }

    /**
     * Get current clip rect area
     */
    public get rectClip(): Vector4 {
        return this.shader.getUniformVector4(`rectClip`);
    }

    /**
     * Set the chromakey color
     */
    public set keyColor(value: Color) {
        this.shader.setUniformColor(`keyColor`, value);
    }

    /**
     * Get the chromakey color
     */
    public get keyColor(): Color {
        return this.shader.getUniformColor(`keyColor`);
    }

    /**
     * Set the color cutoff factor
     */
    public set colorCutoff(value: number) {
        this.shader.setUniformFloat(`colorCutoff`, value);
    }

    /**
     * Get the color cutoff factor
     */
    public get colorCutoff(): number {
        return this.shader.getUniformFloat(`colorCutoff`);
    }

    /**
     * Set the color feather factor
     */
    public set colorFeathering(value: number) {
        this.shader.setUniformFloat(`colorFeathering`, value);
    }

    /**
     * Get the color feather factor
     */
    public get colorFeathering(): number {
        return this.shader.getUniformFloat(`colorFeathering`);
    }

    /**
     * Set the mask feather factor
     */
    public set maskFeathering(value: number) {
        this.shader.setUniformFloat(`maskFeathering`, value);
    }

    /**
     * Get the mask feather factor
     */
    public get maskFeathering(): number {
        return this.shader.getUniformFloat(`maskFeathering`);
    }

    /**
     * Set the sharpen factor
     */
    public set sharpening(value: number) {
        this.shader.setUniformFloat(`sharpening`, value);
    }

    /**
     * Get the sharpen factor
     */
    public get sharpening(): number {
        return this.shader.getUniformFloat(`sharpening`);
    }

    /**
     * Set the despoil factor
     */
    public set despoil(value: number) {
        this.shader.setUniformFloat(`despoil`, value);
    }

    /**
     * Get the despoil factor
     */
    public get despoil(): number {
        return this.shader.getUniformFloat(`despoil`);
    }

    /**
     * Set the despoil luminance factor
     */
    public set despoilLuminanceAdd(value: number) {
        this.shader.setUniformFloat(`despoilLuminanceAdd`, value);
    }

    /**
     * Get the despoil luminance factor
     */
    public get despoilLuminanceAdd(): number {
        return this.shader.getUniformFloat(`despoilLuminanceAdd`);
    }

    /**
     * Show a debug GUI
     */
    debug() { }
}
