import { BitmapTexture2DArray, Graphic3DMesh, Scene3D, Vector2, Vector3 } from "@orillusion/core";
import { Shape3DRenderer } from "./Shape3DRenderer";
import { RoundRectShape3D } from "./shape3d/RoundRectShape3D";
import { EllipseShape3D } from "./shape3d/EllipseShape3D";
import { Point3D, Shape3DStruct } from "./shape3d/Shape3D";
import { CircleShape3D } from "./shape3d/CircleShape3D";
import { LineShape3D } from "./shape3d/LineShape3D";
import { QuadraticCurveShape3D } from "./shape3d/QuadraticCurveShape3D";
import { CurveShape3D } from "./shape3d/CurveShape3D";
import { Path2DShape3D } from "./shape3d/Path2DShape3D";
import { Path3DShape3D } from "./shape3d/Path3DShape3D";

export class Shape3DMaker {

    private _renderer: Shape3DRenderer;

    constructor(renderer: Shape3DRenderer) {
        this._renderer = renderer;
    }

    /**
     *
     * @static
     * @param {string} name key of Shape3DRenderer.
     * @param {BitmapTexture2DArray} textureList textures used by node.
     * @param {Scene3D} scene Scene3D
     * @param {number} [maxNodeCount=24] Can accommodate the maximum number of nodes
     * @param {number} [triangleEachNode=24] The maximum number of triangles included is triangleEachNode * maxNodeCount
     * @return {*}  {Shape3DMaker}
     * @memberof Shape3DMaker
     */
    public static makeRenderer(name: string, textureList: BitmapTexture2DArray, scene: Scene3D, maxNodeCount: number = 1000, triangleEachNode: number = 24): Shape3DMaker {
        let renderer = Graphic3DMesh.drawNode<Shape3DRenderer>(
            name, Shape3DRenderer, Shape3DStruct,
            scene, textureList, maxNodeCount, maxNodeCount * triangleEachNode, true);

        let maker = new Shape3DMaker(renderer);
        return maker;
    }

    public get renderer() {
        return this._renderer;
    }

    ellipse(radiusX: number, radiusY: number, rotation: number, startAngle: number, endAngle: number, counterclockwise?: boolean): EllipseShape3D {
        let ellipse = this._renderer.createShape(EllipseShape3D);
        ellipse.rx = radiusX;
        ellipse.ry = radiusY;
        ellipse.rotation = rotation;
        ellipse.startAngle = startAngle || 0;
        ellipse.endAngle = endAngle || 360;
        return ellipse;
    }

    arc(radius: number, startAngle: number, endAngle: number, counterclockwise?: boolean): CircleShape3D {
        let circle = this._renderer.createShape(CircleShape3D);
        circle.radius = radius;
        circle.startAngle = startAngle || 0;
        circle.endAngle = endAngle || 360;
        return circle;
    }

    line(points: Vector2[]) {
        let line = this._renderer.createShape(LineShape3D);
        let points3D = line.points3D || [];
        points3D.length = 0;
        for (let pt of points) {
            points3D.push(new Point3D(pt.x, pt.y));
        }
        line.points3D = points3D;
        return line;
    }

    quadraticCurve(fx: number, fy: number, cpx: number, cpy: number, tx: number, ty: number): QuadraticCurveShape3D {
        let curve = this._renderer.createShape(QuadraticCurveShape3D);
        curve.start = new Vector2(fx, fy);
        curve.end = new Vector2(tx, ty);
        curve.cp = new Vector2(cpx, cpy);
        return curve;
    }

    curve(fx: number, fy: number, cp1x: number, cp1y: number, cp2x: number, cp2y: number, tx: number, ty: number): CurveShape3D {
        let curve = this._renderer.createShape(CurveShape3D);
        curve.start = new Vector2(fx, fy);
        curve.end = new Vector2(tx, ty);
        curve.cp1 = new Vector2(cp1x, cp1y);
        curve.cp2 = new Vector2(cp2x, cp2y);
        return curve;
    }

    path2D(): Path2DShape3D {
        return this._renderer.createShape(Path2DShape3D);
    }

    path3D(): Path3DShape3D {
        return this._renderer.createShape(Path3DShape3D);
    }

    rect(w: number, h: number): RoundRectShape3D {
        let rect = this._renderer.createShape(RoundRectShape3D);
        rect.width = w;
        rect.height = h;
        rect.radius = 0;
        rect.cornerSegment = 0;
        return rect;
    }

    roundRect(w: number, h: number, radii?: number) {
        let roundRect = this._renderer.createShape(RoundRectShape3D);
        roundRect.width = w;
        roundRect.height = h;
        roundRect.radius = radii;
        return roundRect;

    }

}