import { Object3D } from '../../core/entities/Object3D';
import { Vector2 } from '../../math/Vector2';
import { Vector3 } from '../../math/Vector3';
import { MeshRenderer } from '../../components/renderer/MeshRenderer';

/**
 * One ray/triangle intersection reported by `Raycaster` (and, mapped onto
 * `HitInfo`, by `MeshColliderShape`). Every result is a new object owned by
 * the caller.
 * @group IO
 */
export interface RaycastHit {
    /** World-space distance from the ray origin to `point`. */
    distance: number;
    /** Hit point in world space. */
    point: Vector3;
    /** Hit point in the mesh's local space. */
    localPoint: Vector3;
    /**
     * World-space surface normal: the barycentric interpolation of the
     * vertex normals, or `faceNormal` when the geometry has none. Not
     * flipped towards the ray for back-face hits.
     */
    normal: Vector3;
    /** World-space geometric normal of the hit triangle (from its winding). */
    faceNormal: Vector3;
    /** Triangle index into the index buffer (`indices[faceIndex*3 .. +2]`). */
    faceIndex: number;
    /** Barycentric weights (w0, w1, w2) of the triangle's three vertices. */
    barycentric: Vector3;
    /** Whether the ray hit the triangle's front (counter-clockwise, as rendered) side. */
    frontFace: boolean;
    /** Interpolated `uv` (TEXCOORD_0), or null when the geometry has none. */
    uv: Vector2 | null;
    /** Interpolated `TEXCOORD_1`, or null when the geometry has none. */
    uv1: Vector2 | null;
    /** Sub-geometry of the triangle; the renderer draws it with `materials[subGeometryIndex]`. */
    subGeometryIndex: number;
    /** Object that owns the mesh (null for a bare geometry query). */
    object3D: Object3D | null;
    /** Renderer that was hit (null for a bare geometry query). */
    renderer: MeshRenderer | null;
}
