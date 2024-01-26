import { Vector2, deg2Rad, Vector3, Matrix4, rad2Deg } from "@orillusion/core";
import { Point3D, Shape3DStruct } from "./Shape3D";
import { LineShape3D } from "./LineShape3D";

/**
 * Define class for drawing path on the xz plane
 * He implemented the interface CanvasPath
 *
 * @export
 * @class Path2DShape3D
 * @extends {LineShape3D}
 * @implements {CanvasPath}
 */
export class Path2DShape3D extends LineShape3D implements CanvasPath {

    private _currentCoord: Point3D;
    constructor(structs: Shape3DStruct, sharedPoints: Float32Array, sharedIndecies: Uint32Array, matrixIndex: number) {
        super(structs, sharedPoints, sharedIndecies, matrixIndex);
        this._points3D = [];
        this._currentCoord = new Point3D(0, 0, 0, true);
        this.reset();
    }

    public get isClosed(): boolean {
        return this._isClosed;
    }
    public set isClosed(value: boolean) {
        this._isClosed = false;
        console.warn('Not Supported');
    }

    public reset() {
        this._points3D.length = 0;
        this._currentCoord.set(0, 0, 0, true);
        this._isChange = true;
    }

    public calcRequireSource(): void {
        this._srcPointCount = this._points3D.length;
        super.calcRequireSource();
    }

    arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, counterclockwise?: boolean, segment?: number): void {
        this.changeLastPointValid(true);
        //fix angle
        startAngle ||= 0;
        endAngle ||= 0;
        if (startAngle < 0 || startAngle > 360) {
            startAngle %= 360;
        }
        if (endAngle < 0 || endAngle > 360) {
            endAngle %= 360;
        }
        if (endAngle < startAngle) {
            endAngle += 360;
        }
        //fix segment
        segment ||= 18;

        for (let i = 0; i <= segment; i++) {
            let angle = this.mixFloat(startAngle, endAngle, i / segment);
            angle = deg2Rad(angle);
            this.appendPoint(radius * Math.cos(angle) + x, radius * Math.sin(angle) + y);
        }
    }

    arcTo(ctrlX: number, ctrlY: number, toX: number, toY: number, radius: number, segment?: number): void {
        this.changeLastPointValid(true);

        segment ||= 8;
        radius = Math.max(0.00001, radius);

        let from = Vector3.HELP_0.set(ctrlX - this._currentCoord.x, 0, ctrlY - this._currentCoord.y).normalize();
        let fRight = from.crossProduct(Vector3.UP).normalize();
        let to = Vector3.HELP_1.set(toX - ctrlX, 0, toY - ctrlY).normalize();
        let tRight = to.crossProduct(Vector3.UP).normalize();
        let isPositive = to.crossProduct(from).y >= 0.0;
        let halfAngle = Math.acos(from.dotProduct(to)) * 0.5;
        let bevelEdge = radius / Math.cos(halfAngle);
        let dirCenter = to.subtract(from).normalize();
        let centerPoint = new Vector3(ctrlX + dirCenter.x * bevelEdge, 0, ctrlY + dirCenter.z * bevelEdge);

        let rotateLocalPos: Vector3 = fRight.clone().multiplyScalar(radius);
        let deltaAngle = rad2Deg(halfAngle * 2) / segment;
        if (isPositive) {
            deltaAngle = -deltaAngle;
            rotateLocalPos.negate();
        }
        let matrix: Matrix4 = new Matrix4().identity().createByRotation(deltaAngle, Vector3.UP);

        let point: Vector3 = rotateLocalPos.add(centerPoint);
        this.appendPoint(point.x, point.z);

        for (let i = 0; i < segment; i++) {
            rotateLocalPos = matrix.transformVector(rotateLocalPos, rotateLocalPos);
            point = rotateLocalPos.add(centerPoint);
            this.appendPoint(point.x, point.z);
        }
    }

    bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number, segment?: number): void {
        this.changeLastPointValid(true);

        segment ||= 8;

        if (this._points3D.length == 0) {
            this.appendPoint(cp1x, cp1y);
        }
        let start = this._currentCoord;
        if (start.invalid) {
            let lastPt = this._points3D[this._points3D.length];
            start.invalid = lastPt.invalid = false;
        }
        let cp1 = new Vector3(cp1x, cp1y);
        let cp2 = new Vector3(cp2x, cp2y);
        let end = new Vector3(x, y, 0);
        for (let i = 1; i <= segment; i++) {
            let newPoint = this.sampleCurve(start, cp1, cp2, end, i / segment);
            this.appendPoint(newPoint.x, newPoint.y);
        }
    }

    closePath(): void {
        for (let item of this._points3D) {
            if (item && !item.invalid) {
                this.lineTo(item.x, item.y);
                break;
            }
        }
    }

    ellipse(x: number, y: number, radiusX: number, radiusY: number, rotation: number, startAngle: number, endAngle: number, counterclockwise?: boolean, segment?: number): void {
        this.changeLastPointValid(true);

        //fix angle
        startAngle ||= 0;
        endAngle ||= 0;
        if (startAngle < 0 || startAngle > 360) {
            startAngle %= 360;
        }
        if (endAngle < 0 || endAngle > 360) {
            endAngle %= 360;
        }
        if (endAngle < startAngle) {
            endAngle += 360;
        }
        //fix segment
        segment ||= 18;

        let rotateMatrix: Matrix4;
        if (rotation != 0) {
            rotateMatrix = Matrix4.helpMatrix.identity().createByRotation(rotation, Vector3.UP);
        }

        for (let i = 0; i <= segment; i++) {
            let angle = this.mixFloat(startAngle, endAngle, i / segment);
            angle = deg2Rad(angle);
            if (!rotateMatrix) {
                this.appendPoint(radiusX * Math.cos(angle) + x, radiusY * Math.sin(angle) + y);
            } else {
                let vec3 = Vector3.HELP_0.set(radiusX * Math.cos(angle), 0, radiusY * Math.sin(angle));
                rotateMatrix.transformPoint(vec3, vec3);
                this.appendPoint(vec3.x + x, vec3.z + y);
            }
        }
    }

    moveTo(x: number, y: number, h?: number): void {
        this.changeLastPointValid(false);
        this.appendPoint(x, y);
        this.changeLastPointValid(false);
    }

    quadraticCurveTo(cpx: number, cpy: number, x: number, y: number, segment?: number): void {
        this.changeLastPointValid(true);

        segment ||= 8;

        if (this._points3D.length == 0) {
            this.appendPoint(cpx, cpy);
        }
        let start = this._currentCoord;
        if (start.invalid) {
            let lastPt = this._points3D[this._points3D.length];
            start.invalid = lastPt.invalid = false;
        }

        let cp = new Vector2(cpx, cpy);
        let end = new Vector2(x, y);
        for (let i = 1; i <= segment; i++) {
            let newPoint = this.sampleQuadraticCurve(start, cp, end, i / segment);
            this.appendPoint(newPoint.x, newPoint.y);
        }
    }

    rect(x: number, y: number, w: number, h: number): void {
        this.moveTo(x - w * 0.5, y - h * 0.5);
        this.changeLastPointValid(true);
        this.appendPoint(x + w * 0.5, y - h * 0.5);
        this.appendPoint(x + w * 0.5, y + h * 0.5);
        this.appendPoint(x - w * 0.5, y + h * 0.5);
        this.appendPoint(x - w * 0.5, y - h * 0.5);
    }

    roundRect(x: number, y: number, w: number, h: number, radii?: number, segment?: number): void {
        segment ||= 6;
        radii ||= 0;
        radii = Math.min(w * 0.5, h * 0.5, radii);
        if (radii < 0) radii = 0;
        let angle = 0;
        let tempAngle = 0;
        let point: Vector2;
        let offset: Vector2;
        let firstPosition: Vector2;

        let roundRectList: Vector2[] = [];

        for (let i = 0; i < 4; i++) {
            if (i == 0) {
                offset = new Vector2(w * 0.5, h * 0.5);
            } else if (i == 1) {
                offset = new Vector2(-w * 0.5, h * 0.5);
            } else if (i == 2) {
                offset = new Vector2(-w * 0.5, -h * 0.5);
            } else {
                offset = new Vector2(w * 0.5, -h * 0.5);
            }
            offset.x += x;
            offset.y += y;
            for (let j = 0; j <= segment; j++) {
                tempAngle = angle + Math.PI * 0.5 * j / segment;
                point = new Vector2(Math.cos(tempAngle), Math.sin(tempAngle)).multiplyScaler(radii);
                point.add(offset, point);
                firstPosition ||= point;
                roundRectList.push(point);
            }
            angle += Math.PI * 0.5;
        }

        roundRectList.shift();
        roundRectList.push(firstPosition);
        this.moveTo(firstPosition.x, firstPosition.y);
        this.changeLastPointValid(true);
        for (let item of roundRectList) {
            this.appendPoint(item.x, item.y);
        }
    }

    public lineTo(x: number, y: number) {
        this.changeLastPointValid(true);
        this.appendPoint(x, y);
    }

    private changeLastPointValid(valid: boolean) {
        if (this._points3D.length) {
            let lastPt = this._points3D[this._points3D.length - 1];
            this._currentCoord.invalid = lastPt.invalid = !valid;
        }
    }

    private appendPoint(x: number, y: number) {
        let pt = new Point3D(x, y);
        this._points3D.push(pt);
        this._currentCoord.copyFrom(pt);
        this._isChange = true;
        return this;
    }
}