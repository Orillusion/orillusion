
/**
 * Rectangular region
 * @group Math
 */
export class Rect {
    /**
     * The x-coordinate of the rectangle
     */
    public x: number;

    /**
     * The y-coordinate of the rectangle
     */
    public y: number;

    /**
     * Width of a rectangle
     */
    public w: number;

    /**
     * Height of rectangle
     */
    public h: number;

    /**
     * Creates a new rectangular area object
     * @param x The x-coordinate of the rectangle
     * @param y The y coordinate of the rectangle
     * @param width Width of a rectangle
     * @param height Height of rectangle
     */
    constructor(x: number = 0, y: number = 0, width: number = 0, height: number = 0) {
        this.x = x;
        this.y = y;
        this.w = width;
        this.h = height;
    }

    /**
     * Width of a rectangle
     */
    public get width(): number {
        return this.w;
    }

    public set width(v) {
        this.w = v;
    }

    /**
     * Height of rectangle
     */
    public get height(): number {
        return this.h;
    }

    public set height(v) {
        this.h = v;
    }

    /**
     * Whether the point is within the specified area
     * @param x x value of point
     * @param y y value of point
     * @param lt_x The x value in the upper left corner
     * @param lt_y The y value in the upper left corner
     * @param rb_x The x value in the lower right corner
     * @param rb_y The y value in the lower right corner
     * @returns 
     */
    public static pointInRect(x: number, y: number, lt_x: number, lt_y: number, rb_x: number, rb_y: number): boolean {
        if (x < lt_x || x > rb_x || y < lt_y || y > rb_y) {
            return false;
        }

        return true;
    }

    /**
     * Returns a new rectangular area object with the same properties as the current rectangular area
     * @returns 
     */
    public clone(): Rect {
        return new Rect(this.x, this.y, this.w, this.h);
    }

    /**
     * Copy the properties of the source object to this object
     * @param v source object
     * @returns 
     */
    public copyFrom(rect: Rect) {
        this.x = rect.x;
        this.y = rect.y;
        this.w = rect.w;
        this.h = rect.h;
    }

    /**
     * Copy the properties of this object to the target object
     * @param v target object
     * @returns 
     */
    public copyTo(rect: Rect): void {
        rect.copyFrom(this);
    }

    /**
     * Whether the point is in this area
     * @param x x value of point
     * @param y y value of point
     * @returns 
     */
    public inner(x: number, y: number): boolean {
        if (x < this.x || x > this.x + this.width || y < this.y || y > this.y + this.height) {
            return false;
        }
        return true;
    }

    /**
     * Whether the current rectangle is equal to the target rectangle
     * @param rectangle Target rectangle
     * @returns 
     */
    public equal(rectangle: Rect): boolean {
        return !(this.x != rectangle.x || this.y != rectangle.y || this.width != rectangle.width || this.height != rectangle.height);
    }

    /**
     * Whether the current rectangle is equal to the target rectangle
     * @param x The x value of the rectangle
     * @param y The y value of the rectangle
     * @param width Rectangle width
     * @param height Rectangular height
     * @returns 
     */
    public equalArea(x: number, y: number, width: number, height: number): boolean {
        return !(this.x != x || this.y != y || this.width != width || this.height != height);
    }

    /**
     * Whether this rectangle overlaps with the target object
     * @param source Source object
     * @returns 
     */
    public equalInnerArea(source: Rect): boolean {
        var aMinX = this.x;
        var aMinY = this.y;

        var aMaxX = this.x + this.width;
        var aMaxY = this.y + this.height;

        var bMinX = source.x;
        var bMinY = source.y;

        var bMaxX = source.x + source.width;
        var bMaxY = source.y + source.height;

        if (Math.max(aMinX, bMinX) <= Math.min(aMaxX, bMaxX) && Math.max(aMinY, bMinY) <= Math.min(aMaxY, bMaxY)) {
            return true;
        }
        return false;
    }

    /**
     * Returns the overlap of two rectangles
     * @param source source object
     * @param target target object
     * @returns 
     */
    public innerArea(source: Rect, target: Rect): Rect {
        target = target || new Rect();
        var Xa1 = this.x;
        var Ya1 = this.y;

        var Xa2 = this.x + this.width;
        var Ya2 = this.y + this.height;

        var Xb1 = source.x;
        var Yb1 = source.y;

        var Xb2 = source.x + source.width;
        var Yb2 = source.y + source.height;

        var top: number = Math.max(Ya1, Yb1);
        var bottom: number = Math.min(Ya2, Yb2);
        var left: number = Math.max(Xa1, Xb1);
        var right: number = Math.min(Xb2, Xa2);
        if (top >= 0 && bottom >= 0 && bottom - top >= 0 && right - left > 0) {
            target.x = left;
            target.y = top;
            target.width = right - left;
            target.height = bottom - top;
        } else {
            target.x = 0;
            target.y = 0;
            target.width = 0;
            target.height = 0;
        }
        return target;
    }

    /**
     * Sets the properties of the rectangle
     * @param x x value
     * @param y y value
     * @param width Rectangle width
     * @param height Rectangular height
     */
    public setTo(x: number, y: number, width: number, height: number): void {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
}
