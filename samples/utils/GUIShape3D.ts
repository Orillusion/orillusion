import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { CircleShape3D, CurveShape3D, EllipseShape3D, QuadraticCurveShape3D, RoundRectShape3D, LineShape3D, Shape3D, CircleArcType, Path2DShape3D, Path3DShape3D } from "@orillusion/graphic";
import { LineJoin } from "@orillusion/graphic";
import { GUIUtil } from "./GUIUtil";

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
        GUIHelp.add(shape, 'startAngle', 0, 360, 1);
        GUIHelp.add(shape, 'endAngle', 0, 360, 1);
        let arcType = {}
        arcType['sector'] = CircleArcType.Sector;
        arcType['moon'] = CircleArcType.Moon;
        GUIHelp.add({ arcType: shape.arcType }, 'arcType', arcType).onChange((v) => {
            shape.arcType = Number.parseInt(v);
        });

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

        if (!(shape instanceof Path3DShape3D) && !(shape instanceof Path2DShape3D)) {
            for (let i = 0; i < shape.points3D.length; i++) {
                let point = shape.points3D[i];
                GUIHelp.add(point, 'x', -10, 10, 0.01).onChange(
                    (v) => { shape.points3D = shape.points3D; }
                );
                GUIHelp.add(point, 'y', -10, 10, 0.01).onChange(
                    (v) => { shape.points3D = shape.points3D; }
                );
            }
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
        GUIUtil.RenderVector2('Start.', shape, 'start', -10, 10, 0.01);
        GUIUtil.RenderVector2('End2.', shape, 'end', -10, 10, 0.01);
        GUIUtil.RenderVector2('CP.', shape, 'cp', -10, 10, 0.01);
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

        GUIUtil.RenderVector2('Start.', shape, 'start', -10, 10, 0.01);
        GUIUtil.RenderVector2('End2.', shape, 'end', -10, 10, 0.01);
        GUIUtil.RenderVector2('CP1.', shape, 'cp1', -10, 10, 0.01);
        GUIUtil.RenderVector2('CP2.', shape, 'cp2', -10, 10, 0.01);

        open && GUIHelp.open();
        GUIHelp.endFolder();
    }


    public static renderEllipse(shape: EllipseShape3D, maxSize: number, open: boolean = true, name?: string) {
        name ||= 'Ellipse3D_' + shape.shapeIndex;
        GUIHelp.addFolder(name);
        GUIHelp.add(shape, 'rx', 0, maxSize, 0.01);
        GUIHelp.add(shape, 'ry', 0, maxSize, 0.01);
        GUIHelp.add(shape, 'segment', 0, 100, 1);
        GUIHelp.add(shape, 'rotation', -Math.PI, Math.PI, 0.01);

        GUIHelp.add(shape, 'startAngle', 0, 360, 1);
        GUIHelp.add(shape, 'endAngle', 0, 360, 1);

        let arcType = {}
        arcType['sector'] = CircleArcType.Sector;
        arcType['moon'] = CircleArcType.Moon;
        GUIHelp.add({ arcType: shape.arcType }, 'arcType', arcType).onChange((v) => {
            shape.arcType = Number.parseInt(v);
        });

        this.renderCommonShape3D(shape, maxSize);
        open && GUIHelp.open();
        GUIHelp.endFolder();
    }

    private static renderCommonShape3D(shape: Shape3D, maxSize: number, uvMin: number = 0.01, uvMax: number = 1.0) {
        GUIHelp.add(shape, 'line');
        GUIHelp.add(shape, 'fill');
        GUIHelp.add(shape, 'isClosed');
        GUIHelp.add(shape, 'lineWidth', 0, maxSize, 0.01);
        GUIHelp.add(shape, 'fillRotation', -Math.PI, Math.PI, 0.01);

        GUIUtil.RenderVector4('FillUVRect.', shape, 'fillUVRect', 0, 10, 0.01);
        GUIUtil.RenderVector4('LineUVRect.', shape, 'lineUVRect', 0, 10, 0.01);
        GUIUtil.RenderVector4('UVSpeed.', shape, 'uvSpeed', -0.01, 0.01, 0.0001);

        GUIUtil.RenderColor(shape, 'lineColor');
        GUIUtil.RenderColor(shape, 'fillColor');

        GUIHelp.add(shape, 'lineTextureID', 0, 9, 1);
        GUIHelp.add(shape, 'fillTextureID', 0, 9, 1);
    }


}