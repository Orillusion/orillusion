import { RenderNode } from '../../../components/renderer/RenderNode';
import { RendererType } from '../passRenderer/state/RendererType';
/**
 * @internal
 * @group Post
 */
export type RenderGroup = {
    key: string;
    bundleMap: Map<RendererType, GPURenderBundle>;
    renderNodes: RenderNode[];
};
