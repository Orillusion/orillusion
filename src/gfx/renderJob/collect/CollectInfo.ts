import { RenderNode } from '../../../components/renderer/RenderNode';
/**
 * @internal
 * @group Post
 */
export class CollectInfo {
    public opaqueList: RenderNode[] = [];
    public transparentList: RenderNode[] = [];
    public offset: number = 0;
    public sky: RenderNode;
    public clean() {
        this.opaqueList = null;
        this.transparentList = null;
        this.offset = 0;
    }
}
