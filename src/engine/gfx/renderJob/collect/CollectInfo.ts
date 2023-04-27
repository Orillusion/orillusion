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
        this.opaqueList.length = 0;
        this.transparentList.length = 0;
        this.offset = 0;
    }
}
