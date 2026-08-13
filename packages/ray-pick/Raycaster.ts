import {
    ArrayBufferData,
    Camera3D,
    Matrix4,
    Object3D,
    Ray,
    Scene3D,
    Vector2,
    Vector3,
    VertexAttributeData,
} from '@orillusion/core';
import type { RaycastHit } from './RaycastHit';

interface RaycastComponent {
    raycast?(raycaster: Raycaster, intersects: RaycastHit[]): void;
}

class RaycasterScratch {
    public readonly matrix = new Matrix4();
    public readonly localRay = new Ray();
    public readonly point = new Vector3();
    public readonly pointWorld = new Vector3();
    public readonly vA = new Vector3();
    public readonly vB = new Vector3();
    public readonly vC = new Vector3();
    public readonly e0 = new Vector3();
    public readonly barycoord = new Vector3();
    public readonly b0 = new Vector3();
    public readonly b1 = new Vector3();
    public readonly b2 = new Vector3();
    public readonly faceNormal = new Vector3();
    public readonly normal = new Vector3();
    public readonly uv = new Vector2();
    public readonly uv1 = new Vector2();
    public normalMatrices = new WeakMap<Object3D, Matrix4>();

    public reset(): void {
        this.normalMatrices = new WeakMap<Object3D, Matrix4>();
    }
}

/**
 * CPU ray picking against mesh geometry, replicating three.js `Raycaster` semantics:
 * - the ray is tested against every triangle of the mesh geometry (not only the bounding box);
 * - every intersection is reported (not only the nearest one), sorted by distance, closest first;
 * - each result carries `distance`, world-space `point`, `object`, `faceIndex`, and optionally
 *   interpolated `uv` / `uv1`, object-space `normal` and `barycoord`, consistent with three.js.
 *
 * Usage:
 * ```ts
 * let raycaster = new Raycaster();
 * raycaster.setFromCamera(mouseX, mouseY, camera);
 * let hits = raycaster.intersectObject(scene, true);
 * ```
 *
 * Dispatch follows the three.js model: for every object in the tree, each component
 * with an injected `raycast` method is asked to test the ray, then the walk recurses
 * into the children. Call `installRayPick()` before casting against core renderers.
 *
 * @group IO
 */
export class Raycaster {
    /**
     * The ray used for raycasting
     */
    public ray: Ray;

    /**
     * All results returned are further away than near
     */
    public near: number = 0;

    /**
     * All results returned are closer than far
     */
    public far: number = Infinity;

    private readonly _scratchStack: RaycasterScratch[] = [];
    private readonly _scratchPool: RaycasterScratch[] = [];
    private readonly _idleScratch = new RaycasterScratch();

    private get _activeScratch(): RaycasterScratch | null {
        return this._scratchStack[this._scratchStack.length - 1] || null;
    }

    private get _scratch(): RaycasterScratch {
        return this._activeScratch || this._idleScratch;
    }

    /** @internal Active query's inverse world matrix scratch. */
    public get _matrix(): Matrix4 { return this._scratch.matrix; }
    /** @internal Active query's local ray scratch. */
    public get _localRay(): Ray { return this._scratch.localRay; }
    /** @internal Active query's intersection point scratch. */
    public get _point(): Vector3 { return this._scratch.point; }
    /** @internal Active query's world intersection point scratch. */
    public get _pointWorld(): Vector3 { return this._scratch.pointWorld; }

    private get _vA(): Vector3 { return this._scratch.vA; }
    private get _vB(): Vector3 { return this._scratch.vB; }
    private get _vC(): Vector3 { return this._scratch.vC; }
    private get _e0(): Vector3 { return this._scratch.e0; }
    private get _barycoord(): Vector3 { return this._scratch.barycoord; }
    private get _b0(): Vector3 { return this._scratch.b0; }
    private get _b1(): Vector3 { return this._scratch.b1; }
    private get _b2(): Vector3 { return this._scratch.b2; }
    private get _faceNormal(): Vector3 { return this._scratch.faceNormal; }
    private get _normal(): Vector3 { return this._scratch.normal; }
    private get _uv(): Vector2 { return this._scratch.uv; }
    private get _uv1(): Vector2 { return this._scratch.uv1; }

