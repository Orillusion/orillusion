
import { Ray } from '../../../math/Ray';
import { Vector3 } from '../../../math/Vector3';
import { BoundingBox } from '../../bound/BoundingBox';
import { IKDTreeUserData } from './IKDTreeUserData';
import { KDTreeEntity } from './KDTreeEntity';
import { KDTreeSpace } from './KDTreeSpace';
/**
 * @internal
 * @group Core
 */
class KDTreeConfig {
    public static readonly MaxEntityCountInLeaf = 4;
    public static readonly MaxLayer = 10;
    public static readonly ClearLeafLayer = KDTreeConfig.MaxLayer - 4;
}
/**
 * @internal
 * @group Core
 */
export class KDTreeUUID {
    private static UUID = 0;
    public readonly uuid: string = '0';
    public constructor() {
        this.uuid = (KDTreeUUID.UUID++).toString();
    }
}
/**
 * @internal
 * @group Core
 */
class KDTreeNodeMap {
    public map: { [key: string]: KDTreeEntity } = {};
    private _count: number = 0;
    public get count(): number {
        return this._count;
    }

    public push(entity: KDTreeEntity): boolean {
        let last = this.map[entity.uuid];
        if (!last) {
            this.map[entity.uuid] = entity;
            this._count++;
            return true;
        }
        return false;
    }

    public remove(uuid: string): boolean {
        let last = this.map[uuid];
        if (last) {
            delete this.map[uuid];
            this._count--;
            return true;
        }
        return false;
    }
}
/**
 * @internal
 * @group Core
 */
export class KDTreeNode extends KDTreeUUID {
    protected _dimensionIndex: number = 0;
    protected _dimensions: string[];
    protected _dimension: string;

    protected _left: KDTreeNode;
    protected _right: KDTreeNode;

    protected _space: KDTreeSpace;
    protected _parent: KDTreeNode;
    protected _entities: KDTreeNodeMap;
    protected readonly layer;

    public get dimension(): string {
        return this._dimension;
    }

    constructor(layer: number = 0) {
        super();
        this.layer = layer;
        KDTreeNode.nodeCount++;
        // console.log('auto create', KDTreeNode.nodeCount);
    }

    public initNode(parent: KDTreeNode, dimensions: string[], index: number): this {
        this._dimensions = dimensions;
        this._dimensionIndex = index;
        this._dimension = dimensions[index];
        this._space = new KDTreeSpace().initSpace(dimensions);
        if (parent) this._space.copySpace(parent._space);
        this._parent = parent;
        this._entities = new KDTreeNodeMap();
        return this;
    }

    public updateEntity(entity: KDTreeEntity): void {
        if (entity.isInNode(this, this._dimension)) {
            entity.attachTreeNode(this);
            this.autoSplit();
            if (this._left && this._right) {
                let nextIndex = (this._dimensionIndex + 1) % this._dimensions.length;
                let nextDimension: string = this._dimensions[nextIndex];
                if (entity.isInNode(this._right, nextDimension)) {
                    this._right.updateEntity(entity);
                } else if (entity.isInNode(this._left, nextDimension)) {
                    this._left.updateEntity(entity);
                }
            }
        }
    }

    public buildRoot(list: IKDTreeUserData[]) {
        for (const obj of list) {
            obj.entity.attachTreeNode(this);
        }
        this.autoSplit();
    }

    private _splitEntityList: KDTreeEntity[] = [];
    protected autoSplit(): void {
        if (this._entities.count > KDTreeConfig.MaxEntityCountInLeaf && !this._right && !this._left && this.layer < KDTreeConfig.MaxLayer) {
            let tempList = this._splitEntityList;
            let nextIndex = (this._dimensionIndex + 1) % this._dimensions.length;
            let nextDimension: string = this._dimensions[nextIndex];
            let divide: number = 0;
            for (const key in this._entities.map) {
                let entity = this._entities.map[key];
                divide += entity.centerValue(nextDimension);
                tempList.push(entity);
            }

            divide /= this._entities.count;
            this._left = new KDTreeNode(this.layer + 1);
            this._right = new KDTreeNode(this.layer + 1);

            this._left.initNode(this, this._dimensions, nextIndex);
            this._right.initNode(this, this._dimensions, nextIndex);
            this._left.setSpace(true, divide);
            this._right.setSpace(false, divide);

            for (let entity of tempList) {
                if (entity.isInNode(this._right, nextDimension)) {
                    entity.attachTreeNode(this._right);
                } else if (entity.isInNode(this._left, nextDimension)) {
                    entity.attachTreeNode(this._left);
                }
            }
        }

        this._left && this._left.autoSplit();
        this._right && this._right.autoSplit();
    }

