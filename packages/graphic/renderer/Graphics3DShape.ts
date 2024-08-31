import { Color, DEGREES_TO_RADIANS, Vector3 } from "@orillusion/core";

/**
 * @internal
 */
export class Graphics3DShape {
    public uuid: string;
    public type: string;
    public color: Color;
    public count: number = 0;
    public pointData: Float32Array;
    public colorData: Float32Array;
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

    public fillShapeData(points: Vector3[], colors: Color | Color[], forceUpdate: boolean = false) {
        if (!this.pointData) {
            this.pointData = new Float32Array(4 * points.length);
            this.colorData = new Float32Array(4 * points.length);
        } else if (this.count + 4 * points.length >= this.pointData.length) {
            let tmp = new Float32Array(this.pointData.length + 4 * points.length);
            tmp.set(this.pointData);
            this.pointData = tmp;

            tmp = new Float32Array(this.colorData.length + 4 * points.length);
            tmp.set(this.colorData);
            this.colorData = tmp;
        }

        if (forceUpdate || this.dirtyData == false) {
            const pointData = this.pointData;
            let index = this.count;
            for (let i = 0; i < points.length; ++i) {
                const point = points[i];
                pointData[this.count++] = point.x;
                pointData[this.count++] = point.y;
                pointData[this.count++] = point.z;
                pointData[this.count++] = this.transformIndex;
            }

            const colorData = this.colorData;
            for (let i = 0; i < points.length; ++i) {
                if (colors instanceof Color) {
                    colorData[index++] = colors.r;
                    colorData[index++] = colors.g;
                    colorData[index++] = colors.b;
                    colorData[index++] = colors.a;
                } else {
                    const color = colors[i];
                    colorData[index++] = color.r;
                    colorData[index++] = color.g;
                    colorData[index++] = color.b;
                    colorData[index++] = color.a;
                }
            }
        }

        this.dirtyData = true;
    }

    public reset() {
        this.count = 0;
    }
}
