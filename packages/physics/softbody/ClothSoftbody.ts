// ClothSoftbody.ts

import { Vector3, MeshRenderer, PlaneGeometry, ComponentBase, VertexAttributeName, Quaternion } from '@orillusion/core';
import { Ammo, Physics } from '../Physics';
import { TempPhyMath } from '../utils/TempPhyMath';
import { Rigidbody } from '../rigidbody/Rigidbody';

/**
 * 软体布料平面的各个角
 */
export type CornerType = 'leftTop' | 'rightTop' | 'leftBottom' | 'rightBottom' | 'left' | 'right' | 'top' | 'bottom' | 'center';

export class ClothSoftbody extends ComponentBase {
    private _initResolve!: () => void;
    private _initializationPromise: Promise<void> = new Promise<void>(r => this._initResolve = r);
    private _btBodyInited: boolean = false;
    private _btSoftbody: Ammo.btSoftBody; // 创建的 Ammo 软体实例
    private _btRigidbody: Ammo.btRigidBody; // 通过锚点附加的 Ammo 刚体实例
    private _anchorRigidbody: Rigidbody;
    private _segmentW: number;
    private _segmentH: number;
    private _geometry: PlaneGeometry;
    private _diff: Vector3 = new Vector3();

    /**
     * 布料四个角的位置 (00,01,10,11)
     */
    public clothCorners: [Vector3, Vector3, Vector3, Vector3];

    /**
     * 软体的总质量
     * @default 1
     */
    public mass: number = 1;

    /**
     * 软体的碰撞边距
     * @default 0.05
     */
    public margin: number = 0.05;

    /**
     * 固定布料的节点
     */
    public fixNodeIndices: CornerType[] | number[] = [];

    /**
     * 布料的锚点
     */
    public anchorIndices: CornerType[] | number[] = [];

    /**
     * 锚定的影响力。影响力值越大，软体节点越紧密地跟随刚体的运动。通常，这个值在0到1之间
     * @default 0.5
     */
    public influence: number | number[] = 0.5;

    /**
     * 是否禁用锚定节点与刚体之间的碰撞，将其设置为true可以防止锚定节点和刚体之间发生物理碰撞
     * @default false
     */
    public disableCollision: boolean | boolean[] = false;

    /**
     * 当没有附加（锚定）到刚体时，应用绝对位置，否则是基于刚体的相对位置
     */
    public applyPosition: Vector3 = new Vector3();

    /**
     * 当没有附加（锚定）到刚体时，应用绝对旋转，否则是基于刚体的相对旋转
     */
    public applyRotation: Vector3 = new Vector3();

    /**
     * 碰撞组
     * @default 1
     */
    public group: number = 1;

    /**
     * 碰撞掩码
     * @default -1
     */
    public mask: number = -1;

    /**
     * 添加锚点时需要的刚体
     */
    public get anchorRigidbody(): Rigidbody {
        return this._anchorRigidbody;
    }

    public set anchorRigidbody(value: Rigidbody) {
        this._anchorRigidbody = value;
        this._diff.set(0, 0, 0);
    }

    public get btBodyInited(): boolean {
        return this._btBodyInited;
    }

    /**
     * return the soft body instance
     */
    public get btSoftbody(): Ammo.btSoftBody {
        return this._btSoftbody;
    }

    /**
     * Asynchronously retrieves the fully initialized soft body instance.
     */
    public async wait(): Promise<Ammo.btSoftBody> {
        await this._initializationPromise;
        return this._btSoftbody;
    }

    /**
     * 停止软体运动
     */
    public stopSoftBodyMovement(): void {
        const nodes = this._btSoftbody.get_m_nodes();
        for (let i = 0; i < nodes.size(); i++) {
            const node = nodes.at(i);
            node.get_m_v().setValue(0, 0, 0);
            node.get_m_f().setValue(0, 0, 0);
        }
    }

