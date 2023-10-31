import { Navi3DMaskType } from "./Navi3DMaskType";
import { Navi3DMesh } from "./Navi3DMesh";
import { Navi3DPoint } from "./Navi3DPoint";
import { Navi3DTriangle } from "./Navi3DTriangle";

export class Navi3DAstar {

    private _openedList: Array<Navi3DTriangle>;
    private _closedList: Array<Navi3DTriangle>;
    private _endNode: Navi3DTriangle;
    private _startNode: Navi3DTriangle;
    private _triangleChannel: Array<Navi3DTriangle>;
    private _navMesh: Navi3DMesh;
    private _findIndex: number = 0;

    constructor() {
        this._openedList = new Array<Navi3DTriangle>();
        this._closedList = new Array<Navi3DTriangle>();
    }

    public findPath(navMesh: Navi3DMesh, startTriangle: Navi3DTriangle, endTriangle: Navi3DTriangle): boolean {
        this._findIndex++;
        this._navMesh = navMesh;

        this._startNode = startTriangle;
        this._endNode = endTriangle;

        this._openedList.length = 0;
        this._closedList.length = 0;

        if (this._startNode && this._endNode) {
            this._startNode.gg = 0;
            this._startNode.h = 0;
            this._startNode.f = 0;
            this._startNode.parent = null;
            return this.search();
        }
        return false;
    }

    private search(): boolean {
        var node: Navi3DTriangle = this._startNode;
        var neibours: Array<Navi3DTriangle> = [];
        var test: Navi3DTriangle;
        while (node != this._endNode) {
            neibours = node.getNeibourTriangles(neibours, Navi3DMaskType.WalkAble, Navi3DMaskType.WalkAble);
            for (test of neibours) {
                if (test.closeId == this._findIndex)
                    continue;
                if (test == node || !test.walkAble) {
                    continue;
                }
                var g: number = node.gg + Navi3DPoint.calcDistance(test, node) * test.costMultiplier;
                var h: number = Navi3DPoint.calcDistance(test, this._endNode);
                var f: number = g + h;
                if (test.openId == this._findIndex) {
                    if (test.f > f) {
                        test.f = f;
                        test.gg = g;
                        test.h = h;
                        test.parent = node;
                    }
                }
                else {
                    test.f = f;
                    test.gg = g;
                    test.h = h;
                    test.parent = node;
                    test.openId = this._findIndex;
                    this._openedList.push(test);
                }
            }
            node.closeId = this._findIndex;
            this._closedList.push(node);
            if (this._openedList.length == 0) {
                return false;
            }
            this._openedList.sort(function (a: Navi3DTriangle, b: Navi3DTriangle) {
                return a.f - b.f;
            });
            node = <Navi3DTriangle>(this._openedList.shift());
        }
        this.buildPath();
        return true;
    }

    private buildPath(): void {
        this._triangleChannel = [];
        var node: Navi3DTriangle = this._endNode;
        this._triangleChannel.push(node);
        while (node != this._startNode) {
            node = node.parent;
            this._triangleChannel.unshift(node);
        }
    }

    public get channel(): Array<Navi3DTriangle> {
        return this._triangleChannel;
    }

}







