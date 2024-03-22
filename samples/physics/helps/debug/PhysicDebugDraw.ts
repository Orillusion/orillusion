import Ammo from "@orillusion/ammo/ammo";
import { Vector3, View3D, mergeFunctions } from "@orillusion/core";
import { BtVector3, ToColor, ToVector3 } from "../PhysicTransformUtils";

class DebugLine {
    public id: string;
    public form: Ammo.btVector3;
    public to: Ammo.btVector3;
    public color: Ammo.btVector3;

    public form_ptr: number;
    public to_ptr: number;
    public color_ptr: number;
}
export class PhysicDebugDraw extends Ammo.DebugDrawer implements Ammo.btIDebugDraw {
    private _view: View3D;
    private _lines: Map<string, DebugLine>;
    private _id: number = 0;
    constructor(view: View3D) {
        super();
        this._view = view;
        this._lines = new Map<string, DebugLine>();

        this["setDebugMode"] = (debugMode) => this._setDebugMode(debugMode)
        this["getDebugMode"] = () => this._getDebugMode()
        this["drawLine"] = (from: any, to: any, color: any) => this._drawLine(from, to, color)
        this["drawContactPoint"] = (pointOnB: any, normalOnB: any, distance: number, lifeTime: number, color: any) => this._drawContactPoint(pointOnB, normalOnB, distance, lifeTime, color)
        this["draw3dText"] = (location: any, textString: string) => this._draw3dText(location, textString)
        this["reportErrorWarning"] = (warningString: string) => this._reportErrorWarning(warningString)
    }

    public _drawLine(from: any, to: any, color: any): void {
        let line = new DebugLine();
        line.id = (this._id++).toString();
        line.form_ptr = from;
        line.to_ptr = to;
        line.color_ptr = color;

        this._lines.set(line.id, line);
    }

    public _drawContactPoint(pointOnB: any, normalOnB: any, distance: number, lifeTime: number, color: any) {
        // this._view.graphic3D.drawBox(`${this.id++}`, [ToVector3(from), ToVector3(to)], ToColor(color));
        // console.log('drawContactPoint');
    }
    public _reportErrorWarning(warningString: string) {
        // console.log('reportErrorWarning');
    }
    public _draw3dText(location: any, textString: string) {
        // console.log('draw3dText');
    }
    public _setDebugMode(debugMode: number) {
        // console.log('setDebugMode', debugMode);
    }

    public _getDebugMode(): number {
        // console.log('_getDebugMode');
        return 1;
    }

    public draw() {
        this._view.graphic3D.ClearAll();
        for (const lineDic of this._lines) {
            let line = lineDic[1];
            line.form = Ammo.wrapPointer(line.form_ptr, Ammo.btVector3);
            line.to = Ammo.wrapPointer(line.to_ptr, Ammo.btVector3);
            line.color = Ammo.wrapPointer(line.color_ptr, Ammo.btVector3);
            this._view.graphic3D.drawLines(line.id, [
                new Vector3(line.form.x(), line.form.y(), line.form.z()),
                new Vector3(line.to.x(), line.to.y(), line.to.z()),
                new Vector3(line.color.x(), line.color.y(), line.color.z()),
            ]);
        }
    }
}