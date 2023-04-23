import { Quad_shader, RendererType, RTFrame, RTResourceConfig, ShaderLib, View3D } from '../../../../..';
import { Camera3D } from '../../../../core/Camera3D';
import { Scene3D } from '../../../../core/Scene3D';
import { ViewQuad } from '../../../../core/ViewQuad';
import { Engine3D } from '../../../../Engine3D';
import { GPUTextureFormat } from '../../../graphics/webGpu/WebGPUConst';
import { GPUContext } from '../../GPUContext';
import { RTResourceMap } from '../../frame/RTResourceMap';
import { PostBase } from '../../post/PostBase';
import { RendererBase } from '../RendererBase';

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
        ShaderLib.register("FullQuad_vert_wgsl", Quad_shader.FullQuad_vert_wgsl);
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
        GPUContext.renderToViewQuad(view, this.finalQuadView, command, lastTexture);
        {
            if (this.debugViewQuads.length) {
                let debugIndex = Engine3D.setting.render.debugQuad;
                if (debugIndex >= 0) GPUContext.renderToViewQuad(view, this.debugViewQuads[debugIndex], command, this.debugTextures[debugIndex]);
            }
        }
        GPUContext.endCommandEncoder(command);
    }
}
