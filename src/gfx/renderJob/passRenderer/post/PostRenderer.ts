import { Engine3D } from "../../../../Engine3D";
import { ShaderLib } from "../../../../assets/shader/ShaderLib";
import { FullQuad_vert_wgsl } from "../../../../assets/shader/quad/Quad_shader";
import { View3D } from "../../../../core/View3D";
import { ViewQuad } from "../../../../core/ViewQuad";
import { GPUContext } from "../../GPUContext";
import { RTFrame } from "../../frame/RTFrame";
import { PostBase } from "../../post/PostBase";
import { RendererBase } from "../RendererBase";
import { RendererType } from "../state/RendererType";


/**
 * @internal
 * @group Post
 */
export class PostRenderer extends RendererBase {
    public finalQuadView: ViewQuad;
    public postList: PostBase[];
    constructor() {
        super();

        this._rendererType = RendererType.POST;

        this.postList = [];

        this.initRenderer();
    }

    public initRenderer() {
        ShaderLib.register("FullQuad_vert_wgsl", FullQuad_vert_wgsl);
        this.finalQuadView = new ViewQuad(`Quad_vert_wgsl`, `Quad_frag_wgsl`, new RTFrame([], []), null, null, false);
    }

    public attachPost(view: View3D, post: PostBase) {
        post.postRenderer = this;
        let has = this.postList.indexOf(post) != -1;
        if (!has) {
            this.postList.push(post);
            post.onAttach(view);
        }
    }

    public detachPost(view: View3D, post: PostBase): boolean {
        let index = this.postList.indexOf(post);
        if (index >= 0) {
            this.postList.splice(index, 1);
            post.onDetach(view);
            post.postRenderer = null;
        }
        return index >= 0;
    }

    public render(view: View3D) {
        let command = GPUContext.beginCommandEncoder();
        for (let i = 0; i < this.postList.length; i++) {
            const post = this.postList[i];
            if (!post.enable) continue;
            post.render(view, command);
        }

        let lastTexture = GPUContext.lastRenderPassState.getLastRenderTexture();
        this.finalQuadView.renderToViewQuad(view, this.finalQuadView, command, lastTexture);
        {
            if (this.debugViewQuads.length) {
                let debugIndex = Engine3D.setting.render.debugQuad;
                if (debugIndex >= 0) this.debugViewQuads[debugIndex].renderToViewQuad(view, this.debugViewQuads[debugIndex], command, this.debugTextures[debugIndex]);
            }
        }
        GPUContext.endCommandEncoder(command);
    }
}
