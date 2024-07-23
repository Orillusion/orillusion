import { BitmapTexture2DArray, Scene3D, Vector2 } from "@orillusion/core";
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
import { Graphic3DMesh } from "./graphic3d/Graphic3DMesh";


/**
 * A help class for quickly creating Shape3D related objects
 *
 * @export
 * @class Shape3DMaker
 */
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


    /**
     * Create an ellipse in Shape3DRenderer
     *
     * @param {number} radiusX
     * @param {number} radiusY
     * @param {number} rotation
     * @param {number} startAngle
     * @param {number} endAngle
     * @param {boolean} [counterclockwise]
     * @return {*}  {EllipseShape3D}
     * @memberof Shape3DMaker
     */
    ellipse(radiusX: number, radiusY: number, rotation: number, startAngle: number, endAngle: number, counterclockwise?: boolean): EllipseShape3D {
        let ellipse = this._renderer.createShape(EllipseShape3D);
        ellipse.rx = radiusX;
        ellipse.ry = radiusY;
        ellipse.rotation = rotation;
        ellipse.startAngle = startAngle || 0;
        ellipse.endAngle = endAngle || 360;
        return ellipse;
    }


    /**
     * Create an arc in Shape3DRenderer
     *
     * @param {number} radius
     * @param {number} startAngle
     * @param {number} endAngle
     * @param {boolean} [counterclockwise]
     * @return {*}  {CircleShape3D}
     * @memberof Shape3DMaker
     */
    arc(radius: number, startAngle: number, endAngle: number, counterclockwise?: boolean): CircleShape3D {
        let circle = this._renderer.createShape(CircleShape3D);
        circle.radius = radius;
        circle.startAngle = startAngle || 0;
        circle.endAngle = endAngle || 360;
        return circle;
    }


    /**
     * Create line segments in Shape3DRenderer
     *
     * @param {Vector2[]} points
     * @return {*} 
     * @memberof Shape3DMaker
     */
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


    /**
     * Create a quadratic curve in Shape3DRenderer
     *
     * @param {number} fx
     * @param {number} fy
     * @param {number} cpx
     * @param {number} cpy
     * @param {number} tx
     * @param {number} ty
     * @return {*}  {QuadraticCurveShape3D}
     * @memberof Shape3DMaker
     */
    quadraticCurve(fx: number, fy: number, cpx: number, cpy: number, tx: number, ty: number): QuadraticCurveShape3D {
        let curve = this._renderer.createShape(QuadraticCurveShape3D);
        curve.start = new Vector2(fx, fy);
        curve.end = new Vector2(tx, ty);
        curve.cp = new Vector2(cpx, cpy);
        return curve;
    }

    /**
     * Create a curve in Shape3DRenderer
     *
     * @param {number} fx
     * @param {number} fy
     * @param {number} cp1x
     * @param {number} cp1y
     * @param {number} cp2x
     * @param {number} cp2y
     * @param {number} tx
     * @param {number} ty
     * @return {*}  {CurveShape3D}
     * @memberof Shape3DMaker
     */
    curve(fx: number, fy: number, cp1x: number, cp1y: number, cp2x: number, cp2y: number, tx: number, ty: number): CurveShape3D {
        let curve = this._renderer.createShape(CurveShape3D);
        curve.start = new Vector2(fx, fy);
        curve.end = new Vector2(tx, ty);
        curve.cp1 = new Vector2(cp1x, cp1y);
        curve.cp2 = new Vector2(cp2x, cp2y);
        return curve;
    }


    /**
     * Create a path2D in Shape3DRenderer. Through the Path2DShape3D, you can use the CanvasPath API for path drawing on xz plane.
     *
     * @return {*}  {Path2DShape3D}
     * @memberof Shape3DMaker
     */
    path2D(): Path2DShape3D {
        return this._renderer.createShape(Path2DShape3D);
    }

    /**
     * Create a path3D in Shape3DRenderer. Through the Path3DShape3D, you can use the similar CanvasPath API for path drawing in 3D space.
     *
     * @return {*}  {Path3DShape3D}
     * @memberof Shape3DMaker
     */
    path3D(): Path3DShape3D {
        return this._renderer.createShape(Path3DShape3D);
    }

    /**
     * Create a rect in Shape3DRenderer
     *
     * @param {number} w
     * @param {number} h
     * @return {*}  {RoundRectShape3D}
     * @memberof Shape3DMaker
     */
    rect(w: number, h: number): RoundRectShape3D {
        let rect = this._renderer.createShape(RoundRectShape3D);
        rect.width = w;
        rect.height = h;
        rect.radius = 0;
        rect.cornerSegment = 0;
        return rect;
    }


    /**
     * Create a RoundRect in Shape3DRenderer
     *
     * @param {number} w
     * @param {number} h
     * @param {number} [radii]
     * @return {*} 
     * @memberof Shape3DMaker
     */
    roundRect(w: number, h: number, radii?: number): RoundRectShape3D {
        let roundRect = this._renderer.createShape(RoundRectShape3D);
        roundRect.width = w;
        roundRect.height = h;
        roundRect.radius = radii;
        return roundRect;

    }

}