import { Object3D, BoundUtil, Vector3, MeshRenderer, VertexAttributeName, PlaneGeometry, Quaternion, Matrix4, BoundingBox } from '@orillusion/core';
import { Physics, Ammo } from '../Physics';
import { TempPhyMath } from './TempPhyMath';

export interface ChildShape {
    shape: Ammo.btCollisionShape;
    position: Vector3;
    rotation: Quaternion;
}

/**
 * CollisionShapeUtil
 * 提供多种碰撞体构建功能
 */
export class CollisionShapeUtil {
    /**
     * 创建静态平面碰撞形状，适用于静态无限平面的碰撞，如地面或墙壁。
     * @param planeNormal - 平面法向量，默认值为 Vector3.UP。
     * @param planeConstant - 平面常数，表示平面距离原点的距离，默认值为 0。
     * @returns Ammo.btStaticPlaneShape - 静态平面碰撞形状实例。
     */
    public static createStaticPlaneShape(planeNormal: Vector3 = Vector3.UP, planeConstant: number = 0) {
        const normal = TempPhyMath.toBtVec(planeNormal);
        const shape = new Ammo.btStaticPlaneShape(normal, planeConstant);

        return shape;
    }

    /**
     * 创建盒型碰撞形状，适用于具有明确尺寸的盒形物体。
     * 如果未指定尺寸，则使用三维对象的包围盒大小。
     * @param object3D - 用于创建碰撞体的三维对象。
     * @param size - 可选参数，盒型碰撞体的尺寸。
     * @returns Ammo.btBoxShape - 盒型碰撞形状实例。
     */
    public static createBoxShape(object3D: Object3D, size?: Vector3) {
        size ||= this.calculateLocalBoundingBox(object3D).size;
        const halfExtents = TempPhyMath.setBtVec(size.x / 2, size.y / 2, size.z / 2);
        const shape = new Ammo.btBoxShape(halfExtents);

        return shape;
    }

    /**
     * 创建球型碰撞形状，适用于球形物体。
     * 如果未指定半径，则使用三维对象的包围盒半径 `X`。
     * @param object3D - 用于创建碰撞体的三维对象。
     * @param radius - 可选参数，球型碰撞体的半径。
     * @returns Ammo.btSphereShape - 球型碰撞形状实例。
     */
    public static createSphereShape(object3D: Object3D, radius?: number) {
        radius ||= this.calculateLocalBoundingBox(object3D).extents.x;
        const shape = new Ammo.btSphereShape(radius);

        return shape;
    }

    /**
     * 创建胶囊型碰撞形状，适用于胶囊形物体。
     * 如果未指定尺寸，则使用三维对象的包围盒半径 `X` 和高度 `Y`。
     * @param object3D - 用于创建碰撞体的三维对象。
     * @param radius - 可选参数，胶囊的半径。
     * @param height - 可选参数，胶囊中间的圆柱部分的高度。
     * @returns Ammo.btCapsuleShape - 胶囊型碰撞形状实例。
     */
    public static createCapsuleShape(object3D: Object3D, radius?: number, height?: number) {
        let boundSize: Vector3
        if (!radius || !height) boundSize = this.calculateLocalBoundingBox(object3D).size;

        radius ||= boundSize.x / 2;
        height ||= boundSize.y - radius * 2;
        const shape = new Ammo.btCapsuleShape(radius, height);

        return shape;
    }

    /**
     * 创建圆柱型碰撞形状，适用于圆柱形物体。
     * 如果未指定尺寸，则使用三维对象的包围盒半径 `X` 和高度 `Y`。
     * @param object3D - 用于创建碰撞体的三维对象。
     * @param radius - 可选参数，圆柱的半径。
     * @param height - 可选参数，圆柱的完整高度。
     * @returns Ammo.btCylinderShape - 圆柱型碰撞形状实例。
     */
    public static createCylinderShape(object3D: Object3D, radius?: number, height?: number) {
        let boundSize: Vector3
        if (!radius || !height) boundSize = this.calculateLocalBoundingBox(object3D).size;

        radius ||= boundSize.x / 2;
        height ||= boundSize.y;
        const halfExtents = TempPhyMath.setBtVec(radius, height / 2, radius);
        const shape = new Ammo.btCylinderShape(halfExtents);

        return shape;
    }

