import { RenderNode } from '../../../components/renderer/RenderNode';
import { Octree } from '../../../core/tree/octree/Octree';
/**
 * @internal
 * @group Post
 */
export class CollectInfo {
    public opaqueList: RenderNode[] = [];
    public transparentList: RenderNode[] = [];
    public sky: RenderNode;
    public clean() {
        this.opaqueList.length = 0;
        this.transparentList.length = 0;
    }
}