    init(): void {

        if (!Physics.isSoftBodyWord) {
            throw new Error('Enable soft body simulation by setting Physics.init({useSoftBody: true}) during initialization.');
        }

        let geometry = this.object3D.getComponent(MeshRenderer).geometry;
        if (!(geometry instanceof PlaneGeometry)) throw new Error('The cloth softbody requires plane geometry');
        this._geometry = geometry;
        this._segmentW = geometry.segmentW;
        this._segmentH = geometry.segmentH;
    }

    async start(): Promise<void> {

        if (this._anchorRigidbody) {
            this._btRigidbody = await this._anchorRigidbody.wait();
        }

        this.initSoftBody();

        this._btBodyInited = true;
        this._initResolve();
    }

    private initSoftBody(): void {
        
        // Defines the four corners of the cloth
        let clothCorner00: Ammo.btVector3,
            clothCorner01: Ammo.btVector3,
            clothCorner10: Ammo.btVector3,
            clothCorner11: Ammo.btVector3;

        if (!this.clothCorners) {
            const halfWidth = this._geometry.width / 2;
            const halfHeight = this._geometry.height / 2;
            clothCorner00 = TempPhyMath.setBtVec(-halfWidth, halfHeight, 0, TempPhyMath.tmpVecA);
            clothCorner01 = TempPhyMath.setBtVec(halfWidth, halfHeight, 0, TempPhyMath.tmpVecB);
            clothCorner10 = TempPhyMath.setBtVec(-halfWidth, -halfHeight, 0, TempPhyMath.tmpVecC);
            clothCorner11 = TempPhyMath.setBtVec(halfWidth, -halfHeight, 0, TempPhyMath.tmpVecD);
        } else {
            clothCorner00 = TempPhyMath.toBtVec(this.clothCorners[0], TempPhyMath.tmpVecA)
            clothCorner01 = TempPhyMath.toBtVec(this.clothCorners[1], TempPhyMath.tmpVecB);
            clothCorner10 = TempPhyMath.toBtVec(this.clothCorners[2], TempPhyMath.tmpVecC);
            clothCorner11 = TempPhyMath.toBtVec(this.clothCorners[3], TempPhyMath.tmpVecD);
        }

        this._btSoftbody = new Ammo.btSoftBodyHelpers().CreatePatch(
            Physics.worldInfo,
            clothCorner00,
            clothCorner01,
            clothCorner10,
            clothCorner11,
            this._segmentW + 1,
            this._segmentH + 1,
            0,
            true
        );

        this.configureSoftBody(this._btSoftbody);

        this._btSoftbody.setTotalMass(this.mass, false);
        Ammo.castObject(this._btSoftbody, Ammo.btCollisionObject).getCollisionShape().setMargin(this.margin);
        this._btSoftbody.generateBendingConstraints(2, this._btSoftbody.get_m_materials().at(0));

        // 固定节点
        if (this.fixNodeIndices.length > 0) {
            this.applyFixedNodes(this.fixNodeIndices);
        }

        // 添加锚点
        if (this.anchorIndices.length > 0) {
            if (!this._btRigidbody) throw new Error('Needs a rigid body');
            this.setAnchor();
        } else {
            // 先旋转再平移，矩阵变换不满足交换律
            this._btSoftbody.rotate(TempPhyMath.eulerToBtQua(this.applyRotation));
            this._btSoftbody.translate(TempPhyMath.toBtVec(this.applyPosition));
        }

        // 布料变换将由顶点更新表示，避免影响需要重置三维对象变换
        this.transform.localPosition = Vector3.ZERO;
        this.transform.localRotation = Vector3.ZERO;

        (Physics.world as Ammo.btSoftRigidDynamicsWorld).addSoftBody(this._btSoftbody, this.group, this.mask);
    }

