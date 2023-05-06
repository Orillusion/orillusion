import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { Vector3, ComponentBase, PointLight, SphereGeometry, LitMaterial, BoundingBox, Object3D, UUID, Quaternion, Time, View3D } from "@orillusion/core";

class PointLightItem {
    public dir: Vector3 = new Vector3();
    public speed: number = 300;
    public mass: number = 10;
}

export class PointLightsScript extends ComponentBase {
    private _points: PointLight[];
    private _pointLightItems: PointLightItem[];
    private _startAnim: boolean = false;

    private static geo: SphereGeometry;
    private static mat: LitMaterial
    private static boundBox: BoundingBox;

    private _geo: SphereGeometry;
    private _mat: LitMaterial;
    private _boundBox: BoundingBox;

    constructor() {
        super();
        PointLightsScript.geo ||= new SphereGeometry(0.5, 6, 6);
        PointLightsScript.mat ||= new LitMaterial();
        PointLightsScript.boundBox ||= new BoundingBox(new Vector3(0, 10, 0), new Vector3(500, 50, 500));

        this._geo = PointLightsScript.geo;
        this._mat = PointLightsScript.mat;
        this._boundBox = PointLightsScript.boundBox;
        this._points = [];
        this._pointLightItems = [];

        this._startAnim = false;

        GUIHelp.addFolder('random pointLight');
        GUIHelp.addButton('append light', () => {
            this.beginAnim();
        });
        GUIHelp.addButton('remove light', () => {
            this.stopAnim();
        });
        GUIHelp.open();
        GUIHelp.endFolder();
    }

    public beginAnim() {
        this._startAnim = true;
        this.transform.enable = true;

        const count = 100;
        for (let i = 0; i < count; i++) {
            this.createLight();
        }

    }

    public stopAnim() {
        this._startAnim = false;
        this.transform.enable = false;

        for (let i = 0; i < this._points.length; i++) {
            const element = this._points[i];
            this.object3D.removeChild(element.object3D);
            element.destroy();
        }
        this._points.length = 0;
    }

    private createLight() {
        let obj = new Object3D();
        let poi = obj.addComponent(PointLight);
        poi.name = UUID();
        poi.transform.x = this._boundBox.center.x + this._boundBox.extents.x * Math.random();
        poi.transform.y = this._boundBox.center.y + this._boundBox.extents.y * Math.random();
        poi.transform.z = this._boundBox.center.z + this._boundBox.extents.z * Math.random();
        poi.range = 30
        poi.r = Math.random() + 0.1;
        poi.g = Math.random() + 0.1;
        poi.b = Math.random() + 0.1;
        poi.intensity = Math.random() * 1.5 + 10;
        poi.range *= Math.random() * 0.5 + 0.5;


        this.object3D.addChild(obj);
        this._points.push(poi);

        let item = new PointLightItem();
        Quaternion.HELP_0.fromEulerAngles(Math.random() * 360, Math.random() * 360, Math.random() * 360);
        item.dir = Quaternion.HELP_0.transformVector(Vector3.FORWARD);
        item.speed = 50 + Math.random() * 150;
        item.mass = 5 + Math.random() * 5;
        this._pointLightItems.push(item);
        return poi;
    }

    onUpdate(): void {
        if (!this._startAnim)
            return;
        if (Time.delta > 30)
            return;
        for (let i = 0; i < this._points.length; i++) {
            const po = this._points[i];
            const pd = this._pointLightItems[i];

            if (po && pd) {
                pd.mass -= Time.delta * 0.001;
                if (pd.mass < 0) {
                    Quaternion.HELP_0.fromEulerAngles(Math.random() * 360, Math.random() * 360, Math.random() * 360);
                    pd.dir = Quaternion.HELP_0.transformVector(Vector3.FORWARD);
                    pd.speed = 50 + Math.random() * 150;
                    pd.mass = 5 + Math.random() * 5;
                }

                if (!this._boundBox.containsPoint(po.transform.localPosition)) {
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
