import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { CircleShape3D, CurveShape3D, EllipseShape3D, QuadraticCurveShape3D, RoundRectShape3D, LineShape3D, Shape3D } from "@orillusion/graphic";
import { Color, LineJoin, Vector4 } from "@orillusion/core";

export class GUIShape3D {

    public static renderRoundRect(shape: RoundRectShape3D, maxSize: number, open: boolean = true, name?: string) {
        name ||= 'Rect3D_' + shape.shapeIndex;
        GUIHelp.addFolder(name);

        GUIHelp.add(shape, 'width', 0, maxSize, 0.1);
        GUIHelp.add(shape, 'height', 0, maxSize, 0.1);
        GUIHelp.add(shape, 'radius', 0, maxSize, 0.1);
        GUIHelp.add(shape, 'cornerSegment', 0, 10, 1);
        this.renderCommonShape3D(shape, maxSize);
        open && GUIHelp.open();
        GUIHelp.endFolder();
    }

    public static renderCircle(shape: CircleShape3D, maxSize: number, open: boolean = true, name?: string) {
        name ||= 'Circle3D_' + shape.shapeIndex;
        GUIHelp.addFolder(name);
        GUIHelp.add(shape, 'radius', 0, maxSize, 0.1);
        GUIHelp.add(shape, 'segment', 0, 100, 1);
        this.renderCommonShape3D(shape, maxSize);

        open && GUIHelp.open();
        GUIHelp.endFolder();
    }

    public static renderLine(shape: LineShape3D, maxSize: number, open: boolean = true, name?: string) {
        name ||= 'Line3D_' + shape.shapeIndex;
        GUIHelp.addFolder(name);
        GUIHelp.add(shape, 'corner', 0, 50, 1);
        let lineJoin = {}
        lineJoin['miter'] = LineJoin.miter;
        lineJoin['bevel'] = LineJoin.bevel;
        lineJoin['round'] = LineJoin.round;
        GUIHelp.add({ lineJoin: shape.lineJoin }, 'lineJoin', lineJoin).onChange((v) => {
            shape.lineJoin = Number.parseInt(v);
        });
        this.renderCommonShape3D(shape, maxSize);

        for (let i = 0; i < shape.points.length; i++) {
            let point = shape.points[i];
            GUIHelp.add(point, 'x', -10, 10, 0.01).onChange(
                (v) => { shape.points = shape.points; }
            );
            GUIHelp.add(point, 'y', -10, 10, 0.01).onChange(
                (v) => { shape.points = shape.points; }
            );
        }
        open && GUIHelp.open();
        GUIHelp.endFolder();
    }

    public static renderQuadraticCurve(shape: QuadraticCurveShape3D, maxSize: number, open: boolean = true, name?: string) {
        name ||= 'QuadraticCurve_' + shape.shapeIndex;
        GUIHelp.addFolder(name);
        GUIHelp.add(shape, 'segment', 1, 100, 1);
        GUIHelp.add(shape, 'corner', 0, 50, 1);
        let lineJoin = {}
        lineJoin['miter'] = LineJoin.miter;
        lineJoin['bevel'] = LineJoin.bevel;
        lineJoin['round'] = LineJoin.round;
        GUIHelp.add({ lineJoin: shape.lineJoin }, 'lineJoin', lineJoin).onChange((v) => {
            shape.lineJoin = Number.parseInt(v);
        });
        this.renderCommonShape3D(shape, maxSize);
        {
            GUIHelp.add(shape.start, 'x', -10, 10, 0.01).onChange(
                (v) => { shape.start = shape.start; }
            );
            GUIHelp.add(shape.start, 'y', -10, 10, 0.01).onChange(
                (v) => { shape.start = shape.start; }
            );
        }
        {
            GUIHelp.add(shape.cp, 'x', -10, 10, 0.01).onChange(
                (v) => { shape.cp = shape.cp; }
            );
            GUIHelp.add(shape.cp, 'y', -10, 10, 0.01).onChange(
                (v) => { shape.cp = shape.cp; }
            );
        }
        {
            GUIHelp.add(shape.end, 'x', -10, 10, 0.01).onChange(
                (v) => { shape.end = shape.end; }
            );
            GUIHelp.add(shape.end, 'y', -10, 10, 0.01).onChange(
                (v) => { shape.end = shape.end; }
            );
        }
        open && GUIHelp.open();
        GUIHelp.endFolder();
    }

