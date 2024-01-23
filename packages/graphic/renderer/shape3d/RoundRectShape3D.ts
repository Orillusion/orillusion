import { clamp } from "@orillusion/core";
import { Shape3D, ShapeTypeEnum } from "./Shape3D";

/**
 * Define class for drawing rounded rectangles on the xz plane
 *
 * @export
 * @class RoundRectShape3D
 * @extends {Shape3D}
 */
export class RoundRectShape3D extends Shape3D {
    private _width: number = 100;
    private _height: number = 100;
    private _cornerSegment: number = 4;
    private _radius: number = 2;

    public readonly shapeType: number = Number(ShapeTypeEnum.RoundRect);

    public set(width: number, height: number, radius: number, lineWidth: number, fill: boolean, line: boolean, cornerSegment: number = 10) {
        this.width = width;
        this.height = height;
        this.radius = radius;
        this.lineWidth = lineWidth;
        this.line = line;
        this.fill = fill;
        this.cornerSegment = cornerSegment;
    }

    public get width(): number {
        return this._width;
    }
    public set width(value: number) {
        if (this._width != value) {
            this._width = Math.max(0, value);
            this._isChange = true;
        }
    }
    public get height(): number {
        return this._height;
    }
    public set height(value: number) {
        if (this._height != value) {
            this._height = Math.max(0, value);
            this._isChange = true;
        }
    }

    public get radius(): number {
        return this._radius;
    }
    public set radius(value: number) {
        if (this._radius != value) {
            this._radius = Math.max(0, value);
            this._isChange = true;
        }
    }

    public get cornerSegment(): number {
        return this._cornerSegment;
    }
    public set cornerSegment(value: number) {
        if (this._cornerSegment != value) {
            this._cornerSegment = Math.round(Math.max(0, value));
            this._isChange = true;
        }
    }

    public calcRequireSource(): void {
        this._destPointCount = (1 + this._cornerSegment) * 4;
    }

    public get isRect() {
        return this._cornerSegment < 0.5;
    }

    protected writeShapeData() {
        let maxRadius = Math.min(this._width, this._height) * 0.5;
        let pathRadius = Math.min(maxRadius, this._radius);
        let useWidth = this._width;
        let useHeight = this._height;
        let useLineWidth = 0;
        const isRect = this.isRect;

        if (this._line) {
            useLineWidth = Math.min(this._lineWidth, this._width, this._height);
            maxRadius += useLineWidth * 0.5;
            pathRadius = Math.min(maxRadius, this._radius);
            pathRadius = clamp(pathRadius - useLineWidth, 0, maxRadius);
            if (!isRect) {
                useWidth -= useLineWidth + 2 * pathRadius;
                useHeight -= useLineWidth + 2 * pathRadius;
            } else {
                useWidth = this._width - useLineWidth;
                useHeight = this._height - useLineWidth;
            }

        } else {
            if (!isRect) {
                useWidth -= pathRadius * 2;
                useHeight -= pathRadius * 2;
            }
        }
        super.writeShapeData(this._cornerSegment, useLineWidth, useWidth, useHeight, pathRadius);

    }
}