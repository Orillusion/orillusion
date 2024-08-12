import { Color, Engine3D, Vector3 } from "@orillusion/core";
import { Shape2D } from "./ExtrudeGeometry/Shape2D";
import { ExtrudeGeometry, ExtrudeGeometryArgs } from "./ExtrudeGeometry/ExtrudeGeometry";
import { ShapeUtils } from "./ExtrudeGeometry/ShapeUtils";

export type TextGeometryArgs = {
    curveSegments?: number;
    steps?: number;
    depth?: number;
    bevelEnabled?: boolean;
    bevelThickness?: number;
    bevelSize?: number;
    bevelOffset?: number;
    bevelSegments?: number;
    font?:any;
    fontSize?:number;
}

export class TextGeometry extends ExtrudeGeometry {
    private _text: string;

    constructor(text?: string, options?: TextGeometryArgs) {
        super([], options);
        this.options = options;
        if (text) {
            this.text = text;
        }
    }

    public get font(): any {
        return (this.options as TextGeometryArgs).font;
    }

    public get text(): string {
        return this._text
    }

    public get fontSize(): number {
        return (this.options as TextGeometryArgs).fontSize;
    }

    public set fontSize(v: number) {
        (this.options as TextGeometryArgs).fontSize = v;
    }

    public set text(v: string) {
        this._text = v;
        let paths = this.font.getPath(v, 0, 0, this.fontSize);
        this.buildShape(paths);
        this.buildGeometry(this.options);
    }

    protected buildShape(path: any) {
        let first: any, latest: any;
        let shape2D = new Shape2D();
        const commands = path.commands;
        for (let i = 0; i < commands.length; i++) {
            const c = commands[i];
            shape2D = shape2D || new Shape2D();
            switch (c.type) {
                case 'M': shape2D.moveTo(c.x, -c.y); first = c; break;
                case 'L': shape2D.lineTo(c.x, -c.y); latest = c; break;
                case 'C': shape2D.bezierCurveTo(c.x1, -c.y1, c.x2, -c.y2, c.x, -c.y); latest = c; break;
                case 'Q': shape2D.quadraticCurveTo(c.x1, -c.y1, c.x, -c.y); latest = c; break;
                case 'Z':
                    shape2D.lineTo(first.x, -first.y);
                    if (ShapeUtils.isClockWise(shape2D.getPoints(1))) {
                        this.shapes.push(shape2D);
                    } else {
                        for (let shape of this.shapes) {
                            if (shape.isIntersect(shape2D)) {
                                shape.holes.push(shape2D);
                            }
                        }
                    }
                    shape2D = null;
                    break;
            }
        }

        if (shape2D) {
            this.shapes.push(shape2D);
        }
    }
}