    /**
     * @constructor
     * @param ray ray to use for raycasting
     * @param near results are returned only when farther than near, default 0
     * @param far results are returned only when closer than far, default Infinity
     */
    constructor(ray?: Ray, near: number = 0, far: number = Infinity) {
        this.ray = ray || new Ray();
        this.near = near;
        this.far = far;
    }

    /**
     * Copy a new origin and direction from the given ray
     * @param ray source ray
     * @returns this
     */
    public set(ray: Ray): this {
        this.ray.copy(ray);
        return this;
    }

    /**
     * Set the ray from screen coordinates and a camera, same as `camera.screenPointToRay`
     * @param mouseX screen x coordinate
     * @param mouseY screen y coordinate
     * @param camera camera
     * @returns this
     */
    public setFromCamera(mouseX: number, mouseY: number, camera: Camera3D): this {
        this.ray = camera.screenPointToRay(mouseX, mouseY);
        return this;
    }

    /**
     * Check all intersections between the ray and the object, with or without its descendants.
     * Intersections are returned sorted by distance, closest first.
     * @param object the object to check for intersection with the ray
     * @param recursive whether to also check all descendants, default true
     * @returns an array holding the intersection results
     */
    public intersectObject(object: Object3D, recursive: boolean = true): RaycastHit[] {
        this._beginQuery();
        try {
            const intersects: RaycastHit[] = [];
            _intersect(object, this, intersects, recursive);
            intersects.sort(ascSort);
            return intersects;
        } finally {
            this._endQuery();
        }
    }

    /**
     * Check all intersections between the ray and the given objects, with or without their descendants.
     * Intersections are returned sorted by distance, closest first.
     * @param objects the objects to check for intersection with the ray
     * @param recursive whether to also check all descendants, default true
     * @returns an array holding the intersection results
     */
    public intersectObjects(objects: Object3D[], recursive: boolean = true): RaycastHit[] {
        this._beginQuery();
        try {
            const intersects: RaycastHit[] = [];
            for (const object of objects) {
                _intersect(object, this, intersects, recursive);
            }
            intersects.sort(ascSort);
            return intersects;
        } finally {
            this._endQuery();
        }
    }

    /**
     * Check all intersections between the ray and the given scene (all meshes in the scene tree)
     * @param scene the scene to check for intersection with the ray
     * @returns an array holding the intersection results
     */
    public intersectScene(scene: Scene3D): RaycastHit[] {
        return this.intersectObject(scene, true);
    }

    private _beginQuery(): void {
        const scratch = this._scratchPool.pop() || new RaycasterScratch();
        scratch.reset();
        this._scratchStack.push(scratch);
    }

    private _endQuery(): void {
        const scratch = this._scratchStack.pop();
        if (scratch) this._scratchPool.push(scratch);
    }

    /**
     * Convert this ray to object space and cache the inverse-transpose normal
     * matrix. The inverse is calculated once per object per query.
     * @internal
     */
    public prepareObject(object: Object3D): boolean {
        const worldMatrix = object.transform.worldMatrix;
        if (!Matrix4.invert(worldMatrix, this._matrix)) return false;
        this._localRay.copy(this.ray).applyMatrix(this._matrix);
        this._localRay.direction.normalize();

        const activeScratch = this._activeScratch;
        if (activeScratch && !activeScratch.normalMatrices.has(object)) {
            const normalMatrix = new Matrix4().copy(this._matrix);
            normalMatrix.transpose();
            activeScratch.normalMatrices.set(object, normalMatrix);
        }
        return true;
    }

