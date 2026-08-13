import type { Object3D, Vector2, Vector3 } from '@orillusion/core';

export interface RaycastFace {
    /**
     * vertex index of the first corner
     */
    a: number;
    /**
     * vertex index of the second corner
     */
    b: number;
    /**
     * vertex index of the third corner
     */
    c: number;
    /**
     * geometric normal of the face, in object space
     */
    normal: Vector3;
    /**
     * material index of the face
     */
    materialIndex: number;
}

/**
 * Ray intersection result, consistent with three.js `Raycaster` Intersection:
 * - distance: distance from the ray origin to the intersection point (world space)
 * - point: intersection point in world space
 * - object: the object that was intersected
 * - faceIndex: triangle index of the intersected face
 * - uv / uv1: barycentric-interpolated uv at the intersection point
 * - normal: interpolated vertex normal in object space (flipped toward the ray when facing away)
 * - worldNormal: the interpolated normal transformed by the inverse-transpose world matrix
 * - barycoord: barycentric coordinates of the intersection point, mapping to vertices (a, b, c)
 *
 * @group IO
 */
export interface RaycastHit {
    /**
     * distance from the ray origin to the intersection point (world space)
     */
    distance: number;
    /**
     * intersection point in world space
     */
    point: Vector3;
    /**
     * the object that was intersected
     */
    object: Object3D;
    /**
     * triangle index of the intersected face
     */
    faceIndex: number;
    /**
     * face info of the intersected triangle
     */
    face?: RaycastFace;
    /**
     * interpolated uv at the intersection point
     */
    uv?: Vector2;
    /**
     * interpolated second uv (TEXCOORD_1) at the intersection point
     */
    uv1?: Vector2;
    /**
     * interpolated normal at the intersection point (object space, flipped toward the ray when facing away)
     */
    normal?: Vector3;
    /**
     * interpolated normal transformed to world space with the inverse-transpose world matrix
     */
    worldNormal?: Vector3;
    /**
     * barycentric coordinates of the intersection point inside the triangle, mapping to (a, b, c)
     */
    barycoord?: Vector3;
}
