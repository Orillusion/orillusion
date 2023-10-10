import { Vector3 } from "../../../math/Vector3";
import { QuadAABB } from "./QuadAABB";


export class QuadTreeCell {

    public static NUM_CHILDREN: number = 4;

    public childCellIndices: Array<number>;

    public nodeIndices: Array<number>;

    public aabb: QuadAABB;

    public points: Array<Vector3>;

    constructor(aabox: QuadAABB) {
        this.childCellIndices = new Array<number>();
        this.childCellIndices.length = QuadTreeCell.NUM_CHILDREN;

        this.nodeIndices = new Array<number>();

        this.clear();

        if (aabox) {
            this.aabb = aabox.clone();
        } else {
            this.aabb = new QuadAABB();
        }
    }

    /**
    * @language zh_CN
    * Indicates if we contain triangles (if not then we should/might have children)
    */
    public isLeaf(): boolean {
        return this.childCellIndices[0] == -1;
    }

    public clear(): void {
        for (var i: number = 0; i < QuadTreeCell.NUM_CHILDREN; i++) {
            this.childCellIndices[i] = -1;
        }
        this.nodeIndices.splice(0, this.nodeIndices.length);
    }


}