import { Camera3D } from '../core/Camera3D';
import { Object3D } from '../core/entities/Object3D';
import { Context3D } from '../gfx/graphics/webGpu/Context3D';
import { Matrix4 } from '../math/Matrix4';
import { Vector3 } from '../math/Vector3';

const ctxOf = (camera?: Camera3D): Context3D => {
    const ctx = camera?._boundCtx ?? camera?.transform?.view3D?.engine3D?.context3D;
    if (!ctx) {
        throw new Error(`CameraUtil: camera has no bound Context3D. Attach the camera to a scene/view before projecting.`);
    }
    return ctx;
};

/**
 * Camera3D tool class
 * @group Util
 */
export class CameraUtil {
    /**
     * create a Camera3D component
     * @param parent parent object3D
     * @param name set name to the owner of this camera3D
     * @returns
     */
    public static createCamera3DObject(parent?: Object3D, name?: string): Camera3D {
        return this.createCamera3D(null, parent, name);
    }

    /**
     * @internal
     * @param object3D
     * @param parent
     * @param name
     * @returns
     */
    public static createCamera3D(object3D?: Object3D, parent?: Object3D, name?: string): Camera3D {
        object3D ||= new Object3D();
        parent && parent.addChild(object3D);
        name && (object3D.name = name);
        return object3D.getOrAddComponent(Camera3D);
    }

    /**
     * @internal
     * @param sX
     * @param sY
     * @param sZ
     * @param camera
     * @returns
     */
    public static UnProjection(sX: number, sY: number, sZ: number = 1, camera?: Camera3D) {
        // sX/sY are canvas-relative (InputSystem.mouseX/Y already subtract
        // the canvas rect), matching Projection(); don't subtract the canvas
        // offset a second time.
        let ctx = ctxOf(camera);
        let w = ctx.canvas.clientWidth;
        let h = ctx.canvas.clientHeight;
        return CameraUtil.UnProjectionNDC((sX / w - 0.5) * 2, -(sY / h - 0.5) * 2, sZ, camera);
    }

    /**
     * Unproject a normalized-device-coordinate point (x, y in [-1, 1], y up)
     * at depth `sZ` to world space.
     * @param ndcX NDC x
     * @param ndcY NDC y
     * @param sZ NDC depth
     * @param camera camera to unproject through
     * @param target optional output
     */
    public static UnProjectionNDC(ndcX: number, ndcY: number, sZ: number, camera: Camera3D, target?: Vector3) {
        let ina: Vector3 = Vector3.HELP_0;
        ina.x = ndcX;
        ina.y = ndcY;
        ina.z = sZ;

        let outP = target || new Vector3(0, 0, 0);
        let projectWorld = Matrix4.helpMatrix2;
        projectWorld.copy(camera.projectionMatrix);
        projectWorld.invert();
        let cameraToWorld = Matrix4.helpMatrix;
        cameraToWorld.identity();
        cameraToWorld.multiply(projectWorld);
        cameraToWorld.multiply(camera.transform.worldMatrix);
        cameraToWorld.perspectiveMultiplyPoint3(ina, outP);
        return outP;
    }

    /**
     * @internal
     * @param point
     * @param camera
     * @param target
     * @returns
     */
    public static Projection(point: Vector3, camera: Camera3D, target?: Vector3) {
        let outP = target ? target : new Vector3(0, 0, 0);
        let cameraToWorld = Matrix4.helpMatrix;
        cameraToWorld.copy(camera.viewMatrix);
        cameraToWorld.multiply(camera.projectionMatrix);
        cameraToWorld.perspectiveMultiplyPoint3(point, outP);

        let ctx = ctxOf(camera);
        let w = ctx.canvas.clientWidth / 2;
        let h = ctx.canvas.clientHeight / 2;

        // let w = camera.viewPort.width / 2;
        // let h = camera.viewPort.height / 2;
        outP.x = outP.x * w + w;
        outP.y = h - outP.y * h;
        return outP;
    }

    /**
     * @internal
     * @param sceneX
     * @param sceneY
     * @param z
     * @param camera
     * @param target
     * @returns
     */
    public static UnProjection2(sceneX: number, sceneY: number, z: number, camera: Camera3D, target: Vector3) {
        let outP = target ? target : new Vector3(0, 0, 0);
        let cameraToWorld = Matrix4.helpMatrix;
        cameraToWorld.copy(camera.pvMatrixInv);

        // let w = camera.viewPort.width / 2;
        // let h = camera.viewPort.height / 2;

        let ctx = ctxOf(camera);
        let w = ctx.canvas.clientWidth / 2;
        let h = ctx.canvas.clientHeight / 2;

        outP.x = (sceneX - w) / w;
        outP.y = (h - sceneY) / h;
        outP.z = z;

        cameraToWorld.perspectiveMultiplyPoint3(outP, outP);

        return outP;
    }
}
