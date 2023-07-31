import { RenderNode } from '../../../components/renderer/RenderNode';
import { Octree } from '../../../core/tree/octree/Octree';
/**
 * @internal
 * @group Post
 */
export class CollectInfo {
    public opaqueList: RenderNode[] = [];
    public transparentList: RenderNode[] = [];
    public offset: number = 0;
    public sky: RenderNode;
    public opTree: Octree;
    public trTree: Octree;
    public clean() {
        this.opaqueList.length = 0;
        this.transparentList.length = 0;
        this.offset = 0;
    }
}
