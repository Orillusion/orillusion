import { Color } from "../../../../math/Color";
import { DEGREES_TO_RADIANS } from "../../../../math/MathUtil";
import { Vector3 } from "../../../../math/Vector3";
import { GraphicConfig } from "./GraphicConfig";

/**
 * @internal
 */
export class Graphics3DShape {
    public uuid: string;
    public type: string;
    public color: Color;
    public count: number = 0;
    public shapeData: Float32Array;
    public dirtyData: boolean = false;
    public memoryDataIndex: number = -1;
    protected transformIndex: number;

    constructor(transformIndex: number) {
        this.transformIndex = transformIndex;
    }

    public buildAxis(origin: Vector3 = new Vector3(0, 0, 0), size: number = 10) {
        this.buildLines([origin, new Vector3(origin.x + size, origin.y, origin.z)], Color.hexRGBColor(Color.RED));
        this.buildLines([origin, new Vector3(origin.x, origin.y + size, origin.z)], Color.hexRGBColor(Color.GREEN));
        this.buildLines([origin, new Vector3(origin.x, origin.y, origin.z + size)], Color.hexRGBColor(Color.BLUE));
    }

    public buildLines(points: Vector3[], colors: Color | Color[] = Color.COLOR_WHITE) {
        if (points.length < 2) {
            return;
        }

        if (points.length == 2) {
            this.fillShapeData(points, colors);
            return;
        }

        var linePoints = new Array<Vector3>(points.length + points.length - 2);
        for (let i = 1, index = 0; i < points.length; ++i) {
            linePoints[index++] = points[i - 1];
            linePoints[index++] = points[i];
        }
        this.fillShapeData(linePoints, colors);
    }

    public buildArcLine(center: Vector3, radius: number, startAngle: number, endAngle: number, segments: number = 16, up: Vector3 = Vector3.Y_AXIS, color: Color = Color.COLOR_WHITE) {
        const totalAngle = (endAngle - startAngle) * DEGREES_TO_RADIANS;
        startAngle *= DEGREES_TO_RADIANS
        var points: Vector3[] = [];
        for (let i = 0; i <= segments; ++i) {
            if (i > 1) {
                points.push(points[points.length - 1]);
            }
            var verAngle: number = totalAngle * (i / segments) + startAngle;
            var x: number = radius * Math.cos(verAngle);
            var y: number = radius * Math.sin(verAngle);
            switch (up) {
                case Vector3.X_AXIS:
                    points.push(center.add(new Vector3(0, x, y)));
                    break;
                case Vector3.Y_AXIS:
                    points.push(center.add(new Vector3(x, 0, y)));
                    break;
                case Vector3.Z_AXIS:
                    points.push(center.add(new Vector3(x, y, 0)));
                    break;
                default:
                    points.push(center.add(new Vector3(x, y, 0)));
                    break;
            }
        }
        this.fillShapeData(points, color);
    }

    public buildCircle(center: Vector3, radius: number, segments: number = 32, up: Vector3 = Vector3.Y_AXIS, color: Color = Color.COLOR_WHITE) {
        var points: Vector3[] = [];
        for (let i = 0; i <= segments; ++i) {
            var verAngle: number = (2 * Math.PI * i) / segments;
            var x: number = radius * Math.cos(verAngle);
            var y: number = radius * Math.sin(verAngle);
            switch (up) {
                case Vector3.X_AXIS:
                    points.push(center.add(new Vector3(0, x, y)));
                    break;
                case Vector3.Y_AXIS:
                    points.push(center.add(new Vector3(x, 0, y)));
                    break;
                case Vector3.Z_AXIS:
                    points.push(center.add(new Vector3(x, y, 0)));
                    break;
                default:
                    points.push(center.add(new Vector3(x, y, 0)));
                    break;
            }
            if (i > 0) points.push(points[points.length - 1]);
        }
        points.push(points[0]);
        this.fillShapeData(points, color);
    }

    public fillShapeData(points: Vector3[], colors: Color | Color[]) {
        if (!this.shapeData) {
            this.shapeData = new Float32Array(GraphicConfig.ShapeVertexSize * points.length);
        } else if (this.count + GraphicConfig.ShapeVertexSize * points.length >= this.shapeData.length) {
            let tmp = new Float32Array(this.shapeData.length + GraphicConfig.ShapeVertexSize * points.length);
            tmp.set(this.shapeData);
            this.shapeData = tmp;
        }

        const shapeData = this.shapeData;
        for (let i = 0; i < points.length; ++i) {
            const point = points[i];
            shapeData[this.count++] = point.x;
            shapeData[this.count++] = point.y;
            shapeData[this.count++] = point.z;
            shapeData[this.count++] = this.transformIndex;

            if (colors instanceof Color) {
                shapeData[this.count++] = colors.r;
                shapeData[this.count++] = colors.g;
                shapeData[this.count++] = colors.b;
                shapeData[this.count++] = colors.a;
            } else {
                const color = colors[i];
                shapeData[this.count++] = color.r;
                shapeData[this.count++] = color.g;
                shapeData[this.count++] = color.b;
                shapeData[this.count++] = color.a;
            }
        }

        this.dirtyData = true;
    }

    public reset() {
        this.count = 0;
    }
}