    /**
     * Test a single triangle and fill a {@link RaycastHit} when intersected.
     * Scratch state belongs to this Raycaster instance, so independent
     * Raycaster queries cannot corrupt each other.
     * @internal
     */
    public _checkTriangle(object: Object3D, a: number, b: number, c: number, positionData: ArrayBufferData, positionStride: number, uvAttr: VertexAttributeData, uv1Attr: VertexAttributeData, normalAttr: VertexAttributeData, backfaceCulling: boolean, reversed: boolean): RaycastHit {
        const vA = this._vA.set(positionData[a * positionStride], positionData[a * positionStride + 1], positionData[a * positionStride + 2]);
        const vB = this._vB.set(positionData[b * positionStride], positionData[b * positionStride + 1], positionData[b * positionStride + 2]);
        const vC = this._vC.set(positionData[c * positionStride], positionData[c * positionStride + 1], positionData[c * positionStride + 2]);

        const point = this._intersectTriangle(this._localRay, reversed ? vC : vA, vB, reversed ? vA : vC, backfaceCulling, this._point);
        if (point === null) return null;

        // Transform the hit point to world space and compute the world-space distance
        this._pointWorld.copy(point);
        Matrix4.transformPoint(object.transform.worldMatrix, this._pointWorld, this._pointWorld);
        const distance = Vector3.distance(this.ray.origin, this._pointWorld);
        if (distance < this.near || distance > this.far) return null;

        const hit: RaycastHit = {
            distance: distance,
            point: this._pointWorld.clone(),
            object: object,
            faceIndex: 0,
        };

        // Barycentric coordinates, mapping to vertices (a, b, c)
        const barycoord = this._getBarycoord(point, vA, vB, vC, this._barycoord);
        if (barycoord) {
            hit.barycoord = barycoord.clone();

            if (uvAttr) {
                hit.uv = this._interpolateAttribute2(uvAttr.data, 2, a, b, c, barycoord, this._uv).clone();
            }
            if (uv1Attr) {
                hit.uv1 = this._interpolateAttribute2(uv1Attr.data, 2, a, b, c, barycoord, this._uv1).clone();
            }
            if (normalAttr) {
                const normal = this._interpolateAttribute3(normalAttr.data, 3, a, b, c, barycoord, this._normal);
                // Flip the normal when it faces away from the ray
                if (Vector3.dot(normal, this._localRay.direction) > 0) {
                    normal.multiplyScalar(-1);
                }
                hit.normal = normal.clone();
                hit.worldNormal = this.transformNormalToWorld(object, normal, new Vector3());
            }
        }

        const faceNormal = this._faceNormal;
        Vector3.sub(vC, vB, faceNormal);
        Vector3.sub(vA, vB, this._e0);
        Vector3.cross(faceNormal, this._e0, faceNormal);
        if (faceNormal.lengthSquared > 0) {
            faceNormal.normalize();
        } else {
            faceNormal.set(0, 0, 0);
        }

        hit.face = {
            a: a,
            b: b,
            c: c,
            normal: faceNormal.clone(),
            materialIndex: 0,
        };
        return hit;
    }

    /**
     * Transform an object-space normal to world space. Normals require the
     * inverse-transpose matrix so they remain perpendicular to the surface
     * under non-uniform scale.
     * @internal
     */
    public transformNormalToWorld(object: Object3D, normal: Vector3, target: Vector3): Vector3 {
        const activeScratch = this._activeScratch;
        let normalMatrix = activeScratch?.normalMatrices.get(object);
        if (!normalMatrix) {
            const inverse = new Matrix4();
            if (!Matrix4.invert(object.transform.worldMatrix, inverse)) {
                return Matrix4.transformVector(object.transform.worldMatrix, normal, target).normalize();
            }
            inverse.transpose();
            normalMatrix = inverse;
            // Cache only inside a bounded query. Query-external calls must see
            // transforms changed since their previous invocation.
            activeScratch?.normalMatrices.set(object, normalMatrix);
        }
        return Matrix4.transformVector(normalMatrix, normal, target).normalize();
    }