    /**
     * 创建圆锥形碰撞形状，适用于圆锥形物体。
     * 如果未指定尺寸，则使用三维对象的包围盒半径 `X` 和高度 `Y`。
     * @param object3D - 用于创建碰撞体的三维对象。
     * @param radius - 可选参数，圆锥的半径。
     * @param height - 可选参数，圆锥的高度。
     * @returns Ammo.btConeShape - 圆锥形碰撞形状实例。
     */
    public static createConeShape(object3D: Object3D, radius?: number, height?: number) {
        let boundSize: Vector3
        if (!radius || !height) boundSize = this.calculateLocalBoundingBox(object3D).size;

        radius ||= boundSize.x / 2;
        height ||= boundSize.y;
        const shape = new Ammo.btConeShape(radius, height);

        return shape;
    }

    // 通过测试发现当前版本Ammo.btMultiSphereShape参数出现问题，
    // 当前仅支持传入单个坐标，且球体们的位置会出现混乱，
    // 传入坐标数组则完全无效。
    // 如果需要类似功能，可以使用复合或是网格形状。
    /**
    * 创建多球体碰撞形状，适用于通过多个球体组合来近似复杂形状的情况。
    * 可以通过球体组合来创建近似椭球形状。
    * @param positions - 球体的位置数组。
    * @param radii - 球体的半径数组。
    * @returns Ammo.btMultiSphereShape - 多球体碰撞形状实例。
    */
    // public static createMultiSphereShape(positions: Vector3[], radii: number[]): Ammo.btMultiSphereShape {
    //     if (positions.length !== radii.length) {
    //         throw new Error("Positions and radii arrays must have the same length.");
    //     }

    //     const btPositions = positions.map(pos => new Ammo.btVector3(pos.x, pos.y, pos.z));

    //     const shape = new Ammo.btMultiSphereShape((btPositions as any), radii, btPositions.length);

    //     btPositions.forEach(pos => Ammo.destroy(pos));

    //     return shape;
    // }

    /**
     * 创建复合形状，将多个子形状组合成一个形状。
     * @param childShapes - 包含子形状实例与位置、旋转属性的数组。
     * @returns Ammo.btCompoundShape - 复合形状实例。
     */
    public static createCompoundShape(childShapes: ChildShape[]) {
        const compoundShape = new Ammo.btCompoundShape();
        const transform = Physics.TEMP_TRANSFORM;

        childShapes.forEach(desc => {
            transform.setIdentity();
            transform.setOrigin(TempPhyMath.toBtVec(desc.position));
            transform.setRotation(TempPhyMath.toBtQua(desc.rotation));

            compoundShape.addChildShape(transform, desc.shape);
        });

        return compoundShape;
    }

    /**
     * 创建高度场形状，基于平面顶点数据模拟地形。
     * @param object3D - 用于创建碰撞体的三维对象。
     * @param heightScale - 高度缩放比例，默认值为 `1`。
     * @param upAxis - 高度场的上轴，默认值为 `1`。
     * @param hdt - 高度场的数据类型，默认值为 `Ammo.PHY_FLOAT`。
     * @param flipQuadEdges - 是否翻转四边形的边，默认值为 `false`。
     * @returns Ammo.btHeightfieldTerrainShape - 高度场形状实例。
     */
    public static createHeightfieldTerrainShape(
        object3D: Object3D,
        heightScale: number = 1,
        upAxis: number = 1,
        hdt: Ammo.PHY_ScalarType = 'PHY_FLOAT',
        flipQuadEdges: boolean = false,
    ) {
        let geometry = object3D.getComponent(MeshRenderer)?.geometry;

        if (!(geometry instanceof PlaneGeometry)) throw new Error("Wrong geometry type");

        const { width, height, segmentW, segmentH } = geometry;
        let posAttrData = geometry.getAttribute(VertexAttributeName.position);
        const heightData = new Float32Array(posAttrData.data.length / 3);
        let minHeight = Infinity, maxHeight = -Infinity;

        for (let i = 0, count = posAttrData.data.length / 3; i < count; i++) {
            let y = posAttrData.data[i * 3 + 1];
            heightData[i] = y;
            if (y < minHeight) minHeight = y;
            if (y > maxHeight) maxHeight = y;
        }

        let ammoHeightData = Ammo._malloc(heightData.length * 4);
        let ammoHeightDataF32 = new Float32Array(Ammo.HEAPF32.buffer, ammoHeightData, heightData.length);
        ammoHeightDataF32.set(heightData);

        let shape = new Ammo.btHeightfieldTerrainShape(
            segmentW + 1,
            segmentH + 1,
            ammoHeightData,
            heightScale,
            minHeight,
            maxHeight,
            upAxis,
            hdt,
            flipQuadEdges
        );

        let localScaling = TempPhyMath.setBtVec(width / segmentW, 1, height / segmentH);
        shape.setLocalScaling(localScaling);
        (shape as any).averageHeight = (minHeight + maxHeight) / 2;

        return shape;
    }

