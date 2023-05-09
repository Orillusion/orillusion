import { Frustum } from './Frustum';
import { Object3D } from '../entities/Object3D';
import { Ray } from '../../math/Ray';
import { Vector3 } from '../../math/Vector3';

/**
 * @internal
 */
export interface IBound {
    center: Vector3;
    extents: Vector3;
    max: Vector3;
    min: Vector3;
    size: Vector3;

    worldMax: Vector3;
    worldMin: Vector3;

    calculateTransform(obj: Object3D): void;
    clone(): IBound;

    merge(bound: IBound);

    intersectsRay(ray: Ray, point: Vector3): boolean;
    containsPoint(point: Vector3): boolean;
    setFromCenterAndSize(center: Vector3, size: Vector3 | number);

    containsFrustum(object3D: Object3D, frustum: Frustum);

    updateBound();
}
