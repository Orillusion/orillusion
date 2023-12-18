import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { CircleShape3D, EllipseShape3D, RoundRectShape3D } from "@orillusion/graphic";

export class GUIShape3D {

    public static renderRoundRect(shape: RoundRectShape3D, size: number, open: boolean = true, name?: string) {
        name ||= 'Shape3D_' + shape.instanceID;
        GUIHelp.addFolder(name);
        GUIHelp.add(shape, 'line');
        GUIHelp.add(shape, 'fill');
        GUIHelp.add(shape, 'width', 0, size, 0.1);
        GUIHelp.add(shape, 'height', 0, size, 0.1);
        GUIHelp.add(shape, 'radius', 0, size, 0.1);
        GUIHelp.add(shape, 'lineWidth', 0, size, 0.01);
        GUIHelp.add(shape, 'cornerSegment', 0, 10, 1);

        open && GUIHelp.open();
        GUIHelp.endFolder();
    }

    public static renderCircle(shape: CircleShape3D, maxSize: number, open: boolean = true, name?: string) {
        name ||= 'Circle3D_' + shape.instanceID;
        GUIHelp.addFolder(name);
        GUIHelp.add(shape, 'line');
        GUIHelp.add(shape, 'fill');
        GUIHelp.add(shape, 'radius', 0, maxSize, 0.1);
        GUIHelp.add(shape, 'segment', 0, 100, 1);
        GUIHelp.add(shape, 'lineWidth', 0, maxSize, 0.01);

        open && GUIHelp.open();
        GUIHelp.endFolder();
    }

    public static renderEllipse(shape: EllipseShape3D, maxSize: number, open: boolean = true, name?: string) {
        name ||= 'Ellipse3D_' + shape.instanceID;
        GUIHelp.addFolder(name);
        GUIHelp.add(shape, 'rx', 0, maxSize, 0.01);
        GUIHelp.add(shape, 'ry', 0, maxSize, 0.01);
        GUIHelp.add(shape, 'line');
        GUIHelp.add(shape, 'fill');
        GUIHelp.add(shape, 'segment', 0, 100, 1);
        GUIHelp.add(shape, 'lineWidth', 0, maxSize, 0.01);

        open && GUIHelp.open();
        GUIHelp.endFolder();
    }
}