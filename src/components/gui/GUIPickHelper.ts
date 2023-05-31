import { Triangle } from "../../math/Triangle";
import { Matrix4 } from "../../math/Matrix4";
import { Ray } from "../../math/Ray";
import { Vector2 } from "../../math/Vector2";
import { Vector3 } from "../../math/Vector3";
import { UITransform } from "./uiComponents/UITransform";
import { GUISpace } from "./GUIConfig";

export class GUIPickHelper {
    private static _pt0: Vector3;
    private static _pt1: Vector3;
    private static _pt2: Vector3;
    private static _pt3: Vector3;
    private static _hitPoint: Vector3;
    private static _worldMatrix: Matrix4;
    private static _ray: Ray;
    private static _triangle: Triangle;

    private static _isInit: boolean;

    private static init(): void {
        this._pt0 = new Vector3();
        this._pt1 = new Vector3();
        this._pt2 = new Vector3();
        this._pt3 = new Vector3();
        this._ray = new Ray();
        this._triangle = new Triangle();
        this._hitPoint = new Vector3();
        this._worldMatrix = new Matrix4();
    }

    public static rayPick(ray: Ray, screenPos: Vector2, screenSize: Vector2, space: GUISpace, uiTransform: UITransform, worldMatrix: Matrix4): { intersect: boolean; intersectPoint?: Vector3; distance: number } {
        if (!this._isInit) {
            this.init();
            this._isInit = true;
        }

        let helpMatrix = this._worldMatrix;
        let pick;

        if (space == GUISpace.World) {
            this.calculateHotArea_World(uiTransform, this._pt0, this._pt1, this._pt2, this._pt3);

            helpMatrix.copyFrom(worldMatrix).invert();
            let helpRay = this._ray;
            helpRay.copy(ray).applyMatrix(helpMatrix);

            this._triangle.set(this._pt0, this._pt1, this._pt2);
            pick = helpRay.intersectTriangle(helpRay.origin, helpRay.direction, this._triangle);
            if (!pick) {
                this._triangle.set(this._pt1, this._pt2, this._pt3);
                pick = helpRay.intersectTriangle(helpRay.origin, helpRay.direction, this._triangle);
            }

            if (pick) {
                return {
                    intersect: true,
                    distance: 0,
                    intersectPoint: pick,
                };
            }
        } else {
            this.calculateHotArea_View(uiTransform, this._pt0, this._pt1, this._pt2, this._pt3);

            //
            let screenSizeX: number = screenSize.x;
            let screenSizeY: number = screenSize.y;
            let minX: number = Math.min(this._pt0.x, this._pt1.x, this._pt2.x, this._pt3.x) + screenSizeX * 0.5;
            let minY: number = Math.min(this._pt0.y, this._pt1.y, this._pt2.y, this._pt3.y) + screenSizeY * 0.5;
            let maxX: number = Math.max(this._pt0.x, this._pt1.x, this._pt2.x, this._pt3.x) + screenSizeX * 0.5;
            let maxY: number = Math.max(this._pt0.y, this._pt1.y, this._pt2.y, this._pt3.y) + screenSizeY * 0.5;
            pick = screenPos.x <= maxX && screenPos.x >= minX && screenPos.y <= maxY && screenPos.y >= minY;
            if (pick) {
                this._hitPoint.set(screenPos.x, screenPos.y, 0);
                return {
                    intersect: true,
                    distance: 0,
                    intersectPoint: this._hitPoint,
                };
            }
            return null;
        }

        return null;
    }

    private static calculateHotArea_View(transform: UITransform, pt0: Vector3, pt1: Vector3, pt2: Vector3, pt3: Vector3) {
        let uiMtx = transform.getWorldMatrix();
        //2 3
        //0 1
        let scaleX: number = uiMtx.getScaleX();
        let scaleY: number = uiMtx.getScaleY();

        let w = transform.width * 0.5 * scaleX;
        let h = transform.height * 0.5 * scaleY;
        pt0.set(-w, -h, 0);
        pt1.set(w, -h, 0);
        pt2.set(-w, h, 0);
        pt3.set(w, h, 0);

        let offset = uiMtx.tx;
        pt0.x += offset;
        pt1.x += offset;
        pt2.x += offset;
        pt3.x += offset;

        offset = uiMtx.ty;
        pt0.y -= offset;
        pt1.y -= offset;
        pt2.y -= offset;
        pt3.y -= offset;
    }

    private static calculateHotArea_World(transform: UITransform, pt0: Vector3, pt1: Vector3, pt2: Vector3, pt3: Vector3) {
        let uiMtx = transform.getWorldMatrix();
        //2 3
        //0 1
        let scaleX: number = uiMtx.getScaleX();
        let scaleY: number = uiMtx.getScaleY();

        let w = transform.width * 0.5 * scaleX;
        let h = transform.height * 0.5 * scaleY;
        pt0.set(-w, h, 0);
        pt1.set(w, h, 0);
        pt2.set(-w, -h, 0);
        pt3.set(w, -h, 0);

        let offset = uiMtx.tx;
        pt0.x += offset;
        pt1.x += offset;
        pt2.x += offset;
        pt3.x += offset;

        offset = uiMtx.ty;
        pt0.y += offset;
        pt1.y += offset;
        pt2.y += offset;
        pt3.y += offset;
    }
}
