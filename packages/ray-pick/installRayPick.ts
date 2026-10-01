import {
    EarthAtmRenderer,
    EarthSkyRenderer,
    GeometryBase,
    GeometryVertexType,
    Matrix4,
    MeshRenderer,
    Object3D,
    SkyRenderer,
    SpriteRenderer,
    Vector2,
    Vector3,
    VertexAttributeData,
    VertexAttributeName,
} from '@orillusion/core';
import { Raycaster } from './Raycaster';
import type { RaycastHit } from './RaycastHit';

type RaycastMethod = (raycaster: Raycaster, intersects: RaycastHit[]) => void;
type RaycastPrototype = { raycast?: RaycastMethod };
type Constructor<T = object> = { prototype: T };

const installed = new Map<object, Map<PropertyKey, PropertyDescriptor | undefined>>();

function injectProperty(ctor: Constructor, property: PropertyKey, value: unknown): void {
    const prototype = ctor.prototype;
    let properties = installed.get(prototype);
    if (!properties) {
        properties = new Map();
        installed.set(prototype, properties);
    }
    if (properties.has(property)) return;
    properties.set(property, Object.getOwnPropertyDescriptor(prototype, property));
    Object.defineProperty(prototype, property, {
        configurable: true,
        writable: true,
        value,
    });
}

function inject(ctor: Constructor, method: RaycastMethod): void {
    injectProperty(ctor, 'raycast', method);
}

function raycastMesh(
    renderer: MeshRenderer,
    object: Object3D,
    geometry: GeometryBase,
    raycaster: Raycaster,
    intersects: RaycastHit[],
): void {
    if (!renderer.enable || !geometry || !renderer.materials[0]) return;
    if (!raycaster.prepareObject(object)) return;

    let positionData;
    let positionStride: number;
    if (geometry.geometryType === GeometryVertexType.compose_bin) {
        const all = geometry.getAttribute(VertexAttributeName.all);
        if (!all) return;
        positionData = all.data;
        positionStride = geometry.vertexDim;
    } else {
        const position = geometry.getAttribute(VertexAttributeName.position);
        if (!position) return;
        positionData = position.data;
        positionStride = 3;
    }

    const uvAttr: VertexAttributeData = geometry.getAttribute(VertexAttributeName.uv);
    const uv1Attr: VertexAttributeData = geometry.getAttribute(VertexAttributeName.TEXCOORD_1);
    const normalAttr: VertexAttributeData = geometry.getAttribute(VertexAttributeName.normal);
    const indexAttr = geometry.getAttribute(VertexAttributeName.indices);
    const indices = indexAttr?.data;
    const subGeometries = geometry.subGeometries || [];

    const testRange = (
        materialIndex: number,
        start: number,
        count: number,
        indexed: boolean,
    ): void => {
        const resolvedMaterialIndex = renderer.materials[materialIndex] ? materialIndex : 0;
        const material = renderer.materials[resolvedMaterialIndex];
        if (!material?.enable) return;
        const backfaceCulling = material.cullMode !== 'none';
        const reversed = material.cullMode === 'front';
        const end = Math.min(start + count, indexed ? indices.length : positionData.length / positionStride);

        for (let offset = start; offset + 2 < end; offset += 3) {
            const a = indexed ? indices[offset] : offset;
            const b = indexed ? indices[offset + 1] : offset + 1;
            const c = indexed ? indices[offset + 2] : offset + 2;
            const hit = raycaster._checkTriangle(
                object, a, b, c, positionData, positionStride,
                uvAttr, uv1Attr, normalAttr, backfaceCulling, reversed,
            );
            if (!hit) continue;
            hit.faceIndex = Math.floor(offset / 3);
            hit.face.materialIndex = resolvedMaterialIndex;
            intersects.push(hit);
        }
    };

    if (subGeometries.length > 0) {
        // Mirror RenderNode: iterate the larger collection, falling back to
        // material 0 or sub-geometry 0 where one side has fewer entries.
        const slotCount = Math.max(renderer.materials.length, subGeometries.length);
        for (let slot = 0; slot < slotCount; slot++) {
            const materialIndex = slot < renderer.materials.length ? slot : 0;
            const subGeometry = subGeometries[slot] || subGeometries[0];
            const lod = subGeometry?.lodLevels?.[renderer.lodLevel]
                || subGeometry?.lodLevels?.[0];
            if (!lod) continue;
            testRange(materialIndex, lod.indexStart, lod.indexCount, !!indices?.length);
        }
        return;
    }

    testRange(
        0,
        0,
        indices?.length || positionData.length / positionStride,
        !!indices?.length,
    );
}
function meshRaycast(this: MeshRenderer, raycaster: Raycaster, intersects: RaycastHit[]): void {
    raycastMesh(this, this.object3D, this.geometry, raycaster, intersects);
}