    protected setSpace(less: boolean, value: number): this {
        if (this._parent) {
            this._space.splitSpace(this._dimension, less, value);
        }
        return this;
    }

    protected isEmpty(): boolean {
        return this._left == null && this._right == null && this._entities.count == 0;
    }

    public pushEntity(entity: KDTreeEntity): boolean {
        return this._entities.push(entity);
    }

    public removeEntity(entity: KDTreeEntity): boolean {
        return this._entities.remove(entity.uuid);
    }

    public static nodeCount: number = 0;
    public autoClear(): void {
        let that: KDTreeNode = this;
        while (that && that.layer > KDTreeConfig.ClearLeafLayer && that.clearLeaf()) {
            that = that._parent;
        }
    }

    protected clearLeaf(): boolean {
        let isEmpty0 = !this._left && !this._right;
        let isEmpty1 = !isEmpty0 && this._left.isEmpty() && this._right.isEmpty();
        if (isEmpty1) {
            this._left = this._right = null;
            KDTreeNode.nodeCount -= 2;
            // console.log('auto clear', KDTreeNode.nodeCount);
        }
        return isEmpty0 || isEmpty1;
    }

    public isContain(value: number): boolean {
        return this._space.isContain(this._dimension, value);
    }

    private static rangeBox: BoundingBox = new BoundingBox(new Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE), new Vector3(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE));
    protected nodeIntersectsBox(box: BoundingBox): boolean {
        let x = this._space.getRange('x');
        let y = this._space.getRange('y');
        let z = this._space.getRange('z');
        let rangeBox = KDTreeNode.rangeBox;
        rangeBox.min.set(x.min, y.min, z.min);
        rangeBox.max.set(x.max, y.max, z.max);
        return rangeBox.intersectsBox(box);
    }

    protected nodeIntersectsRay(ray: Ray): boolean {
        let x = this._space.getRange('x');
        let y = this._space.getRange('y');
        let z = this._space.getRange('z');
        let rangeBox = KDTreeNode.rangeBox;
        rangeBox.min.set(x.min, y.min, z.min);
        rangeBox.max.set(x.max, y.max, z.max);
        // return ray.intersectsBox(rangeBox);
        return true;
    }

    public pointCast(point: { [key: string]: number }, squareDistance: number = 0, ret?: KDTreeEntity[]) {
        ret = ret || [];
        if (this._entities.count > 0) {
            let map: { [key: string]: KDTreeEntity } = this._entities.map;
            for (let key in map) {
                let entity = map[key];
                let success = entity.entityContainPoint(point);
                if (!success && squareDistance > 0) {
                    success = entity.squareDistanceTo(point, this._dimensions) <= squareDistance;
                }
                if (success) {
                    ret.push(entity);
                }
            }
        }
        if (this._left && this._left.isContain(point[this._left.dimension])) {
            this._left.pointCast(point, squareDistance, ret);
        }

        if (this._right && this._right.isContain(point[this._right.dimension])) {
            this._right.pointCast(point, squareDistance, ret);
        }
    }

    public boxCast(box: BoundingBox, ret?: KDTreeEntity[]) {
        ret = ret || [];
        if (this._entities.count > 0) {
            let map: { [key: string]: KDTreeEntity } = this._entities.map;
            for (let key in map) {
                let entity = map[key];
                if (entity.entityIntersectsBox(box)) {
                    ret.push(entity);
                }
            }
        }

        if (this._left && this._left.nodeIntersectsBox(box)) {
            this._left.boxCast(box, ret);
        }

        if (this._right && this._right.nodeIntersectsBox(box)) {
            this._right.boxCast(box, ret);
        }
    }

    private pointIntersect: Vector3 = new Vector3();
    public rayCast(ray: Ray, ret?: KDTreeEntity[], pts?: Vector3[]) {
        ret = ret || [];
        pts = pts || [];
        let target = this.pointIntersect;
        if (this._entities.count > 0) {
            let map: { [key: string]: KDTreeEntity } = this._entities.map;
            for (let key in map) {
                let entity = map[key];
                if (entity.entityIntersectsRay(ray, target)) {
                    pts.push(new Vector3().copyFrom(target));
                    ret.push(entity);
                }
            }
        }

        if (this._left && this._left.nodeIntersectsRay(ray)) {
            this._left.rayCast(ray, ret, pts);
        }

        if (this._right && this._right.nodeIntersectsRay(ray)) {
            this._right.rayCast(ray, ret, pts);
        }
    }
}
