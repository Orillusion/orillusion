import { GeometryBase, Material, MeshRenderer, Object3D } from "@orillusion/core";
import { Bullet } from "./Bullet";

class Pool {
    useBullets: Bullet[] = [];
    unUseBullets: Bullet[] = [];
    skin: Object3D;
}

export class BulletPool {


    private skinMap: Map<string, Pool>
    public init() {
        this.skinMap = new Map();
    }

    public createBulletSkin(id: string, geo: GeometryBase, mat: Material) {
        let obj = new Object3D();
        let mr = obj.addComponent(MeshRenderer);
        mr.geometry = geo;
        mr.material = mat;

        if (!this.skinMap.has(id)) {
            let pool = new Pool();
            pool.skin = obj;
            this.skinMap.set(id, pool);
        }
    }

    public getBulletSkin(skin: string): Object3D {
        return this.skinMap.get(skin).skin;
    }

    public getBullet(skin: string): Bullet {
        let pool = this.skinMap.get(skin);
        let bullet: Bullet;
        if (pool.unUseBullets.length > 0) {
            bullet = pool.unUseBullets.pop();
        } else {
            let obj = pool.skin.clone();
            bullet = obj.addComponent(Bullet, this);
            bullet.skinID = skin;
        }
        pool.useBullets.push(bullet);
        return bullet;
    }

    public recovery(bullet: Bullet) {
        let pool = this.skinMap.get(bullet.skinID);
        let i = pool.useBullets.indexOf(bullet);
        if (i != -1) {
            pool.useBullets.splice(i, 1);
            pool.unUseBullets.push(bullet);
            // console.log("recovery bullet");
        } else {
            console.error("not bullet in pool");
        }
    }

    public dispose() {

    };
}