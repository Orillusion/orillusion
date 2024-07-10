import { RenderNode } from '../../../components/renderer/RenderNode';
import { PassType } from '../passRenderer/state/PassType';
/**
 * @internal
 * @group Post
 */
export type RenderGroup = {
    key: string;
    bundleMap: Map<PassType, GPURenderBundle>;
    renderNodes: RenderNode[];
};
