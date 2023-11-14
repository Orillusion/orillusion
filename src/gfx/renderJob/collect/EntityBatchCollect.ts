import { RenderNode } from '../../../components/renderer/RenderNode';
import { PassType } from '../passRenderer/state/RendererType';
import { RenderGroup } from './RenderGroup';
/**
 * @internal
 * @group Post
 */
export class EntityBatchCollect {
    public renderGroup: Map<string, RenderGroup>;

    constructor() {
        this.renderGroup = new Map<string, RenderGroup>();
    }

    public collect_add(node: RenderNode) {
        let g_key = '';
        let s_key = '';
        g_key += node.geometry.instanceID;
        for (let i = 0; i < node.materials.length; i++) {
            const mat = node.materials[i];
            s_key += mat.shader.getDefaultColorShader().shaderVariant;
        }
        let key = g_key + s_key;
        if (!this.renderGroup.has(key)) {
            this.renderGroup.set(key, {
                bundleMap: new Map<PassType, GPURenderBundle>(),
                key: key,
                renderNodes: [],
            });
        }
        if (this.renderGroup.get(key).renderNodes.indexOf(node) == -1)
            this.renderGroup.get(key).renderNodes.push(node);
    }
}
