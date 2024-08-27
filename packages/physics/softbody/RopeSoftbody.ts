import { Vector3, VertexAttributeName, GeometryBase } from '@orillusion/core';
import { SoftbodyBase } from './SoftbodyBase';
import { Ammo, Physics } from '../Physics';
import { TempPhyMath } from '../utils/TempPhyMath';
import { Rigidbody } from '../rigidbody/Rigidbody';

export class RopeSoftbody extends SoftbodyBase {
    /**
     * 绳索两端的固定选项，默认值为 `0`
     * 
     * `0`：两端不固定，`1`：起点固定，`2`：终点固定，`3`：两端固定
     */
    public fixeds: number = 0;

    /**
     * 固定节点索引，与 `fixeds` 属性作用相同，但可以更自由的控制任意节点。
     */
    public fixNodeIndices: number[] = [];

    /**
     * 绳索弹性，值越大弹性越低，通常设置为 0 到 1 之间，默认值为 `0.5`。
     */
    public elasticity: number = 0.5;

    /**
     * 绳索起点处锚定的刚体，设置此项后绳索的起点将与该刚体的位置相同。
     */
    public anchorRigidbodyHead: Rigidbody;

    /**
     * 绳索终点处锚定的刚体，设置此项后绳索的终点将与该刚体的位置相同。
     */
    public anchorRigidbodyTail: Rigidbody;

    /**
     * 锚点的起点偏移量，表示起点与锚定的刚体之间的相对位置。
     */
    public anchorOffsetHead: Vector3 = new Vector3();

    /**
     * 锚点的终点偏移量，表示终点与锚定的刚体之间的相对位置。
     */
    public anchorOffsetTail: Vector3 = new Vector3();

    private _positionHead: Vector3;
    private _positionTail: Vector3;

    async start(): Promise<void> {
        if (this.anchorRigidbodyHead) {
            const bodyA = await this.anchorRigidbodyHead.wait();
            this._positionHead = TempPhyMath.fromBtVec(bodyA.getWorldTransform().getOrigin());
            this._positionHead.add(this.anchorOffsetHead, this._positionHead);
        }
        if (this.anchorRigidbodyTail) {
            const bodyB = await this.anchorRigidbodyTail.wait();
            this._positionTail = TempPhyMath.fromBtVec(bodyB.getWorldTransform().getOrigin());
            this._positionTail.add(this.anchorOffsetTail, this._positionTail);
        }
        super.start();
    }

    protected initSoftBody(): Ammo.btSoftBody {
        const vertexArray = this._geometry.getAttribute(VertexAttributeName.position).data;

        this._positionHead ||= new Vector3(vertexArray[0], vertexArray[1], vertexArray[2]);
        this._positionTail ||= new Vector3(vertexArray.at(-3), vertexArray.at(-2), vertexArray.at(-1));

        const ropeStart = TempPhyMath.toBtVec(this._positionHead, TempPhyMath.tmpVecA);
        const ropeEnd = TempPhyMath.toBtVec(this._positionTail, TempPhyMath.tmpVecB);
        const segmentCount = this._geometry.vertexCount - 1;

        const ropeSoftbody = new Ammo.btSoftBodyHelpers().CreateRope(
            Physics.worldInfo,
            ropeStart,
            ropeEnd,
            segmentCount - 1,
            this.fixeds
        );

        return ropeSoftbody;
    }

    protected configureSoftBody(ropeSoftbody: Ammo.btSoftBody): void {

        // 设置软体配置与材质
        const sbConfig = ropeSoftbody.get_m_cfg();
        sbConfig.set_viterations(10); // 位置迭代次数
        sbConfig.set_piterations(10); // 位置求解器迭代次数 

        this.setElasticity(this.elasticity);

        // 固定节点
        if (this.fixNodeIndices.length > 0) this.applyFixedNodes(this.fixNodeIndices);

        // 锚定刚体
        if (this.anchorRigidbodyHead) {
            const body = this.anchorRigidbodyHead.btRigidbody;
            ropeSoftbody.appendAnchor(0, body, this.disableCollision, this.influence);
        }
        if (this.anchorRigidbodyTail) {
            const body = this.anchorRigidbodyTail.btRigidbody;
            ropeSoftbody.appendAnchor(this._geometry.vertexCount - 1, body, this.disableCollision, this.influence);
        }

    }

    /**
     * set rope elasticity to 0~1
     */
    public setElasticity(value: number): void {
        this.elasticity = value;
        this.wait().then(ropeSoftbody => {
            const material = ropeSoftbody.get_m_materials().at(0);
            material.set_m_kLST(value); // 线性弹性
            material.set_m_kAST(value); // 角度弹性
        })
    }

    /**
     * 清除锚点，软体将会从附加的刚体上脱落
     * @param isPopBack 是否只删除一个锚点，当存在首尾两个锚点时，删除终点的锚点。
     */
    public clearAnchors(isPopBack?: boolean): void {
        if (isPopBack) {
            this._btSoftbody.get_m_anchors().pop_back();
        } else {
            this._btSoftbody.get_m_anchors().clear();
        }
    }

    onUpdate(): void {

        if (!this._btBodyInited) return;

        const nodes = this._btSoftbody.get_m_nodes();
        const vertices = this._geometry.getAttribute(VertexAttributeName.position);

        for (let i = 0; i < nodes.size(); i++) {
            const pos = nodes.at(i).get_m_x();
            vertices.data[3 * i] = pos.x();
            vertices.data[3 * i + 1] = pos.y();
            vertices.data[3 * i + 2] = pos.z();
        }

        this._geometry.vertexBuffer.upload(VertexAttributeName.position, vertices);

    }


    public destroy(force?: boolean): void {
        this.anchorRigidbodyHead = null;
        this.anchorRigidbodyTail = null;
        super.destroy(force);
    }

    /**
     * 构建绳索（线条）几何体，注意添加材质时需要将拓扑结构 `topology` 设置为 `'line-list'`。
     * @param segmentCount 分段数
     * @param startPos 起点
     * @param endPos 终点
     * @returns GeometryBase
     */
    public static buildRopeGeometry(segmentCount: number, startPos: Vector3, endPos: Vector3): GeometryBase {

        let vertices = new Float32Array((segmentCount + 1) * 3);
        let indices = new Uint16Array(segmentCount * 2);

        for (let i = 0; i < segmentCount; i++) {
            indices[i * 2] = i;
            indices[i * 2 + 1] = i + 1;
        }

        // 计算每个顶点之间的增量
        const deltaX = (endPos.x - startPos.x) / segmentCount;
        const deltaY = (endPos.y - startPos.y) / segmentCount;
        const deltaZ = (endPos.z - startPos.z) / segmentCount;

        for (let i = 0; i <= segmentCount; i++) {
            vertices[i * 3] = startPos.x + deltaX * i;
            vertices[i * 3 + 1] = startPos.y + deltaY * i;
            vertices[i * 3 + 2] = startPos.z + deltaZ * i;
        }

        const ropeGeometry = new GeometryBase();
        ropeGeometry.setIndices(indices);
        ropeGeometry.setAttribute(VertexAttributeName.position, vertices);
        ropeGeometry.addSubGeometry({
            indexStart: 0,
            indexCount: indices.length,
            vertexStart: 0,
            vertexCount: 0,
            firstStart: 0,
            index: 0,
            topology: 0
        });

        return ropeGeometry;
    }

}
