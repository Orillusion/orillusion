import { ComponentBase, GeometryBase, MeshRenderer } from '@orillusion/core';
import { Ammo, Physics } from '../Physics';
import { ActivationState } from '../rigidbody/RigidbodyEnum';
import { Rigidbody } from '../rigidbody/Rigidbody';

export abstract class SoftbodyBase extends ComponentBase {
    private _initResolve!: () => void;
    private _initializationPromise: Promise<void> = new Promise<void>(r => this._initResolve = r);

    protected _btBodyInited: boolean = false;
    protected _btSoftbody: Ammo.btSoftBody;
    protected _geometry: GeometryBase;

    /**
     * 软体的总质量，默认值为 `1`
     */
    public mass: number = 1;

    /**
     * 碰撞边距，默认值为 `0.15`
     */
    public margin: number = 0.15;

    /**
     * 碰撞组，默认值为 `1`
     */
    public group: number = 1;

    /**
     * 碰撞掩码，默认值为 `-1`
     */
    public mask: number = -1;

    /**
     * 锚点的影响力。影响力值越大，软体节点越紧密地跟随刚体的运动。通常，这个值在0到1之间。默认值为 `1`。
     */
    public influence: number = 1;

    /**
     * 是否禁用与锚定刚体之间的碰撞，默认值为 `false`。
     */
    public disableCollision: boolean = false;

    /**
     * 设置软体激活状态。
     */
    public set activationState(value: ActivationState) {
        this.wait().then(btSoftbody => btSoftbody.setActivationState(value));
    }

    public get btBodyInited(): boolean {
        return this._btBodyInited;
    }

    public get btSoftBody(): Ammo.btSoftBody {
        return this._btSoftbody;
    }

    init(): void {
        if (!Physics.isSoftBodyWord) {
            throw new Error('Enable soft body simulation by setting Physics.init({useSoftBody: true}) during initialization.');
        }

        this._geometry = this.object3D.getComponent(MeshRenderer)?.geometry;

        if (!this._geometry) {
            throw new Error('SoftBody requires valid geometry.');
        }

    }

    async start(): Promise<void> {
        const btSoftbody = this._btSoftbody = this.initSoftBody();
        this.configureSoftBody(btSoftbody);

        btSoftbody.setTotalMass(this.mass, false);
        Ammo.castObject(btSoftbody, Ammo.btCollisionObject).getCollisionShape().setMargin(this.margin);
        (Physics.world as Ammo.btSoftRigidDynamicsWorld).addSoftBody(btSoftbody, this.group, this.mask);

        // 软体变换将由顶点更新表示，避免影响需要重置对象变换
        // this.transform.localPosition = this.transform.localRotation = Vector3.ZERO;
        // this.transform.localScale = Vector3.ONE;
        this.transform.worldMatrix.identity();

        this._btBodyInited = true;
        this._initResolve();
    }

    protected abstract initSoftBody(): Ammo.btSoftBody;
    protected abstract configureSoftBody(softbody: Ammo.btSoftBody): void;

    /**
     * Asynchronously retrieves the fully initialized soft body instance.
     */
    public async wait(): Promise<Ammo.btSoftBody> {
        await this._initializationPromise;
        return this._btSoftbody;
    }

    /**
     * Wraps the native soft body's `appendAnchor` method to anchor a node to a rigid body.
     * @param nodeIndex - Index of the node to anchor.
     * @param targetRigidbody - The rigid body to anchor to.
     * @param disCollision - Optional. Disable collisions if true.
     * @param influence - Optional. Anchor's influence.
     */
    public appendAnchor(nodeIndex: number, targetRigidbody: Rigidbody, disCollision?: boolean, influence?: number): void {
        disCollision ??= this.disableCollision;
        influence ??= this.influence;
        targetRigidbody.wait().then(btRigidbody => {
            this.wait().then(ropeSoftbody => {
                ropeSoftbody.appendAnchor(nodeIndex, btRigidbody, disCollision, influence);
            })
        })
    }

    /**
     * 固定软体节点。
     * @param fixedNodeIndices 需要固定的节点索引。
     */
    public applyFixedNodes(fixedNodeIndices: number[]): void {
        this.wait().then(btSoftbody => {
            const nodes = btSoftbody.get_m_nodes();
            fixedNodeIndices.forEach(i => {
                if (i >= 0 && i < nodes.size()) {
                    nodes.at(i).get_m_v().setValue(0, 0, 0);
                    nodes.at(i).get_m_f().setValue(0, 0, 0);
                    nodes.at(i).set_m_im(0);
                } else {
                    console.warn(`Index ${i} is out of bounds for nodes array.`);
                }
            });
        })
    }

    /**
     * 清除固定节点
     * @param index 需要清除的节点索引，如果未提供，则清除所有节点。
     */
    public clearFixedNodes(index?: number): void {
        const nodes = this._btSoftbody.get_m_nodes();
        const size = nodes.size();
        let inverseMass = 1 / this.mass * size;

        if (index != undefined) {
            nodes.at(index).set_m_im(inverseMass);
            return;
        }

        for (let i = 0; i < size; i++) {
            nodes.at(i).set_m_im(inverseMass);
        }
    }


    public destroy(force?: boolean): void {
        if (this._btBodyInited) {
            if (Physics.world instanceof Ammo.btSoftRigidDynamicsWorld) {
                Physics.world.removeSoftBody(this._btSoftbody);
                Ammo.destroy(this._btSoftbody);
            }

            this._geometry = null;
            this._btSoftbody = null;
            this._btBodyInited = false;
        }
        super.destroy(force);
    }

}
