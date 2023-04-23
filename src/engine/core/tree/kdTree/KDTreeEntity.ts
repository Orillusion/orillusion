
import { Ray } from '../../../math/Ray';
import { Vector3 } from '../../../math/Vector3';
import { BoundingBox } from '../../bound/BoundingBox';
import { IKDTreeUserData } from './IKDTreeUserData';
import { KDTreeNode, KDTreeUUID } from './KDTreeNode';
/**
 * @internal
 * @group Core
 */
export class KDTreeEntity extends KDTreeUUID {
    public readonly userData: IKDTreeUserData;
    public node: KDTreeNode;

    public constructor(data: IKDTreeUserData) {
        super();
        this.userData = data;
    }

    public centerValue(dimension: string): number {
        return 0;
    }

    public isInNode(node: KDTreeNode, dimension: string): boolean {
        return false;
    }

    public entityContainPoint(point: { [p: string]: number }): boolean {
        return false;
    }

    public squareDistanceTo(point: { [p: string]: number }, dimensions: string[]): number {
        return Number.MAX_VALUE;
    }

    public entityIntersectsBox(box: BoundingBox): boolean {
        return false;
    }

    public entityIntersectsRay(ray: Ray, target: Vector3): boolean {
        return false;
    }

    public attachTreeNode(node: KDTreeNode): boolean {
        if (this.node) this.detachTreeNode();
        this.node = node;
        return this.node.pushEntity(this);
    }

    public detachTreeNode(): boolean {
        let success = this.node.removeEntity(this);
        this.node = null;
        return success;
    }

    public updateNode(root: KDTreeNode): void {
        let lastNode = this.node;
        if (lastNode) this.detachTreeNode();
        root.updateEntity(this);
        if (lastNode) lastNode.autoClear();
    }
}