    /**
     * Watertight ray/triangle intersection, ported from three.js `Ray.intersectTriangle`
     * (Woop, Benthin, Wald, "Watertight Ray/Triangle Intersection", JCGT vol. 2 no. 1 (2013)).
     * The intersection point is computed in the local space of the object.
     * @internal
     */
    private _intersectTriangle(ray: Ray, a: Vector3, b: Vector3, c: Vector3, backfaceCulling: boolean, target: Vector3): Vector3 {
        const origin = ray.origin;
        const direction = ray.direction;

        const dx = direction.x;
        const dy = direction.y;
        const dz = direction.z;

        // triangle vertices relative to the ray origin
        const aox = a.x - origin.x, aoy = a.y - origin.y, aoz = a.z - origin.z;
        const box = b.x - origin.x, boy = b.y - origin.y, boz = b.z - origin.z;
        const cox = c.x - origin.x, coy = c.y - origin.y, coz = c.z - origin.z;

        // Use the dimension where the ray direction is maximal as the projection
        // axis (kz); kx and ky are swapped when the direction's kz component is
        // negative, to preserve the winding order of triangles.
        const adx = Math.abs(dx), ady = Math.abs(dy), adz = Math.abs(dz);

        let dkx, dky, dkz;
        let akx, aky, akz, bkx, bky, bkz, ckx, cky, ckz;

        if (adx >= ady && adx >= adz) {
            dkz = dx; akz = aox; bkz = box; ckz = cox;
            if (dx >= 0) {
                dkx = dy; dky = dz;
                akx = aoy; aky = aoz; bkx = boy; bky = boz; ckx = coy; cky = coz;
            } else {
                dkx = dz; dky = dy;
                akx = aoz; aky = aoy; bkx = boz; bky = boy; ckx = coz; cky = coy;
            }
        } else if (ady >= adz) {
            dkz = dy; akz = aoy; bkz = boy; ckz = coy;
            if (dy >= 0) {
                dkx = dz; dky = dx;
                akx = aoz; aky = aox; bkx = boz; bky = box; ckx = coz; cky = cox;
            } else {
                dkx = dx; dky = dz;
                akx = aox; aky = aoz; bkx = box; bky = boz; ckx = cox; cky = coz;
            }
        } else {
            dkz = dz; akz = aoz; bkz = boz; ckz = coz;
            if (dz >= 0) {
                dkx = dx; dky = dy;
                akx = aox; aky = aoy; bkx = box; bky = boy; ckx = cox; cky = coy;
            } else {
                dkx = dy; dky = dx;
                akx = aoy; aky = aox; bkx = boy; bky = box; ckx = coy; cky = cox;
            }
        }

        // a zero direction has no maximal axis and cannot intersect
        if (dkz === 0) return null;

        // shear constants that align the ray with the +kz axis
        const sx = dkx / dkz, sy = dky / dkz, sz = 1 / dkz;

        // sheared and scaled vertices
        const ax = akx - sx * akz, ay = aky - sy * akz;
        const bx = bkx - sx * bkz, by = bky - sy * bkz;
        const cx = ckx - sx * ckz, cy = cky - sy * ckz;

        // scaled barycentric coordinates (signed edge functions); the shear makes a
        // shared edge evaluate identically for both adjacent triangles
        const u = cx * by - cy * bx;
        const v = ax * cy - ay * cx;
        const w = bx * ay - by * ax;

        if (backfaceCulling) {
            if (u < 0 || v < 0 || w < 0) return null;
        } else {
            if ((u < 0 || v < 0 || w < 0) && (u > 0 || v > 0 || w > 0)) return null;
        }

        const det = u + v + w;

        // ray is co-planar with the triangle
        if (det === 0) return null;

        // scaled hit distance; t = tScaled / det must lie in front of the origin
        const tScaled = sz * (u * akz + v * bkz + w * ckz);
        if (det > 0 ? tScaled < 0 : tScaled > 0) return null;

        return ray.pointAt(tScaled / det, target);
    }

