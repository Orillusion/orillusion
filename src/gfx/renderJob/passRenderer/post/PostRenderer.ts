import { Engine3D } from "../../../../Engine3D";
import { ShaderLib } from "../../../../assets/shader/ShaderLib";
import { FullQuad_vert_wgsl } from "../../../../assets/shader/quad/Quad_shader";
import { View3D } from "../../../../core/View3D";
import { ViewQuad } from "../../../../core/ViewQuad";
import { Texture } from "../../../graphics/webGpu/core/texture/Texture";
import { GPUContext } from "../../GPUContext";
import { GBufferFrame } from "../../frame/GBufferFrame";
import { RTFrame } from "../../frame/RTFrame";
import { PostBase } from "../../post/PostBase";
import { RendererBase } from "../RendererBase";
import { PassType } from "../state/PassType";


/**
 * @internal
 * @group Post
 */
export class PostRenderer extends RendererBase {
    public finalQuadView: ViewQuad;
    public postList: Map<string, PostBase>;
    constructor() {
        super();

        this._rendererType = PassType.POST;

        this.postList = new Map<string, PostBase>();

        this.initRenderer();
    }

    public initRenderer() {
        ShaderLib.register("FullQuad_vert_wgsl", FullQuad_vert_wgsl);
        this.finalQuadView = new ViewQuad(`Quad_vert_wgsl`, `Quad_frag_wgsl`, new RTFrame([], []), 0, false);
    }

    public attachPost(view: View3D, post: PostBase) {
        post.postRenderer = this;
        let clsName = post.constructor.name;
        let has = this.postList.get(clsName);
        if (!has) {
            this.postList.set(clsName, post);
            post.onAttach(view);
        }
    }

    public detachPost(view: View3D, post: PostBase): boolean {
        let clsName = post.constructor.name;
        let has = this.postList.get(clsName);
        if (has) {
            this.postList.delete(clsName);
            post.onDetach(view);
            post.postRenderer = null;
        }
        return has != null;
    }

    public render(view: View3D) {

        this.postList.forEach((v) => {
            if (v.enable) {
                v.compute(view);
            }
        });

        let command = GPUContext.beginCommandEncoder();
        this.postList.forEach((v) => {
            if (v.enable) {
                v.render(view, command);
            }
        });
        GPUContext.endCommandEncoder(command);
    }

    public presentContent(view: View3D, texture: Texture) {
        let command = GPUContext.beginCommandEncoder();
        this.finalQuadView.renderToViewQuad(view, this.finalQuadView, command, texture);
        GPUContext.endCommandEncoder(command);
    }

}