    /**
     * 创建凸包形状，适用于具有凹陷填充的模型。
     * 此形状适用于动态物体并提供快速的碰撞检测。
     * @param object3D - 用于创建碰撞体的三维对象。
     * @param modelVertices - 可选参数，提供碰撞体所需的顶点数据，默认为三维对象的顶点数据。
     * @returns Ammo.btConvexHullShape - 凸包形状实例。
     */
    public static createConvexHullShape(object3D: Object3D, modelVertices?: Float32Array) {
        let vertices = modelVertices || this.getAllMeshVerticesAndIndices(object3D).vertices;

        let shape = new Ammo.btConvexHullShape();
        for (let i = 0, count = vertices.length / 3; i < count; i++) {
            let point = TempPhyMath.setBtVec(vertices[3 * i], vertices[3 * i + 1], vertices[3 * i + 2]);
            shape.addPoint(point, true);
        }

        let scaling = TempPhyMath.toBtVec(object3D.localScale);
        shape.setLocalScaling(scaling);

        return shape;
    }

    /**
     * 创建凸包网格形状，适用于需要复杂几何表示的动态物体。
     * 此形状不要求额外的凸包生成步骤，适用于凸的三角形网格。
     * @param object3D - 用于创建碰撞体的三维对象。
     * @param modelVertices - 可选参数，提供碰撞体所需的顶点数据。
     * @param modelIndices - 可选参数，提供碰撞体所需的索引数据。
     * @returns Ammo.btConvexTriangleMeshShape - 凸包网格形状实例。
     */
    public static createConvexTriangleMeshShape(object3D: Object3D, modelVertices?: Float32Array, modelIndices?: Uint16Array): Ammo.btBvhTriangleMeshShape {
        // 检查 modelVertices 和 modelIndices 是否同时被提供或同时未提供
        if ((modelVertices && !modelIndices) || (!modelVertices && modelIndices)) {
            console.warn('createConvexTriangleMeshShape: Both modelVertices and modelIndices must be provided or neither should be provided.');
        }

        const { vertices, indices } = (modelVertices && modelIndices)
            ? { vertices: modelVertices, indices: modelIndices }
            : this.getAllMeshVerticesAndIndices(object3D);

        const triangleMesh = this.buildTriangleMesh(vertices, indices);
        const shape = new Ammo.btConvexTriangleMeshShape(triangleMesh, true);

        const scaling = TempPhyMath.toBtVec(object3D.localScale);
        shape.setLocalScaling(scaling);

        return shape;
    }

    /**
     * 创建边界体积层次（BVH）网格形状，适用于需要复杂几何表示的静态物体。
     * 此形状适合大规模静态网格，但对动态对象不适用。
     * @param object3D - 用于创建碰撞体的三维对象。
     * @param modelVertices - 可选参数，提供碰撞体所需的顶点数据。
     * @param modelIndices - 可选参数，提供碰撞体所需的索引数据。
     * @returns Ammo.btBvhTriangleMeshShape - BVH 网格形状实例。
     */
    public static createBvhTriangleMeshShape(object3D: Object3D, modelVertices?: Float32Array, modelIndices?: Uint16Array): Ammo.btBvhTriangleMeshShape {
        // 检查 modelVertices 和 modelIndices 是否同时被提供或同时未提供
        if ((modelVertices && !modelIndices) || (!modelVertices && modelIndices)) {
            console.warn('createBvhTriangleMeshShape: Both modelVertices and modelIndices must be provided or neither should be provided.');
        }

        const { vertices, indices } = (modelVertices && modelIndices)
            ? { vertices: modelVertices, indices: modelIndices }
            : this.getAllMeshVerticesAndIndices(object3D);

        const triangleMesh = this.buildTriangleMesh(vertices, indices);
        const shape = new Ammo.btBvhTriangleMeshShape(triangleMesh, true, true);

        const scaling = TempPhyMath.toBtVec(object3D.localScale);
        shape.setLocalScaling(scaling);

        return shape;
    }

