import { RenderNode } from '../../../components/renderer/RenderNode';
import { PassType } from '../passRenderer/state/RendererType';
/**
 * @internal
 * @group Post
 */
export type RenderGroup = {
    key: string;
    bundleMap: Map<PassType, GPURenderBundle>;
    renderNodes: RenderNode[];
};
