import { RenderNode } from '../../../components/renderer/RenderNode';
import { KDTreeEntity } from '../kdTree/KDTreeEntity';
/**
 * @internal
 * @group Core
 */
export class IKDTreeUserData {
    get data(): RenderNode {
        return null;
    }
    entity: KDTreeEntity;
}