    /**
     * Computes the barycentric coordinates of the given point inside the triangle,
     * ported from three.js `Triangle.getBarycoord`. The result maps to vertices (a, b, c):
     * `point = a * x + b * y + c * z`.
     * @internal
     */
    private _getBarycoord(point: Vector3, a: Vector3, b: Vector3, c: Vector3, target: Vector3): Vector3 {
        // based on: http://www.blackpawn.com/texts/pointinpoly/default.html
        const v0 = this._b0;
        const v1 = this._b1;
        const v2 = this._b2;
        Vector3.sub(c, a, v0);
        Vector3.sub(b, a, v1);
        Vector3.sub(point, a, v2);

        const dot00 = Vector3.dot(v0, v0);
        const dot01 = Vector3.dot(v0, v1);
        const dot02 = Vector3.dot(v0, v2);
        const dot11 = Vector3.dot(v1, v1);
        const dot12 = Vector3.dot(v1, v2);

        const denom = dot00 * dot11 - dot01 * dot01;

        // collinear or singular triangle
        if (denom === 0) {
            target.set(0, 0, 0);
            return null;
        }

        const invDenom = 1 / denom;
        const u = (dot11 * dot02 - dot01 * dot12) * invDenom;
        const v = (dot00 * dot12 - dot01 * dot02) * invDenom;

        // barycentric coordinates must always sum to 1
        return target.set(1 - u - v, v, u);
    }

    /**
     * Barycentric interpolation of a 2-component vertex attribute (e.g. uv),
     * ported from three.js `Triangle.getInterpolatedAttribute`.
     * @internal
     */
    private _interpolateAttribute2(data: ArrayBufferData, stride: number, i0: number, i1: number, i2: number, barycoord: Vector3, target: Vector2): Vector2 {
        return target.set(
            data[i0 * stride] * barycoord.x + data[i1 * stride] * barycoord.y + data[i2 * stride] * barycoord.z,
            data[i0 * stride + 1] * barycoord.x + data[i1 * stride + 1] * barycoord.y + data[i2 * stride + 1] * barycoord.z
        );
    }

    /**
     * Barycentric interpolation of a 3-component vertex attribute (e.g. normal),
     * ported from three.js `Triangle.getInterpolatedAttribute`.
     * @internal
     */
    private _interpolateAttribute3(data: ArrayBufferData, stride: number, i0: number, i1: number, i2: number, barycoord: Vector3, target: Vector3): Vector3 {
        return target.set(
            data[i0 * stride] * barycoord.x + data[i1 * stride] * barycoord.y + data[i2 * stride] * barycoord.z,
            data[i0 * stride + 1] * barycoord.x + data[i1 * stride + 1] * barycoord.y + data[i2 * stride + 1] * barycoord.z,
            data[i0 * stride + 2] * barycoord.x + data[i1 * stride + 2] * barycoord.y + data[i2 * stride + 2] * barycoord.z
        );
    }
}

function ascSort(a: RaycastHit, b: RaycastHit) {
    return a.distance - b.distance;
}

function _intersect(object: Object3D, raycaster: Raycaster, intersects: RaycastHit[], recursive: boolean) {
    // three.js style dispatch: every component implementing `IComponent.raycast`
    // (e.g. MeshRenderer) tests the ray against its own geometry
    for (const component of object.components.values()) {
        (component as RaycastComponent).raycast?.(raycaster, intersects);
    }
    if (recursive) {
        const children = object.entityChildren;
        for (let i = 0, l = children.length; i < l; i++) {
            const child = children[i];
            if (child instanceof Object3D) {
                _intersect(child, raycaster, intersects, true);
            }
        }
    }
}
