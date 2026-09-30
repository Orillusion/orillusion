import { Vector2 } from './Vector2';

/**
 * Axis-aligned 2D box (min / max corners). Mirrors three.js `Box2`: screen
 * rectangles, UV bounds, 2D culling, marquee selection.
 * @group Math
 */
export class Box2 {
    public min: Vector2;
    public max: Vector2;

    /** Defaults to an empty box (min = +∞, max = −∞) so the first `expandByPoint` defines it. */
    constructor(min?: Vector2, max?: Vector2) {
        this.min = min ?? new Vector2(Infinity, Infinity);
        this.max = max ?? new Vector2(-Infinity, -Infinity);
    }

    public set(min: Vector2, max: Vector2): this {
        this.min.copy(min);
        this.max.copy(max);
        return this;
    }

    public setFromPoints(points: Vector2[]): this {
        this.makeEmpty();
        for (const p of points) this.expandByPoint(p);
        return this;
    }

    public setFromCenterAndSize(center: Vector2, size: Vector2): this {
        const hx = size.x * 0.5, hy = size.y * 0.5;
        this.min.set(center.x - hx, center.y - hy);
        this.max.set(center.x + hx, center.y + hy);
        return this;
    }

    public clone(): Box2 {
        return new Box2(this.min.clone(), this.max.clone());
    }

    public copy(box: Box2): this {
        return this.set(box.min, box.max);
    }

    public makeEmpty(): this {
        this.min.set(Infinity, Infinity);
        this.max.set(-Infinity, -Infinity);
        return this;
    }

    /** True when the box encloses no points (max < min on either axis). */
    public isEmpty(): boolean {
        return this.max.x < this.min.x || this.max.y < this.min.y;
    }

    public getCenter(out: Vector2 = new Vector2()): Vector2 {
        return this.isEmpty() ? out.set(0, 0) : out.set((this.min.x + this.max.x) * 0.5, (this.min.y + this.max.y) * 0.5);
    }

    public getSize(out: Vector2 = new Vector2()): Vector2 {
        return this.isEmpty() ? out.set(0, 0) : out.set(this.max.x - this.min.x, this.max.y - this.min.y);
    }

    public expandByPoint(p: Vector2): this {
        if (p.x < this.min.x) this.min.x = p.x;
        if (p.y < this.min.y) this.min.y = p.y;
        if (p.x > this.max.x) this.max.x = p.x;
        if (p.y > this.max.y) this.max.y = p.y;
        return this;
    }

    public expandByVector(v: Vector2): this {
        this.min.set(this.min.x - v.x, this.min.y - v.y);
        this.max.set(this.max.x + v.x, this.max.y + v.y);
        return this;
    }

    public expandByScalar(s: number): this {
        this.min.set(this.min.x - s, this.min.y - s);
        this.max.set(this.max.x + s, this.max.y + s);
        return this;
    }

    public containsPoint(p: Vector2): boolean {
        return p.x >= this.min.x && p.x <= this.max.x && p.y >= this.min.y && p.y <= this.max.y;
    }

    public containsBox(box: Box2): boolean {
        return this.min.x <= box.min.x && box.max.x <= this.max.x && this.min.y <= box.min.y && box.max.y <= this.max.y;
    }

    /** Overlap test; touching edges count as intersecting. */
    public intersectsBox(box: Box2): boolean {
        return box.max.x >= this.min.x && box.min.x <= this.max.x && box.max.y >= this.min.y && box.min.y <= this.max.y;
    }

    /** Position of `p` inside the box as 0..1 on each axis. */
    public getParameter(p: Vector2, out: Vector2 = new Vector2()): Vector2 {
        return out.set((p.x - this.min.x) / (this.max.x - this.min.x), (p.y - this.min.y) / (this.max.y - this.min.y));
    }

    public clampPoint(p: Vector2, out: Vector2 = new Vector2()): Vector2 {
        return out.set(Math.max(this.min.x, Math.min(this.max.x, p.x)), Math.max(this.min.y, Math.min(this.max.y, p.y)));
    }

    /** 0 when `p` is inside or on the box. */
    public distanceToPoint(p: Vector2): number {
        const dx = Math.max(this.min.x - p.x, 0, p.x - this.max.x);
        const dy = Math.max(this.min.y - p.y, 0, p.y - this.max.y);
        return Math.sqrt(dx * dx + dy * dy);
    }

    /** Shrink to the overlap with `box`; becomes empty if they do not overlap. */
    public intersect(box: Box2): this {
        this.min.set(Math.max(this.min.x, box.min.x), Math.max(this.min.y, box.min.y));
        this.max.set(Math.min(this.max.x, box.max.x), Math.min(this.max.y, box.max.y));
        if (this.isEmpty()) this.makeEmpty();
        return this;
    }

    public union(box: Box2): this {
        this.min.set(Math.min(this.min.x, box.min.x), Math.min(this.min.y, box.min.y));
        this.max.set(Math.max(this.max.x, box.max.x), Math.max(this.max.y, box.max.y));
        return this;
    }

    public translate(offset: Vector2): this {
        this.min.set(this.min.x + offset.x, this.min.y + offset.y);
        this.max.set(this.max.x + offset.x, this.max.y + offset.y);
        return this;
    }

    public equals(box: Box2): boolean {
        return box.min.x === this.min.x && box.min.y === this.min.y && box.max.x === this.max.x && box.max.y === this.max.y;
    }
}
