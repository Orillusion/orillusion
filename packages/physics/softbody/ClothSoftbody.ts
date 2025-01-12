import { Vector3, PlaneGeometry, VertexAttributeName, Quaternion } from '@orillusion/core';
import { SoftbodyBase } from './SoftbodyBase';
import { Ammo, Physics } from '../Physics';
import { TempPhyMath } from '../utils/TempPhyMath';
import { Rigidbody } from '../rigidbody/Rigidbody';

/**
 * 软体布料平面的各个角
 */
export type CornerType = 'leftTop' | 'rightTop' | 'leftBottom' | 'rightBottom' | 'left' | 'right' | 'top' | 'bottom' | 'center';

export class ClothSoftbody extends SoftbodyBase {
    protected declare _geometry: PlaneGeometry;
    private _segmentW: number;
    private _segmentH: number;
    private _offset: Vector3 = new Vector3();
    private _btRigidbody: Ammo.btRigidBody; // 通过锚点附加的 Ammo 刚体实例

    /**
     * 布料的四个角，默认以平面法向量计算各角。
     */
    public clothCorners: [Vector3, Vector3, Vector3, Vector3];

    /**
     * 固定节点索引。
     */
    public fixNodeIndices: CornerType[] | number[] = [];

    /**
     * 添加锚点时需要的刚体。
     */
    public anchorRigidbody: Rigidbody;

    /**
     * 布料的锚点。
     */
    public anchorIndices: CornerType[] | number[] = [];

    /**
     * 仅在设置 `anchorRigidbody` 后有效，表示布料软体相对刚体的位置。
     */
    public anchorPosition: Vector3 = new Vector3();

    /**
     * 仅在设置 `anchorRigidbody` 后有效，表示布料软体相对刚体的旋转。
     */
    public anchorRotation: Vector3 = new Vector3();

    async start(): Promise<void> {

        if (!(this._geometry instanceof PlaneGeometry)) {
            throw new Error('The cloth softbody requires plane geometry.');
        }

        if (this.anchorRigidbody) {
            this._btRigidbody = await this.anchorRigidbody.wait();
        }
        this._segmentW = this._geometry.segmentW;
        this._segmentH = this._geometry.segmentH;

        super.start()
    }

