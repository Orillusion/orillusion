export class Navi3DPoint2D {
    public x: number;

    public y: number;

    public setTo(X: number, Y: number): void {
        this.x = X;
        this.y = Y;
    }

    public equals(X: number, Y: number): boolean {
        return X == this.x && Y == this.y;
    }

    public equalPoint(pt: Navi3DPoint2D): boolean {
        return this.equals(pt.x, pt.y);
    }

    public get length(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    public clone(): Navi3DPoint2D {
        var point: Navi3DPoint2D = new Navi3DPoint2D();
        point.setTo(this.x, this.y);
        return point;
    }

    public normalize(): void {
        var size: number = length;
        if (size == 0)
            return;
        this.setTo(this.x / size, this.y / size);
    }

}