    private configureSoftBody(softBody: Ammo.btSoftBody): void {
        // 设置配置参数
        let sbConfig = softBody.get_m_cfg();
        sbConfig.set_viterations(10); // 位置迭代次数
        sbConfig.set_piterations(10); // 位置求解器迭代次数
        // sbConfig.set_diterations(10); // 动力学迭代次数
        // sbConfig.set_citerations(10); // 碰撞迭代次数
        // sbConfig.set_kVCF(1.0); // 速度收敛系数
        // sbConfig.set_kDP(0.1); // 阻尼系数
        // sbConfig.set_kDG(0.0); // 阻力系数
        // sbConfig.set_kLF(0.05); // 升力系数
        // sbConfig.set_kPR(0.0); // 压力系数
        // sbConfig.set_kVC(0.0); // 体积保护系数
        // sbConfig.set_kDF(0.0); // 动力学系数
        // sbConfig.set_kMT(0.0); // 电磁系数
        // sbConfig.set_kCHR(1.0); // 刚性系数
        // sbConfig.set_kKHR(0.5); // 刚性恢复系数
        // sbConfig.set_kSHR(1.0); // 剪切刚性系数
        // sbConfig.set_kAHR(0.1); // 角度恢复系数
        // sbConfig.set_kSRHR_CL(1.0); // 拉伸刚性恢复系数
        // sbConfig.set_kSKHR_CL(0.5); // 刚性恢复系数
        // sbConfig.set_kSSHR_CL(0.1); // 剪切刚性恢复系数
        // sbConfig.set_kSR_SPLT_CL(0.5); // 拉伸分割系数
        // sbConfig.set_kSK_SPLT_CL(0.5); // 剪切分割系数
        // sbConfig.set_kSS_SPLT_CL(0.5); // 剪切分割系数
        // sbConfig.set_maxvolume(1.0); // 最大体积
        // sbConfig.set_timescale(1.0); // 时间缩放系数
        // sbConfig.set_collisions(0); // 碰撞设置

        // 获取材质并设置参数
        const material = softBody.get_m_materials().at(0);
        material.set_m_kLST(0.4); // 设置线性弹性系数
        material.set_m_kAST(0.4); // 设置角度弹性系数
        // material.set_m_kVST(0.2); // 设置体积弹性系数
        // material.set_m_flags(0); // 设置材质标志
    }

    onUpdate(): void {
        if (!this._btBodyInited) return;

        // 根据锚点刚体的插值坐标平滑软体运动
        if (this._btRigidbody) {
            this._btRigidbody.getMotionState().getWorldTransform(Physics.TEMP_TRANSFORM);
            const nowPos = this._btRigidbody.getWorldTransform().getOrigin();

            TempPhyMath.fromBtVec(Physics.TEMP_TRANSFORM.getOrigin(), Vector3.HELP_0);
            TempPhyMath.fromBtVec(nowPos, Vector3.HELP_1);
            Vector3.sub(Vector3.HELP_0, Vector3.HELP_1, this._diff);
        }

        const vertices = this._geometry.getAttribute(VertexAttributeName.position);
        const normals = this._geometry.getAttribute(VertexAttributeName.normal);

        const nodes = this._btSoftbody.get_m_nodes();
        for (let i = 0; i < nodes.size(); i++) {
            const node = nodes.at(i);
            const pos = node.get_m_x();
            vertices.data[3 * i] = pos.x() + this._diff.x;
            vertices.data[3 * i + 1] = pos.y() + this._diff.y;
            vertices.data[3 * i + 2] = pos.z() + this._diff.z;

            const normal = node.get_m_n();
            normals.data[3 * i] = normal.x();
            normals.data[3 * i + 1] = normal.y();
            normals.data[3 * i + 2] = normal.z();
        }

        this._geometry.vertexBuffer.upload(VertexAttributeName.position, vertices);
        this._geometry.vertexBuffer.upload(VertexAttributeName.normal, normals);
    }

