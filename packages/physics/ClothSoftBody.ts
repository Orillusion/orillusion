import Ammo from '@orillusion/ammo';
import { ComponentBase, Vector3, PlaneGeometry } from '@orillusion/core'
import { Physics } from './Physics';
/**
 * @internal
 * @group Plugin
 */
export class ClothSoftBody extends ComponentBase {
    private _mass: number = 0.01;

    private _planeGeo: PlaneGeometry;

    private _clothCorner00: Vector3;

    private _clothCorner01: Vector3;

    private _clothCorner10: Vector3;

    private _clothCorner11: Vector3;

    private _softBody: Ammo.btSoftBody;

    // get  setter clothcorner
    public get clothCorner00(): Vector3 {
        return this._clothCorner00;
    }

    public set clothCorner00(value: Vector3) {
        this._clothCorner00 = value;
    }

    public set clothCorner01(value: Vector3) {
        this._clothCorner01 = value;
    }

    public set clothCorner10(value: Vector3) {
        this._clothCorner10 = value;
    }

    public get clothCorner11(): Vector3 {
        return this._clothCorner11;
    }

    public set clothCorner11(value: Vector3) {
        this._clothCorner11 = value;
    }

    public get planeGeometry(): PlaneGeometry {
        return this._planeGeo;
    }

    public set planeGeometry(value: PlaneGeometry) {
        this._planeGeo = value;
    }

    public get mass(): number {
        return this._mass;
    }

    public set mass(value: number) {
        this._mass = value;
    }

    start(): void {
        if (!this._planeGeo) {
            console.error('cloth need planeGeometry');
            return;
        }

        if (!this._clothCorner00) {
            console.error('cloth need clothCorner00');
            return;
        }

        if (!this._clothCorner01) {
            console.error('cloth need clothCorner01');
            return;
        }

        if (!this._clothCorner10) {
            console.error('cloth need clothCorner10');
            return;
        }

        if (!this.clothCorner11) {
            console.error('cloth need clothCorner11');
            return;
        }
        var cc00 = new Ammo.btVector3(this._clothCorner00.x, this._clothCorner00.y, this._clothCorner00.z);
        var cc01 = new Ammo.btVector3(this._clothCorner01.x, this._clothCorner01.y, this._clothCorner01.z);
        var cc10 = new Ammo.btVector3(this._clothCorner10.x, this._clothCorner10.y, this._clothCorner10.z);
        var cc11 = new Ammo.btVector3(this._clothCorner11.x, this._clothCorner11.y, this._clothCorner11.z);

        var softBodyHelpers = new Ammo.btSoftBodyHelpers();
        var softBody = softBodyHelpers.CreatePatch(
            (Physics.world as Ammo.btSoftRigidDynamicsWorld).getWorldInfo(),
            //todo calc clothCorner;
            cc00,
            cc01,
            cc10,
            cc11,
            this._planeGeo.width,
            this._planeGeo.height,
            0,
            true,
        );
        var sbconfig = softBody.get_m_cfg();
        sbconfig.set_viterations(10);
        sbconfig.set_piterations(10);
        softBody.setTotalMass(0.9, false);
        // Ammo.castObject(softBody, Ammo.btCollisionObject).getCollisionShape().setMargin(0.05);
        (Physics.world as Ammo.btSoftRigidDynamicsWorld).addSoftBody(softBody, 1, -1);
        this._softBody = softBody;
        // this._planeGeo.indexBuffer.buffer

        // var c00 = new


    }

    public onUpdate(): void {
        //todo update geo vecs
    }
}