    /**
     * 创建 GImpact 网格形状，适用于需要复杂几何表示的动态物体。
     * 基于 GIMPACT 算法，可以用于复杂的三角网格碰撞检测，包括动态物体的交互，此形状性能消耗较高，但提供更精确的碰撞检测。
     * @param object3D - 用于创建碰撞体的三维对象。
     * @param modelVertices - 可选参数，提供碰撞体所需的顶点数据。
     * @param modelIndices - 可选参数，提供碰撞体所需的索引数据。
     * @returns Ammo.btGImpactMeshShape - GImpact 网格形状实例。
     */
    public static createGImpactMeshShape(object3D: Object3D, modelVertices?: Float32Array, modelIndices?: Uint16Array): Ammo.btGImpactMeshShape {
        // 检查 modelVertices 和 modelIndices 是否同时被提供或同时未提供
        if ((modelVertices && !modelIndices) || (!modelVertices && modelIndices)) {
            console.warn('createGImpactMeshShape: Both modelVertices and modelIndices must be provided or neither should be provided.');
        }

        const { vertices, indices } = (modelVertices && modelIndices)
            ? { vertices: modelVertices, indices: modelIndices }
            : this.getAllMeshVerticesAndIndices(object3D);

        const triangleMesh = this.buildTriangleMesh(vertices, indices);
        const shape = new Ammo.btGImpactMeshShape(triangleMesh);
        shape.updateBound();

        const scaling = TempPhyMath.toBtVec(object3D.localScale);
        shape.setLocalScaling(scaling);

        return shape;
    }

    /**
     * 构建 btTriangleMesh 对象，用于创建网格形状。
     * @param vertices - 顶点数据，按 xyz 顺序排列。
     * @param indices - 索引数据，定义三角形的顶点索引。
     * @returns Ammo.btTriangleMesh - 构建的三角形网格。
     */
    public static buildTriangleMesh(vertices: Float32Array, indices: Uint16Array): Ammo.btTriangleMesh {
        let triangleMesh = new Ammo.btTriangleMesh();

        for (let i = 0; i < indices.length; i += 3) {
            const index0 = indices[i] * 3;
            const index1 = indices[i + 1] * 3;
            const index2 = indices[i + 2] * 3;

            const v0 = TempPhyMath.setBtVec(vertices[index0], vertices[index0 + 1], vertices[index0 + 2], TempPhyMath.tmpVecA);
            const v1 = TempPhyMath.setBtVec(vertices[index1], vertices[index1 + 1], vertices[index1 + 2], TempPhyMath.tmpVecB);
            const v2 = TempPhyMath.setBtVec(vertices[index2], vertices[index2 + 1], vertices[index2 + 2], TempPhyMath.tmpVecC);

            triangleMesh.addTriangle(v0, v1, v2, true);
        }

        return triangleMesh;
    }

    /**
     * 获取3D对象所有网格的顶点与索引。
     * @param object3D - 三维对象，通常是模型对象。
     * @returns 顶点数据和索引数据。
     */
    public static getAllMeshVerticesAndIndices(object3D: Object3D) {
        let mr = object3D.getComponents(MeshRenderer);

        if (mr.length === 1) {
            return {
                vertices: mr[0].geometry.getAttribute(VertexAttributeName.position).data as Float32Array,
                indices: mr[0].geometry.getAttribute(VertexAttributeName.indices).data as Uint16Array
            };
        }

        let totalVertexLength = 0;
        let totalIndexLength = 0;

        // 计算总顶点数和总索引数
        mr.forEach(e => {
            totalVertexLength += e.geometry.getAttribute(VertexAttributeName.position).data.length;
            totalIndexLength += e.geometry.getAttribute(VertexAttributeName.indices).data.length;
        });

        let vertices = new Float32Array(totalVertexLength);
        let indices = new Uint16Array(totalIndexLength);

        let vertexOffset = 0;
        let indexOffset = 0;
        let currentIndexOffset = 0;

        // 合并顶点和索引数据
        mr.forEach(e => {
            let vertexArray = e.geometry.getAttribute(VertexAttributeName.position).data;
            vertices.set(vertexArray, vertexOffset);
            vertexOffset += vertexArray.length;

            let indexArray = e.geometry.getAttribute(VertexAttributeName.indices).data;
            for (let i = 0; i < indexArray.length; i++) {
                indices[indexOffset + i] = indexArray[i] + currentIndexOffset;
            }
            indexOffset += indexArray.length;
            currentIndexOffset += vertexArray.length / 3;
        });

        return { vertices, indices };
    }

    /**
     * 计算三维对象的局部包围盒
     * @param object3D - 三维对象
     * @returns 局部包围盒
     */
    private static calculateLocalBoundingBox(object3D: Object3D): BoundingBox {
        // 如果对象存在渲染节点（已添加至场景）并且没有子对象，直接返回其几何包围盒
        if (object3D.renderNode && !object3D.numChildren) {
            return object3D.renderNode.geometry.bounds;
        }

        // 通过旋转重置，计算对象及其子对象的包围盒，此时包围盒结果与局部包围盒相同
        let originalRotation = object3D.localRotation.clone();
        object3D.localRotation = Vector3.ZERO;
        let bounds = BoundUtil.genMeshBounds(object3D);
        object3D.localRotation = originalRotation;
        return bounds;
    }

}
