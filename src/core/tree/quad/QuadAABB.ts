import { Vector3 } from "../../../math/Vector3";

export class QuadAABB {

    public minPosX: number = 0;

    public minPosY: number = 0;

    public maxPosX: number = 0;

    public maxPosY: number = 0;

    public testID: number = 0;

    public points: Array<Vector3>;

    private offsetPosition: Vector3;

    private static TINY: number = 0.000001;

    constructor() {
        this.points = new Array<Vector3>();
        this.offsetPosition = new Vector3(0, 0, 0, 0);
        this.clear();

    }

    public setAABox(cx: number, cy: number, sideX: number, sideY: number): void {
        this.minPosX = cx - sideX / 2 - QuadAABB.TINY;
        this.maxPosX = cx + sideX / 2 + QuadAABB.TINY;
        this.minPosY = cy - sideY / 2 - QuadAABB.TINY;
        this.maxPosY = cy + sideY / 2 + QuadAABB.TINY;

        this.offsetPosition.setTo(0, 0, 0);
    }

    public setOffset(vec: Vector3): void {

        this.maxPosX += vec.x - this.offsetPosition.x;
        this.minPosX += vec.x - this.offsetPosition.x;

        this.minPosY += vec.z - this.offsetPosition.z;
        this.maxPosY += vec.z - this.offsetPosition.z;

        this.offsetPosition.copyFrom(vec);
    }

    public setContainRect(minX: number, minY: number, maxX: number, maxY: number): void {
        if (this.minPosX > minX) this.minPosX = minX;
        if (this.minPosY > minY) this.minPosY = minY;
        if (this.maxPosX < maxX) this.maxPosX = maxX;
        if (this.maxPosY < maxY) this.maxPosY = maxY;
    }

    public clear(): void {
        var huge: number = 1000000000;
        this.minPosX = this.minPosY = huge;
        this.maxPosX = this.maxPosY = -huge;
        this.points.length = 0;
        this.testID = 0;
        this.offsetPosition.setTo(0, 0, 0);
    }

    public addPoint(pos: Vector3): void {
        if (this.points.indexOf(pos) == -1) {
            if (pos.x < this.minPosX)
                this.minPosX = pos.x - QuadAABB.TINY;
            if (pos.x > this.maxPosX)
                this.maxPosX = pos.x + QuadAABB.TINY;
            if (pos.z < this.minPosY)
                this.minPosY = pos.z - QuadAABB.TINY;
            if (pos.z > this.maxPosY)
                this.maxPosY = pos.z + QuadAABB.TINY;

            this.points.push(pos);
        }
    }

    public clone(): QuadAABB {
        var aabb: QuadAABB = new QuadAABB();
        aabb.minPosX = this.minPosX;
        aabb.minPosY = this.minPosY;
        aabb.maxPosX = this.maxPosX;
        aabb.maxPosY = this.maxPosY;
        return aabb;
    }
    public get radius(): number {
        return Math.sqrt((this.maxPosY - this.minPosY) * (this.maxPosY - this.minPosY) + (this.maxPosX - this.minPosX) * (this.maxPosX - this.minPosX));
    }

    public get sideX(): number {
        return this.maxPosX - this.minPosX;
    }

    public get sideY(): number {
        return this.maxPosY - this.minPosY;
    }

    public get centreX(): number {
        return (this.maxPosX - this.minPosX) * 0.5 + this.minPosX;
    }

    public get centreY(): number {
        return (this.maxPosY - this.minPosY) * 0.5 + this.minPosY;
    }

    public overlapTest(box: QuadAABB): boolean {
        return (
            (this.minPosY >= box.maxPosY) ||
            (this.maxPosY <= box.minPosY) ||
            (this.minPosX >= box.maxPosX) ||
            (this.maxPosX <= box.minPosX)) ? false : true;
    }

    public isPointInside(pos: Vector3): boolean {
        return ((pos.x >= this.minPosX) &&
            (pos.x <= this.maxPosX) &&
            (pos.z >= this.minPosY) &&
            (pos.z <= this.maxPosY));
    }

    public isIntersectLineSegment(p1x: number, p1y: number, p2x: number, p2y: number): boolean {
        var isIntersect: boolean = false;
        // function p1-p2
        var A1: number = p1y - p2y;
        var B1: number = p2x - p1x;
        var C1: number = p1x * p2y - p2x * p1y;
        // 
        var LineIntersectY: number = (-C1 - A1 * this.minPosX) / B1;
        if (LineIntersectY <= this.maxPosY && LineIntersectY >= this.minPosY)
            isIntersect = true;
        LineIntersectY = (-C1 - A1 * this.maxPosX) / B1;
        if (LineIntersectY <= this.maxPosY && LineIntersectY >= this.minPosY)
            isIntersect = true;
        var LineIntersectX: number = (-C1 - B1 * this.minPosY) / A1;
        if (LineIntersectX <= this.maxPosX && LineIntersectX >= this.minPosX)
            isIntersect = true;
        LineIntersectX = (-C1 - B1 * this.maxPosY) / A1;
        if (LineIntersectX <= this.maxPosX && LineIntersectX >= this.minPosX)
            isIntersect = true;
        return isIntersect;
    }




}