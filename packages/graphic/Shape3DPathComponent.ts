import { BitmapTexture2DArray, ComponentBase, Graphic3DMesh, Scene3D, Vector2 } from "@orillusion/core";
import { Shape3DRenderer } from "./renderer/Shape3DRenderer";
import { RoundRectShape3D } from "./renderer/shape3d/RoundRectShape3D";
import { EllipseShape3D } from "./renderer/shape3d/EllipseShape3D";
import { Shape3DStruct } from "./renderer/shape3d/Shape3D";
import { CircleShape3D } from "./renderer/shape3d/CircleShape3D";
import { LineShape3D } from "./renderer/shape3d/LineShape3D";
import { QuadraticCurveShape3D } from "./renderer/shape3d/QuadraticCurveShape3D";
import { CurveShape3D } from "./renderer/shape3d/CurveShape3D";

export class Shape3DPathComponent extends ComponentBase {

    private _renderer: Shape3DRenderer;
    public init(param?: any): void {
        super.init(param);
        this._renderer = this.object3D.getComponent(Shape3DRenderer);
    }

    public static create(name: string, textureList: BitmapTexture2DArray, scene: Scene3D): Shape3DPathComponent {
        let renderer = Graphic3DMesh.drawNode<Shape3DRenderer>(
            name, Shape3DRenderer, Shape3DStruct,
            scene, textureList, 1000, 1000 * 12, true);
        let pathComponent = renderer.object3D.addComponent(Shape3DPathComponent);
        return pathComponent;
    }

    public get renderer() {
        return this._renderer;
    }

    arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, counterclockwise?: boolean): void {
        throw new Error("Method not implemented.");
    }

    arcTo(x1: number, y1: number, x2: number, y2: number, radius: number): void {
        throw new Error("Method not implemented.");
    }

    ellipse(radiusX: number, radiusY: number, rotation: number, startAngle: number, endAngle: number, counterclockwise?: boolean): EllipseShape3D {
        let ellipse = this._renderer.createShape(EllipseShape3D);
        ellipse.rx = radiusX;
        ellipse.ry = radiusY;
        return ellipse;
    }

    circle(radius: number, startAngle: number, endAngle: number, counterclockwise?: boolean): CircleShape3D {
        let circle = this._renderer.createShape(CircleShape3D);
        circle.radius = radius;
        return circle;
    }

    line(points: Vector2[]) {
        let line = this._renderer.createShape(LineShape3D);
        line.points = points;
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


    rect(w: number, h: number): RoundRectShape3D {
        let rect = this._renderer.createShape(RoundRectShape3D);
        rect.width = w;
        rect.height = h;
        rect.radius = 0;
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