    protected initSoftBody(): Ammo.btSoftBody {

        // Defines the four corners of the cloth
        let clothCorner00: Ammo.btVector3,
            clothCorner01: Ammo.btVector3,
            clothCorner10: Ammo.btVector3,
            clothCorner11: Ammo.btVector3;

        if (!this.clothCorners) {
            const up = this._geometry.up;
            let right = up.equals(Vector3.X_AXIS) ? Vector3.BACK : Vector3.X_AXIS;

            right = up.crossProduct(right).normalize();
            const forward = right.crossProduct(up).normalize();

            const halfWidth = this._geometry.width / 2;
            const halfHeight = this._geometry.height / 2;

            const corner00 = right.mul(halfWidth).add(forward.mul(-halfHeight)); // leftTop
            const corner01 = right.mul(halfWidth).add(forward.mul(halfHeight)); // rightTop
            const corner10 = right.mul(-halfWidth).add(forward.mul(-halfHeight)); // leftBottom
            const corner11 = right.mul(-halfWidth).add(forward.mul(halfHeight)); // rightBottom

            clothCorner00 = TempPhyMath.toBtVec(corner00, TempPhyMath.tmpVecA);
            clothCorner01 = TempPhyMath.toBtVec(corner01, TempPhyMath.tmpVecB);
            clothCorner10 = TempPhyMath.toBtVec(corner10, TempPhyMath.tmpVecC);
            clothCorner11 = TempPhyMath.toBtVec(corner11, TempPhyMath.tmpVecD);

        } else {
            clothCorner00 = TempPhyMath.toBtVec(this.clothCorners[0], TempPhyMath.tmpVecA)
            clothCorner01 = TempPhyMath.toBtVec(this.clothCorners[1], TempPhyMath.tmpVecB);
            clothCorner10 = TempPhyMath.toBtVec(this.clothCorners[2], TempPhyMath.tmpVecC);
            clothCorner11 = TempPhyMath.toBtVec(this.clothCorners[3], TempPhyMath.tmpVecD);
        }

        const clothSoftbody = new Ammo.btSoftBodyHelpers().CreatePatch(
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

        return clothSoftbody;
    }

    protected configureSoftBody(clothSoftbody: Ammo.btSoftBody): void {

        // 软体配置
        const sbConfig = clothSoftbody.get_m_cfg();
        sbConfig.set_viterations(10); // 位置迭代次数
        sbConfig.set_piterations(10); // 位置求解器迭代次数

        clothSoftbody.generateBendingConstraints(2, clothSoftbody.get_m_materials().at(0));

        // 固定节点
        if (this.fixNodeIndices.length > 0) this.applyFixedNodes(this.fixNodeIndices);

        // 添加锚点
        if (this.anchorIndices.length > 0) {
            if (!this._btRigidbody) throw new Error('Needs a rigid body');
            this.applyAnchor(clothSoftbody);
        } else {
            clothSoftbody.rotate(TempPhyMath.eulerToBtQua(this.transform.localRotation));
            clothSoftbody.translate(TempPhyMath.toBtVec(this.transform.localPosition));
        }

    }

    private applyAnchor(clothSoftbody: Ammo.btSoftBody): void {

        let tm = this._btRigidbody.getWorldTransform();
        TempPhyMath.fromBtVec(tm.getOrigin(), Vector3.HELP_0);
        Vector3.HELP_0.add(this.anchorPosition, Vector3.HELP_1);

        TempPhyMath.fromBtQua(tm.getRotation(), Quaternion.HELP_0);
        Quaternion.HELP_1.fromEulerAngles(this.anchorRotation.x, this.anchorRotation.y, this.anchorRotation.z);
        Quaternion.HELP_1.multiply(Quaternion.HELP_0, Quaternion.HELP_1);

        clothSoftbody.rotate(TempPhyMath.toBtQua(Quaternion.HELP_1));
        clothSoftbody.translate(TempPhyMath.toBtVec(Vector3.HELP_1));

        const anchorIndices = this.getCornerIndices(this.anchorIndices);
        anchorIndices.forEach((nodeIndex) => {
            clothSoftbody.appendAnchor(nodeIndex, this._btRigidbody, this.disableCollision, this.influence);
        });
    }

    /**
     * 将 CornerType 数组转换成节点索引数组。
     * @param cornerList 需要转换的 CornerType 数组。
     * @returns 节点索引数组
     */
    private getCornerIndices(cornerList: CornerType[] | number[]): number[] {

        if (typeof cornerList[0] === 'number') return cornerList as number[];

        const W = this._segmentW;
        const H = this._segmentH;
        return (cornerList as CornerType[]).map(corner => {
            switch (corner) {
                case 'left': return this.getVertexIndex(0, Math.floor(H / 2));
                case 'right': return this.getVertexIndex(W, Math.floor(H / 2));
                case 'top': return this.getVertexIndex(Math.floor(W / 2), 0);
                case 'bottom': return this.getVertexIndex(Math.floor(W / 2), H);
                case 'center': return this.getVertexIndex(Math.floor(W / 2), Math.floor(H / 2));
                case 'leftTop': return 0;
                case 'rightTop': return W;
                case 'leftBottom': return this.getVertexIndex(0, H);
                case 'rightBottom': return this.getVertexIndex(W, H);
                default: throw new Error('Invalid corner');
            }
        });

    }

    private getVertexIndex(x: number, y: number): number {
        return y * (this._segmentW + 1) + x;
    }

    /**
     * 固定软体节点。
     * @param fixedNodeIndices 表示需要固定的节点索引或 CornerType 数组。
     */
    public applyFixedNodes(fixedNodeIndices: CornerType[] | number[]): void {
        this.wait().then(() => {
            const indexArray = this.getCornerIndices(fixedNodeIndices);
            super.applyFixedNodes(indexArray);
        })
    }

    /**
     * 清除锚点，软体将会从附加的刚体上脱落
     */
    public clearAnchors(): void {
        this._btSoftbody.get_m_anchors().clear();
        this._offset.set(0, 0, 0);
        this._btRigidbody = null;
        this.anchorRigidbody = null;
    }

    onUpdate(): void {
        if (!this._btBodyInited) return;

        // 根据锚点刚体的插值坐标平滑软体运动
        if (this._btRigidbody) {
            this._btRigidbody.getMotionState().getWorldTransform(Physics.TEMP_TRANSFORM);
            const nowPos = this._btRigidbody.getWorldTransform().getOrigin();

            TempPhyMath.fromBtVec(Physics.TEMP_TRANSFORM.getOrigin(), Vector3.HELP_0);
            TempPhyMath.fromBtVec(nowPos, Vector3.HELP_1);
            Vector3.sub(Vector3.HELP_0, Vector3.HELP_1, this._offset);
        }

        const vertices = this._geometry.getAttribute(VertexAttributeName.position);
        const normals = this._geometry.getAttribute(VertexAttributeName.normal);

        const nodes = this._btSoftbody.get_m_nodes();
        for (let i = 0; i < nodes.size(); i++) {
            const node = nodes.at(i);
            const pos = node.get_m_x();
            vertices.data[3 * i] = pos.x() + this._offset.x;
            vertices.data[3 * i + 1] = pos.y() + this._offset.y;
            vertices.data[3 * i + 2] = pos.z() + this._offset.z;

            const normal = node.get_m_n();
            normals.data[3 * i] = -normal.x();
            normals.data[3 * i + 1] = -normal.y();
            normals.data[3 * i + 2] = -normal.z();
        }

        this._geometry.vertexBuffer.upload(VertexAttributeName.position, vertices);
        this._geometry.vertexBuffer.upload(VertexAttributeName.normal, normals);
    }

    public destroy(force?: boolean): void {
        this._btRigidbody = null;
        this.anchorRigidbody = null;
        super.destroy(force);
    }
}
