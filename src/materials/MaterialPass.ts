import { Color, Texture, UniformValue, Vector2, Vector3, Vector4 } from "..";
import { GPUCullMode } from "../gfx/graphics/webGpu/WebGPUConst";
import { RenderShader } from "../gfx/graphics/webGpu/shader/RenderShader";
import { RendererType } from "../gfx/renderJob/passRenderer/state/RendererType";
import { BlendMode } from "./BlendMode";

export class MaterialPass {

    public subPass: Map<RendererType, RenderShader[]>;
}