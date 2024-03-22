import { Color, ComponentBase, GeometryBase, LitMaterial, Material, MeshRenderer, Object3D, SphereGeometry, UnLitMaterial, Vector2, Vector3 } from "@orillusion/core";
import { RigidBody3D } from "../helps/components/RigidBody3D";
import { BulletPool } from "./BulletPool";
import { PhysicTransformUtils } from "../helps/PhysicTransformUtils";
import Ammo from "@orillusion/ammo/ammo";

export class Bullet extends ComponentBase {
    public bulletPool: BulletPool;
    public body: RigidBody3D;
    public radius: number = 0.1;
    public bulletSkin: Object3D;
    public skinID: string;

    public init(param?: BulletPool): void {
        this.bulletPool = param;
        this.object3D.name = "bullet";
    }

    public cast(radius: number, form: Vector3, to: Vector3, localForce: Vector3) {
        this.radius = radius;
        this.body = this.object3D.addComponent(RigidBody3D);
        PhysicTransformUtils.applySphereRigidBody(
            this.body,
            form,
            this.radius,
            new Vector3(0, 0, 0),
            1,
            0.6,
            0.1,
            0.025
        );

        this.transform.x = form.x;
        this.transform.y = form.y;
        this.transform.z = form.z;

        this.transform.forward = localForce;

        this.transform.scaleX = this.radius;
        this.transform.scaleY = this.radius;
        this.transform.scaleZ = this.radius;
        (this.body.btBody as Ammo.btRigidBody).applyCentralLocalForce(PhysicTransformUtils.getBtVector3(localForce));
    }

    public recovery() {
        this.object3D.parent.object3D.removeChild(this.object3D);
        // this.object3D.removeComponent(RigidBody3D);
        // this.bulletPool.recovery(this);
        // this.body.destroy();
        // this.body = null;
    }
}
