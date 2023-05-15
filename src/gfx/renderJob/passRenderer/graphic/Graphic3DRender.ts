import { GeometryBase } from "../../../../core/geometry/GeometryBase";
import { Color } from "../../../../math/Color";
import { Vector3 } from "../../../../math/Vector3";
import { DEGREES_TO_RADIANS } from "../../../../math/MathUtil";
import { Transform } from "../../../../components/Transform";
import { BoundingBox } from "../../../../core/bound/BoundingBox";
import { Camera3D } from "../../../../core/Camera3D";
import { CameraType } from "../../../../core/CameraType";
import { Object3D } from "../../../../core/entities/Object3D";
import { Object3DUtil } from "../../../../util/Object3DUtil";
import { Graphics3DShape } from "./Graphics3DShape";
import { GraphicConfig } from "./GraphicConfig";
import { Graphic3DFillRenderer } from "./Graphic3DFillRenderer";
import { Graphic3DLineBatchRenderer } from "./Graphic3DLineBatchRenderer";

export class Graphic3D extends Object3D {

    protected mLineRender: Graphic3DLineBatchRenderer;
    protected mFillRender: Graphic3DFillRenderer;

    constructor() {
        super();
        this.mLineRender = this.addComponent(Graphic3DLineBatchRenderer);
        this.mFillRender = this.addComponent(Graphic3DFillRenderer);
    }

    /**
     * Draw the 3 - dimensional axes
     * @param uuid Graphic identification ID
     * @param origin original point
     * @param size Length of axis
     */
    public drawAxis(uuid: string, origin: Vector3 = new Vector3(0, 0, 0), size: number = 10) {
        this.createCustomShape(uuid).buildAxis(
            origin, size
        );
    }

    /**
     * Draw a line
     * @param uuid Graphic identification ID
     * @param points Line path point
     * @param color Color
     */
    public drawLines(uuid: string, points: Vector3[], colors: Color | Color[] = Color.COLOR_WHITE) {
        this.createCustomShape(uuid).buildLines(
            points, colors
        );
    }

    /**
     * drawing curve
     * @param uuid Graphic identification ID
     * @param points Curve position point
     * @param samples Number of Samples
     * @param tension Strength of curve
     * @param color Color of curve
     */
    public drawCurve(uuid: string, points: Vector3[], samples: number = 10, tension: number = 0.5, color: Color = Color.COLOR_WHITE) {
        var result: Vector3[] = [];
        let u = new Vector3(), v = new Vector3();
        for (let i = 0; i < points.length - 1; ++i) {
            result.push(points[i]);

            const p0 = points[Math.max(i - 1, 0)];
            const p1 = points[i];
            const p2 = points[i + 1];
            const p3 = points[Math.min(i + 2, points.length - 1)];

            // let u = (p2 - p0) * (tension / 3.0) + p1;
            p2.subtract(p0, u).multiplyScalar(tension / 3.0).add(p1, u);
            // let v = (p1 - p3) * (tension / 3.0) + p2;
            p1.subtract(p3, v).multiplyScalar(tension / 3.0).add(p2, v);

            result.push(...this.calculateBezierCurve(p1, u, v, p2, samples));
        }
        result.push(points[points.length - 1]);
        this.drawLines(uuid, result, color);
    }

    protected calculateBezierCurve(p0: Vector3, p1: Vector3, p2: Vector3, p3: Vector3, samples: number): Vector3[] {
        var result = new Array<Vector3>(samples);
        for (let i = 0; i < samples; ++i) {
            let t = (i + 1) / (samples + 1.0);
            let _1t = 1 - t;
            let v0 = p0.mul(_1t * _1t * _1t);
            let v1 = p1.mul(3 * t * _1t * _1t);
            let v2 = p2.mul(3 * t * t * _1t);
            let v3 = p3.mul(t * t * t);
            result[i] = v0.add(v1).add(v2).add(v3);
        }
        return result;
    }

    /**
     * Draw a rectangle
     * @param uuid Graphic identification ID
     * @param origin original point
     * @param width Width of rectangle
     * @param height Height of rectangle
     * @param color The color of the rectangle
     */
    public drawRect(uuid: string, origin: Vector3, width: number, height: number, color: Color = Color.COLOR_WHITE) {
        this.drawLines(uuid, [
            origin,
            new Vector3(origin.x + width, origin.y, origin.z),
            new Vector3(origin.x + width, origin.y + height, origin.z),
            new Vector3(origin.x, origin.y + height, origin.z),
            origin,
        ], color);
    }

