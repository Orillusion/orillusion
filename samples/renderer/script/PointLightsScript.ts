import { Vector3, ComponentBase, PointLight, SphereGeometry, LitMaterial, BoundingBox, Object3D, UUID, Quaternion, Time } from "../@orillusion/core";

class PD {
    public dir: Vector3 = new Vector3();
    public speed: number = 300;
    public mass: number = 10;
}

export class PointLightsScript extends ComponentBase {
    private points: PointLight[];
    private pds: PD[];
    private startAnim: boolean = false;

    private static geo: SphereGeometry;
    private static mat: LitMaterial
    private static boundBox: BoundingBox;

    private geo: SphereGeometry;
    private mat: LitMaterial;
    private boundBox: BoundingBox;

    constructor() {
        super();
        PointLightsScript.geo ||= new SphereGeometry(0.5, 6, 6);
        PointLightsScript.mat ||= new LitMaterial();
        PointLightsScript.boundBox ||= new BoundingBox(new Vector3(0, 10, 0), new Vector3(500, 50, 500));

        this.geo = PointLightsScript.geo;
        this.mat = PointLightsScript.mat;
        this.boundBox = PointLightsScript.boundBox;
        this.points = [];
        this.pds = [];

        this.startAnim = false;
    }

    public beginAnim() {
        this.startAnim = true;
        this.transform.enable = true;

        let count = 100;
        for (let i = 0; i < count; i++) {
            const light = this.createLight();
        }

    }

    public stopAnim() {
        this.startAnim = false;
        this.transform.enable = false;

        for (let i = 0; i < this.points.length; i++) {
            const element = this.points[i];
            this.object3D.removeChild(element.object3D);
            element.destroy();
        }
        this.points.length = 0;
    }

    private createLight() {
        let obj = new Object3D();
        let poi = obj.addComponent(PointLight);
        poi.name = UUID();
        poi.transform.x = this.boundBox.center.x + this.boundBox.extents.x * Math.random();
        poi.transform.y = this.boundBox.center.y + this.boundBox.extents.y * Math.random();
        poi.transform.z = this.boundBox.center.z + this.boundBox.extents.z * Math.random();
        // poi.radius = 1 * Math.random() + 1 ;
        poi.range = 30
        // poi.at = 2 ;
        poi.r = Math.random() + 0.1;
        poi.g = Math.random() + 0.1;
        poi.b = Math.random() + 0.1;
        poi.intensity = Math.random() * 1.5 + 10;
        poi.range *= Math.random() * 0.5 + 0.5;

        // let mr = obj.addComponent(MeshRenderer);
        // mr.geometry = this.geo;
        // mr.material = this.mat;

        this.object3D.addChild(obj);
        this.points.push(poi);

        let pd = new PD();
        Quaternion.HELP_0.fromEulerAngles(Math.random() * 360, Math.random() * 360, Math.random() * 360);
        pd.dir = Quaternion.HELP_0.transformVector(Vector3.FORWARD);
        pd.speed = 50 + Math.random() * 150;
        pd.mass = 5 + Math.random() * 5;
        this.pds.push(pd);
        return poi;
    }

    onUpdate(): void {
        if (!this.startAnim) return;
        if (Time.delta > 30) return;
        for (let i = 0; i < this.points.length; i++) {
            const po = this.points[i];
            const pd = this.pds[i];

            if (po && pd) {
                pd.mass -= Time.delta * 0.001;
                if (pd.mass < 0) {
                    Quaternion.HELP_0.fromEulerAngles(Math.random() * 360, Math.random() * 360, Math.random() * 360);
                    pd.dir = Quaternion.HELP_0.transformVector(Vector3.FORWARD);
                    pd.speed = 50 + Math.random() * 150;
                    pd.mass = 5 + Math.random() * 5;
                }

                if (!this.boundBox.containsPoint(po.transform.localPosition)) {
                    pd.dir = pd.dir.negate();
                }

                Vector3.HELP_0.copyFrom(pd.dir);
                Vector3.HELP_0.scaleBy(Time.delta * 0.001 * pd.speed * 0.1);

                po.transform.x += Vector3.HELP_0.x;
                po.transform.y += Vector3.HELP_0.y;
                po.transform.z += Vector3.HELP_0.z;
            }
        }
    }
}