    private setAnchor() {
        const anchorIndices = typeof this.anchorIndices[0] === 'number'
            ? this.anchorIndices as number[]
            : this.getCornerIndices(this.anchorIndices as CornerType[]);

        const nodesSize = this._btSoftbody.get_m_nodes().size();
        anchorIndices.forEach(nodeIndex => {
            if (nodeIndex < 0 || nodeIndex >= nodesSize) {
                console.error(`Invalid node index ${nodeIndex} for soft body`);
                return;
            }
        });

        let tm = this._btRigidbody.getWorldTransform();
        TempPhyMath.fromBtVec(tm.getOrigin(), Vector3.HELP_0);
        Vector3.HELP_0.add(this.applyPosition, Vector3.HELP_1);

        TempPhyMath.fromBtQua(tm.getRotation(), Quaternion.HELP_0)
        Quaternion.HELP_1.fromEulerAngles(this.applyRotation.x, this.applyRotation.y, this.applyRotation.z);
        Quaternion.HELP_1.multiply(Quaternion.HELP_0, Quaternion.HELP_1);

        this._btSoftbody.rotate(TempPhyMath.toBtQua(Quaternion.HELP_1));
        this._btSoftbody.translate(TempPhyMath.toBtVec(Vector3.HELP_1));

        anchorIndices.forEach((nodeIndex, idx) => {
            const influence = Array.isArray(this.influence) ? (this.influence[idx] ?? 0.5) : this.influence;
            const disableCollision = Array.isArray(this.disableCollision) ? (this.disableCollision[idx] ?? false) : this.disableCollision;
            this._btSoftbody.appendAnchor(nodeIndex, this._btRigidbody, disableCollision, influence);
        });
    }

    private getVertexIndex(x: number, y: number): number {
        return y * (this._segmentW + 1) + x;
    }

    /**
     * 将 CornerType 数组转换成节点索引数组。
     * @param cornerList 需要转换的 CornerType 数组。
     * @returns 节点索引数组
     */
    private getCornerIndices(cornerList: CornerType[]): number[] {
        const W = this._segmentW;
        const H = this._segmentH;
        return cornerList.map(corner => {
            switch (corner) {
                case 'left':
                    return this.getVertexIndex(0, Math.floor(H / 2));
                case 'right':
                    return this.getVertexIndex(W, Math.floor(H / 2));
                case 'top':
                    return this.getVertexIndex(Math.floor(W / 2), 0);
                case 'bottom':
                    return this.getVertexIndex(Math.floor(W / 2), H);
                case 'center':
                    return this.getVertexIndex(Math.floor(W / 2), Math.floor(H / 2));
                case 'leftTop':
                    return 0;
                case 'rightTop':
                    return W;
                case 'leftBottom':
                    return this.getVertexIndex(0, H);
                case 'rightBottom':
                    return this.getVertexIndex(W, H);
                default:
                    throw new Error('Invalid corner');
            }
        });
    }

    /**
     * 固定软体节点。
     * @param fixedNodeIndices 表示需要固定的节点索引或 CornerType 数组。
     */
    public applyFixedNodes(fixedNodeIndices: CornerType[] | number[]) {
        // 确定索引数组
        const indexArray: number[] = typeof fixedNodeIndices[0] === 'number'
            ? fixedNodeIndices as number[]
            : this.getCornerIndices(fixedNodeIndices as CornerType[]);

        const nodes = this._btSoftbody.get_m_nodes();
        indexArray.forEach(i => {
            if (i >= 0 && i < nodes.size()) {
                nodes.at(i).get_m_v().setValue(0, 0, 0);
                nodes.at(i).get_m_f().setValue(0, 0, 0);
                nodes.at(i).set_m_im(0);
            } else {
                console.warn(`Index ${i} is out of bounds for nodes array.`);
            }
        });
    }

    /**
     * 清除所有锚点，软体将会从附加的刚体上脱落
     */
    public clearAnchors() {
        this._btSoftbody.get_m_anchors().clear();
        this._btRigidbody = null;
    }

    public destroy(force?: boolean): void {
        if (this._btBodyInited) {
            (Physics.world as Ammo.btSoftRigidDynamicsWorld).removeSoftBody(this._btSoftbody);
            Ammo.destroy(this._btSoftbody);
            this._btSoftbody = null;
        }
        this._btBodyInited = false;
        this._btRigidbody = null;
        this._anchorRigidbody = null;
        super.destroy(force);
    }
}
