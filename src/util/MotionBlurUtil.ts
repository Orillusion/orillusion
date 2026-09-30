import { Matrix4 } from '../math/Matrix4';
import { Vector3 } from '../math/Vector3';

/**
 * CPU mirror of the velocity math in `MotionBlur_cs`, for tooling and tests.
 * @group Util
 */
export class MotionBlurUtil {
    /**
     * Project a world position to screen UV (0..1, origin top-left) with a
     * column-major view-projection matrix. Returns null behind the camera.
     */
    public static projectToUV(worldPos: Vector3, viewProj: Matrix4): [number, number] | null {
        const m = viewProj.rawData;
        const x = worldPos.x, y = worldPos.y, z = worldPos.z;
        const cx = m[0] * x + m[4] * y + m[8] * z + m[12];
        const cy = m[1] * x + m[5] * y + m[9] * z + m[13];
        const cw = m[3] * x + m[7] * y + m[11] * z + m[15];
        if (cw <= 0) return null;
        return [(cx / cw) * 0.5 + 0.5, -(cy / cw) * 0.5 + 0.5];
    }

    /**
     * Blur vector in pixels for a world-space point: how far it moved on
     * screen between the previous and the current view-projection, times
     * `scale`, clamped to `maxBlurPixels`.
     */
    public static velocityPixels(worldPos: Vector3, currViewProj: Matrix4, prevViewProj: Matrix4, width: number, height: number, scale: number = 1, maxBlurPixels: number = Infinity): [number, number] {
        const cur = MotionBlurUtil.projectToUV(worldPos, currViewProj);
        const prev = MotionBlurUtil.projectToUV(worldPos, prevViewProj);
        if (!cur || !prev) return [0, 0];
        let vx = (cur[0] - prev[0]) * width * scale, vy = (cur[1] - prev[1]) * height * scale;
        const len = Math.hypot(vx, vy);
        if (len > maxBlurPixels && len > 0) { vx *= maxBlurPixels / len; vy *= maxBlurPixels / len; }
        return [vx, vy];
    }

    /** Shutter scale actually sent to the shader for a given frame time. */
    public static shutterScale(intensity: number, deltaMs: number, frameRateIndependent: boolean): number {
        if (!frameRateIndependent) return intensity;
        const dt = Math.min(Math.max(deltaMs, 1), 100);
        return intensity * ((1000 / 60) / dt);
    }
}
