import { Vector3 } from "../../../math/Vector3";
import { IQuadNode } from "./IQuadNode";
import { QuadAABB } from "./QuadAABB";
import { QuadTree } from "./QuadTree";

export class QuadRoot {

    private _maxNodesPerCell: number;

    private _minCellSize: number;

    private _quadTree: QuadTree;

    private _collisionNodesIdx: Array<number>;

    private _segBox: QuadAABB;

    private _collisionNodes: Array<IQuadNode>;

    constructor(maxNodesPerCell: number = 10, minCellSize: number = 500) {
        this._maxNodesPerCell = maxNodesPerCell;
        this._minCellSize = minCellSize;
        this._segBox = new QuadAABB;
        this._collisionNodesIdx = new Array<number>();
        this._collisionNodes = new Array<IQuadNode>();
    }

    public createQuadTree(nodes: Array<IQuadNode>): void {

        this._quadTree = new QuadTree();
        this._quadTree.initNodes(nodes);
        this._quadTree.buildQuadTree(this._maxNodesPerCell, this._minCellSize);
    }

    public getNodesByAABB(minX: number, minY: number, maxX: number, maxY: number): Array<IQuadNode> {
        // 创建一个射线的boundingbox
        this._segBox.clear();
        this._segBox.maxPosX = maxX;
        this._segBox.maxPosY = maxY;
        this._segBox.minPosX = minX;
        this._segBox.minPosY = minY;

        // 获取Boundingbox中的nodes
        this._collisionNodesIdx.length = 0;
        this._collisionNodes.length = 0;
        var numNodes: number = this._quadTree.getNodesIntersectingtAABox(this._collisionNodesIdx, this._segBox);
        var quadNode: IQuadNode;
        for (var i: number = 0; i < this._collisionNodesIdx.length; i++) {
            quadNode = this._quadTree.getQuadNode(this._collisionNodesIdx[i]);
            this._collisionNodes.push(quadNode);
        }
        return this._collisionNodes;

    }

    public getTriangleAtPoint(point: Vector3, threshold: number = 5): IQuadNode {
        // 创建一个射线的boundingbox
        this._segBox.clear();
        this._segBox.setAABox(point.x, point.z, 1, 1);

        this._collisionNodesIdx.length = 0;
        this._collisionNodes.length = 0;
        // 获取Boundingbox中的node的ID
        var numTriangles: number = this._quadTree.getNodesIntersectingtAABox(this._collisionNodesIdx, this._segBox);

        // 检查那个三角与点(x,y)相交
        var minDistance: number = 0xffffffff;
        var curDistance: number = 0;
        var minTriangle: IQuadNode;
        var quadNode: IQuadNode;
        var triangle: IQuadNode;
        var box: QuadAABB;
        for (var i: number = 0; i < this._collisionNodesIdx.length; i++) {
            quadNode = this._quadTree.getQuadNode(this._collisionNodesIdx[i]);
            box = quadNode.aabb;
            if (!Vector3.pointInsideTriangle(point, box.points[0], box.points[1], box.points[2])) {
                continue;
            }
            triangle = quadNode;
            curDistance = Math.abs(triangle.plane.distance(point));
            if (curDistance > threshold)
                continue;
            if (quadNode == null || curDistance <= minDistance) {
                minTriangle = triangle;
                minDistance = curDistance;
            }
        }

        return minTriangle;
    }

}
