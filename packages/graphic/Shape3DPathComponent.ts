import { BitmapTexture2DArray, ComponentBase, Graphic3DMesh, Scene3D, Vector2 } from "@orillusion/core";
import { Shape3DRenderer } from "./renderer/Shape3DRenderer";
import { RoundRectShape3D } from "./renderer/shape3d/RoundRectShape3D";
import { EllipseShape3D } from "./renderer/shape3d/EllipseShape3D";
import { Shape3DStruct } from "./renderer/shape3d/Shape3D";
import { CircleShape3D } from "./renderer/shape3d/CircleShape3D";
import { LineShape3D } from "./renderer/shape3d/LineShape3D";

export class Shape3DPathComponent extends ComponentBase implements CanvasPath {

    private _basePosition: Vector2 = new Vector2();
    private _renderer: Shape3DRenderer;
    public init(param?: any): void {
        super.init(param);
        this._renderer = this.object3D.getComponent(Shape3DRenderer);
    }

    public static create(name: string, textureList: BitmapTexture2DArray, scene: Scene3D): Shape3DPathComponent {
        let renderer = Graphic3DMesh.drawNode<Shape3DRenderer>(
            name, Shape3DRenderer, Shape3DStruct,
            scene, textureList, 1000, 1000 * 12);
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

    bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): void {
        this._basePosition.set(x, y);
        throw new Error("Method not implemented.");
    }

    closePath(): void {
        throw new Error("Method not implemented.");
    }

    ellipse(x: number, y: number, radiusX: number, radiusY: number, rotation: number, startAngle: number, endAngle: number, counterclockwise?: boolean): EllipseShape3D {
        let ellipse = this._renderer.createShape(EllipseShape3D);
        ellipse.rx = radiusX;
        ellipse.ry = radiusY;
        return ellipse;
    }

    circle(x: number, y: number, radius: number, startAngle: number, endAngle: number, counterclockwise?: boolean): CircleShape3D {
        let circle = this._renderer.createShape(CircleShape3D);
        circle.radius = radius;
        return circle;
    }

    line(x: number, y: number, points: Vector2[]) {
        let line = this._renderer.createShape(LineShape3D);
        line.points = points;
        return line;
    }

    lineTo(x: number, y: number): void {
        this._basePosition.set(x, y);
    }

    moveTo(x: number, y: number): void {
        this._basePosition.set(x, y);
    }

    quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void {
        this._basePosition.set(x, y);
        throw new Error("Method not implemented.");
    }

    rect(x: number, y: number, w: number, h: number): RoundRectShape3D {
        let rect = this._renderer.createShape(RoundRectShape3D);
        rect.width = w;
        rect.height = h;
        rect.radius = 0;
        return rect;
    }

    roundRect(x: number, y: number, w: number, h: number, radii?: number) {
        let roundRect = this._renderer.createShape(RoundRectShape3D);
        roundRect.width = w;
        roundRect.height = h;
        roundRect.radius = radii;
        return roundRect;

    }


}