function spriteRaycast(this: SpriteRenderer, raycaster: Raycaster, intersects: RaycastHit[]): void {
    if (!this.enable || !this.geometry || !this.materials[0]) return;

    if (!raycaster.prepareObject(this.object3D)) return;

    const directionZ = raycaster._localRay.direction.z;
    if (Math.abs(directionZ) < 1e-8) return;
    const t = -raycaster._localRay.origin.z / directionZ;
    if (t < 0) return;

    const localX = raycaster._localRay.origin.x + raycaster._localRay.direction.x * t;
    const localY = raycaster._localRay.origin.y + raycaster._localRay.direction.y * t;
    const pivot = this.pivot;
    const size = this.size.clone();
    if (this.distanceInvariantSize) {
        const cameraDistance = Vector3.distance(raycaster.ray.origin, this.transform.worldPosition);
        size.multiplyScalar(cameraDistance / 10);
    }
    const centerX = (0.5 - pivot.x) * size.x;
    const centerY = (0.5 - pivot.y) * size.y;
    const halfWidth = size.x / 2;
    const halfHeight = size.y / 2;
    if (
        localX < centerX - halfWidth || localX > centerX + halfWidth ||
        localY < centerY - halfHeight || localY > centerY + halfHeight
    ) return;

    const point = raycaster._pointWorld.copy(raycaster._localRay.origin)
        .addScaledVector(raycaster._localRay.direction, t);
    Matrix4.transformPoint(this.transform.worldMatrix, point, point);
    const distance = Vector3.distance(raycaster.ray.origin, point);
    if (distance < raycaster.near || distance > raycaster.far) return;

    const normal = new Vector3(0, 0, 1);
    const worldNormal = raycaster.transformNormalToWorld(this.object3D, normal, new Vector3());
    intersects.push({
        distance,
        point: point.clone(),
        object: this.object3D,
        faceIndex: -1,
        uv: new Vector2(
            (localX - (centerX - halfWidth)) / size.x,
            (localY - (centerY - halfHeight)) / size.y,
        ),
        normal,
        worldNormal,
    });
}

function ignoreRaycast(): void {}

/** Inject CPU ray-picking support into Orillusion's built-in renderers. */
export function installRayPick(): void {
    inject(MeshRenderer, meshRaycast);
    inject(SpriteRenderer, spriteRaycast);
    inject(SkyRenderer, ignoreRaycast);
    inject(EarthSkyRenderer, ignoreRaycast);
    inject(EarthAtmRenderer, ignoreRaycast);
}

/**
 * Inject support for an external GPU-instanced renderer such as
 * `Graphic3DMeshRenderer`, without making this package depend on it.
 */
export function installGraphicRayPick<T extends MeshRenderer>(
    rendererType: Constructor<T & {
        sourceGeometry: GeometryBase;
        object3Ds: Object3D[];
        create(source: GeometryBase, ...args: unknown[]): unknown;
    }>,
): void {
    const prototype = rendererType.prototype;
    const originalCreate = prototype.create;
    injectProperty(rendererType, 'create', function (this: typeof prototype, source: GeometryBase, ...args: unknown[]) {
        this.sourceGeometry = source;
        return originalCreate.call(this, source, ...args);
    });
    inject(rendererType, function (this: typeof prototype, raycaster, intersects) {
        if (!this.enable || !this.sourceGeometry || !this.materials[0]) return;
        for (const object of this.object3Ds) {
            raycastMesh(this, object, this.sourceGeometry, raycaster, intersects);
        }
    });
}

/** Restore renderer prototypes to their state before installation. */
export function uninstallRayPick(): void {
    for (const [prototype, properties] of installed) {
        for (const [property, descriptor] of properties) {
            if (descriptor) Object.defineProperty(prototype, property, descriptor);
            else delete (prototype as Record<PropertyKey, unknown>)[property];
        }
    }
    installed.clear();
}