    /**
     * Draw a circle
     * @param uuid Graphic identification ID
     * @param center centre point
     * @param radius radius
     * @param segments Number of line segments
     * @param up Direction of plane
     * @param color The color of the circle
     */
    public drawCircle(uuid: string, center: Vector3, radius: number, segments: number = 32, up: Vector3 = Vector3.Y_AXIS, color: Color = Color.COLOR_WHITE) {
        this.createCustomShape(uuid).buildCircle(
            center, radius, segments, up, color
        );
    }

    /**
     * Draw a Sector
     * @param uuid Graphic identification ID
     * @param center centre point
     * @param radius radius
     * @param startAngle Angle of onset
     * @param endAngle Angle of end
     * @param segments number of segments
     * @param up Direction of plane
     * @param color The color of the sector
     */
    public drawSector(uuid: string, center: Vector3, radius: number, startAngle: number, endAngle: number, segments: number = 16, up: Vector3 = Vector3.Y_AXIS, color: Color = Color.COLOR_WHITE) {
        const totalAngle = (endAngle - startAngle) * DEGREES_TO_RADIANS;
        startAngle *= DEGREES_TO_RADIANS
        var points: Vector3[] = [];
        points.push(center);
        for (let i = 0; i <= segments; ++i) {
            if (i > 0) {
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
        points.push(points[points.length - 1]);
        points.push(center);
        this.mLineRender.fillShapeData(uuid, 'line', color, points);
    }

    /**
     * Draw a ArcLine
     * @param uuid Graphic identification ID
     * @param center centre point
     * @param radius radius
     * @param startAngle  Angle of onset
     * @param endAngle Angle of end
     * @param segments  number of segments
     * @param up Direction of plane
     * @param color The color of the sector
     */
    public drawArcLine(uuid: string, center: Vector3, radius: number, startAngle: number, endAngle: number, segments: number = 16, up: Vector3 = Vector3.Y_AXIS, color: Color = Color.COLOR_WHITE) {
        this.mLineRender.allocGraphics3DShape(uuid, this.transform._worldMatrix.index).buildArcLine(
            center, radius, startAngle, endAngle, segments, up, color
        );
    }

    /**
     * Creates a custom line segment graph and returns a Shape with the same uuid from the pool if it already exists.
     * @param uuid Graphic identification ID
     * @param parentTransform Parent node Transform
     * @returns Graphics3DShape
     */
    public createCustomShape(uuid: string, parentTransform: Transform = this.transform): Graphics3DShape {
        return this.mLineRender.allocGraphics3DShape(uuid, parentTransform._worldMatrix.index);
    }

    /**
     * Draw the box
     * @param uuid Graphic identification ID
     * @param minPoint Point of minimum
     * @param maxPoint Point of maximum
     * @param color The color of the box
     */
    public drawBox(uuid: string, minPoint: Vector3, maxPoint: Vector3, color: Color = Color.COLOR_WHITE) {
        var points: Vector3[] = [];

        points.push(minPoint);
        points.push(new Vector3(maxPoint.x, minPoint.y, minPoint.z));
        points.push(points[points.length - 1]);
        points.push(new Vector3(maxPoint.x, maxPoint.y, minPoint.z));
        points.push(points[points.length - 1]);
        points.push(new Vector3(minPoint.x, maxPoint.y, minPoint.z));
        points.push(points[points.length - 1]);
        points.push(minPoint);

        points.push(points[points.length - 1]);
        points.push(new Vector3(minPoint.x, minPoint.y, maxPoint.z));
        points.push(points[points.length - 1]);
        points.push(new Vector3(maxPoint.x, minPoint.y, maxPoint.z));
        points.push(points[points.length - 1]);
        points.push(new Vector3(maxPoint.x, maxPoint.y, maxPoint.z));
        points.push(points[points.length - 1]);
        points.push(new Vector3(minPoint.x, maxPoint.y, maxPoint.z));
        points.push(points[points.length - 1]);
        points.push(new Vector3(minPoint.x, minPoint.y, maxPoint.z));

        points.push(new Vector3(minPoint.x, maxPoint.y, minPoint.z));
        points.push(new Vector3(minPoint.x, maxPoint.y, maxPoint.z));

        points.push(new Vector3(maxPoint.x, maxPoint.y, minPoint.z));
        points.push(new Vector3(maxPoint.x, maxPoint.y, maxPoint.z));

        points.push(new Vector3(maxPoint.x, minPoint.y, minPoint.z));
        points.push(new Vector3(maxPoint.x, minPoint.y, maxPoint.z));

        this.mLineRender.fillShapeData(uuid, 'line', color, points);
    }

    /**
     * Draw the fill rectangle
     * @param uuid Graphic identification ID
     * @param minPoint Point of minimum
     * @param maxPoint Point of maximum
     * @param color The color of the fill rectangle
     */
    public drawFillRect(uuid: string, origin: Vector3, width: number, height: number, color: Color = Color.COLOR_WHITE) {
        this.mFillRender.fillShapeData(uuid, 'fill', color, [
            origin,
            new Vector3(origin.x + width, origin.y, origin.z),
            new Vector3(origin.x + width, origin.y + height, origin.z),
            new Vector3(origin.x + width, origin.y + height, origin.z),
            new Vector3(origin.x, origin.y + height, origin.z),
            origin
        ]);
    }

    /**
     * Draw the fill circle
     * @param uuid Graphic identification ID
     * @param center centre point
     * @param radius radius
     * @param segments number of segments
     * @param up Direction of plane
     * @param color The color of the fill circle
     */
    public drawFillCircle(uuid: string, center: Vector3, radius: number, segments: number = 32, up: Vector3 = Vector3.Y_AXIS, color: Color = Color.COLOR_WHITE) {
        var points: Vector3[] = [];
        points.push(center);
        for (let i = 0; i <= segments; ++i) {
            if (i >= 2) {
                points.push(center);
                points.push(points[points.length - 2]);
            }
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
        }
        this.mFillRender.fillShapeData(uuid, 'fill', color, points);
    }

    /**
     * Draw wire frame for geometry
     * @param uuid Graphic identification ID
     * @param geometry Geometric object
     * @param transform The Transform that needs to be bound
     * @param color The color of the wire frame
     */
    public drawMeshWireframe(uuid: string, geometry: GeometryBase, transform: Transform, color: Color = Color.COLOR_WHITE) {
        if (geometry) this.createCustomShape(uuid, transform ? transform : this.transform).fillShapeData(
            geometry.genWireframe(),
            color
        );
    }

    /**
     * Draw the fill sector
     * @param uuid Graphic identification ID
     * @param center centre point
     * @param radius radius
     * @param startAngle Angle of onset
     * @param endAngle Angle of end
     * @param segments number of segments
     * @param up Direction of plane
     * @param color The color of the fill sector
     */
    public drawFillSector(uuid: string, center: Vector3, radius: number, startAngle: number, endAngle: number, segments: number = 16, up: Vector3 = Vector3.Y_AXIS, color: Color = Color.COLOR_WHITE) {
        const totalAngle = (endAngle - startAngle) * DEGREES_TO_RADIANS;
        startAngle *= DEGREES_TO_RADIANS
        var points: Vector3[] = [];
        points.push(center);
        for (let i = 0; i <= segments; ++i) {
            if (i >= 2) {
                points.push(center);
                points.push(points[points.length - 2]);
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
        this.mFillRender.fillShapeData(uuid, 'fill', color, points);
    }

    /**
     * Draw bounding box
     * @param uuid Graphic identification ID
     * @param boundingBox Bounding box object
     * @param color The color of the bounding box
     */
    public drawBoundingBox(uuid: string, boundingBox: BoundingBox, color: Color = Color.COLOR_WHITE) {
        this.drawBox(uuid, boundingBox.worldMin, boundingBox.worldMax, color);
    }

    /**
     * Draw the camera cone
     * @param camera The camera to display the cone
     * @param color The color of the camera cone
     */
    public drawCameraFrustum(camera: Camera3D, color: Color = Color.COLOR_WHITE) {
        if (camera.type == CameraType.perspective) {
            let y = Math.tan(camera.fov / 2 * DEGREES_TO_RADIANS);
            let x = y * camera.aspect;
            let worldMatrix = camera.transform._worldMatrix;

            let f0 = worldMatrix.transformVector(new Vector3(-x, -y, 1));
            let f1 = worldMatrix.transformVector(new Vector3(-x, y, 1));
            let f2 = worldMatrix.transformVector(new Vector3(x, -y, 1));
            let f3 = worldMatrix.transformVector(new Vector3(x, y, 1));

            let far = camera.far;
            let near = camera.near;
            let pos = camera.transform.worldPosition;

            let farLB = new Vector3().copyFrom(f0).multiplyScalar(far).add(pos);
            let farLT = new Vector3().copyFrom(f1).multiplyScalar(far).add(pos);
            let farRB = new Vector3().copyFrom(f2).multiplyScalar(far).add(pos);
            let farRT = new Vector3().copyFrom(f3).multiplyScalar(far).add(pos);

            let nearLB = new Vector3().copyFrom(f0).multiplyScalar(near).add(pos);
            let nearLT = new Vector3().copyFrom(f1).multiplyScalar(near).add(pos);
            let nearRB = new Vector3().copyFrom(f2).multiplyScalar(near).add(pos);
            let nearRT = new Vector3().copyFrom(f3).multiplyScalar(near).add(pos);

            let custom = this.createCustomShape(`CameraFrustum_${camera.object3D.uuid}`);
            custom.buildLines([nearLT, farLT], color);
            custom.buildLines([nearLB, farLB], color);
            custom.buildLines([nearRT, farRT], color);
            custom.buildLines([nearRB, farRB], color);
            custom.buildLines([farLT, farRT, farRB, farLB, farLT], color);
            custom.buildLines([nearLT, nearRT, nearRB, nearLB, nearLT], color);
        } else if (camera.type == CameraType.ortho) {
            camera.viewPort;
            camera.viewPort.height;
            let worldMatrix = camera.transform.worldMatrix;
            let farLT = worldMatrix.transformVector(new Vector3(camera.viewPort.width * -0.5, camera.viewPort.height * 0.5, camera.far));
            let farLB = worldMatrix.transformVector(new Vector3(camera.viewPort.width * -0.5, camera.viewPort.height * -0.5, camera.far));
            let farRT = worldMatrix.transformVector(new Vector3(camera.viewPort.width * 0.5, camera.viewPort.height * 0.5, camera.far));
            let farRB = worldMatrix.transformVector(new Vector3(camera.viewPort.width * 0.5, camera.viewPort.height * -0.5, camera.far));

            let nearLT = worldMatrix.transformVector(new Vector3(camera.viewPort.width * -0.5, camera.viewPort.height * 0.5, camera.near));
            let nearLB = worldMatrix.transformVector(new Vector3(camera.viewPort.width * -0.5, camera.viewPort.height * -0.5, camera.near));
            let nearRT = worldMatrix.transformVector(new Vector3(camera.viewPort.width * 0.5, camera.viewPort.height * 0.5, camera.near));
            let nearRB = worldMatrix.transformVector(new Vector3(camera.viewPort.width * 0.5, camera.viewPort.height * -0.5, camera.near));

            let custom = this.createCustomShape(`CameraFrustum_${camera.object3D.uuid}`);
            custom.buildLines([nearLT, farLT], color);
            custom.buildLines([nearLB, farLB], color);
            custom.buildLines([nearRT, farRT], color);
            custom.buildLines([nearRB, farRB], color);
            custom.buildLines([farLT, farRT, farRB, farLB, farLT], color);
            custom.buildLines([nearLT, nearRT, nearRB, nearLB, nearLT], color);
        }
    }

    /**
     * Draws the bounding box of the object
     * @param obj The object to display the bounding box
     * @param color The color of the bounding box
     */
    public drawObjectBoundingBox(obj: Object3D, color: Color = Color.COLOR_WHITE) {
        let boundingBox = Object3DUtil.genMeshBounds(obj);
        this.drawBox(`Bounds_${obj.uuid}`, boundingBox.min, boundingBox.max, color);
    }

    /**
     * Erases the specified graph
     * @param uuid Graphic identification ID
     */
    public Clear(uuid: string) {
        if (this.mLineRender.shapes.has(uuid)) {
            this.mLineRender.removeShape(uuid);
        } else if (this.mFillRender.shapes.has(uuid)) {
            this.mFillRender.removeShape(uuid);
        }
    }

    /**
     * Erase all drawn graphics
     */
    public ClearAll() {
        this.mLineRender.shapes.clear();
        this.mFillRender.shapes.clear();
    }

    /**
     * Changes the specified graphics color
     * @param uuid Graphic identification ID
     * @param color New color value
     */
    public ChangeColor(uuid: string, color: Color) {
        var shape: Graphics3DShape;

        if (this.mLineRender.shapes.has(uuid)) {
            shape = this.mLineRender.shapes.get(uuid);
        } else if (this.mFillRender.shapes.has(uuid)) {
            shape = this.mFillRender.shapes.get(uuid);
        } else return

        const shapeData = shape.shapeData;
        for (let i = 0; i < shapeData.length; i += GraphicConfig.ShapeVertexSize) {
            shapeData[i + 4] = color.r;
            shapeData[i + 5] = color.g;
            shapeData[i + 6] = color.b;
            shapeData[i + 7] = color.a;
        }
    }
}