    public static renderCurve(shape: CurveShape3D, maxSize: number, open: boolean = true, name?: string) {
        name ||= 'Curve_' + shape.shapeIndex;
        GUIHelp.addFolder(name);
        GUIHelp.add(shape, 'segment', 1, 100, 1);
        GUIHelp.add(shape, 'corner', 0, 50, 1);
        let lineJoin = {}
        lineJoin['miter'] = LineJoin.miter;
        lineJoin['bevel'] = LineJoin.bevel;
        lineJoin['round'] = LineJoin.round;
        GUIHelp.add({ lineJoin: shape.lineJoin }, 'lineJoin', lineJoin).onChange((v) => {
            shape.lineJoin = Number.parseInt(v);
        });
        this.renderCommonShape3D(shape, maxSize);
        {
            GUIHelp.add(shape.start, 'x', -10, 10, 0.01).onChange(
                (v) => { shape.start = shape.start; }
            );
            GUIHelp.add(shape.start, 'y', -10, 10, 0.01).onChange(
                (v) => { shape.start = shape.start; }
            );
        }
        {
            GUIHelp.add(shape.cp1, 'x', -10, 10, 0.01).onChange(
                (v) => { shape.cp1 = shape.cp1; }
            );
            GUIHelp.add(shape.cp1, 'y', -10, 10, 0.01).onChange(
                (v) => { shape.cp1 = shape.cp1; }
            );
        }
        {
            GUIHelp.add(shape.cp2, 'x', -10, 10, 0.01).onChange(
                (v) => { shape.cp2 = shape.cp2; }
            );
            GUIHelp.add(shape.cp2, 'y', -10, 10, 0.01).onChange(
                (v) => { shape.cp2 = shape.cp2; }
            );
        }
        {
            GUIHelp.add(shape.end, 'x', -10, 10, 0.01).onChange(
                (v) => { shape.end = shape.end; }
            );
            GUIHelp.add(shape.end, 'y', -10, 10, 0.01).onChange(
                (v) => { shape.end = shape.end; }
            );
        }
        open && GUIHelp.open();
        GUIHelp.endFolder();
    }


    public static renderEllipse(shape: EllipseShape3D, maxSize: number, open: boolean = true, name?: string) {
        name ||= 'Ellipse3D_' + shape.shapeIndex;
        GUIHelp.addFolder(name);
        GUIHelp.add(shape, 'rx', 0, maxSize, 0.01);
        GUIHelp.add(shape, 'ry', 0, maxSize, 0.01);
        GUIHelp.add(shape, 'segment', 0, 100, 1);
        this.renderCommonShape3D(shape, maxSize);
        open && GUIHelp.open();
        GUIHelp.endFolder();
    }

    private static renderCommonShape3D(shape: Shape3D, maxSize: number, uvMin: number = 0.01, uvMax: number = 1.0) {
        GUIHelp.add(shape, 'line');
        GUIHelp.add(shape, 'fill');
        GUIHelp.add(shape, 'isClosed');
        GUIHelp.add(shape, 'lineWidth', 0, maxSize, 0.01);

        // GUIHelp.add(shape, 'lineUVRect');
        this.renderUVRect('UVRect.', shape, 'lineUVRect', 0, 10);
        this.renderUVRect('UVRect2.', shape, 'fillUVRect', 0, 10);
        this.renderUVRect('UVSpeed.', shape, 'uvSpeed', -0.1, 0.1);

        GUIHelp.addColor(shape, 'lineColor').onChange(v => {
            let [r, g, b, a] = v;
            shape.lineColor = new Color(r / 255, g / 255, b / 255, a / 255)
        })
        GUIHelp.addColor(shape, 'fillColor').onChange(v => {
            let [r, g, b, a] = v;
            shape.fillColor = new Color(r / 255, g / 255, b / 255, a / 255)
        })
        GUIHelp.add(shape, 'lineTextureID', 0, 9, 1);
        GUIHelp.add(shape, 'fillTextureID', 0, 9, 1);
    }

    private static renderUVRect(name: string, shape3d: Shape3D, shapeKey: string, min: number, max: number) {
        let keys = ['x', 'y', 'z', 'w'];
        let data = {};
        let vec4: Vector4 = shape3d[shapeKey];
        for (let property of keys) {
            data[name + property] = vec4[property];
            GUIHelp.add(data, name + property, min, max, 0.01).onChange(v => {
                vec4[property] = v;
                shape3d[shapeKey] = vec4;
            });

        }
    }
}