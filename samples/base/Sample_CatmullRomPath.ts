import { GUIHelp } from '@orillusion/debug/GUIHelp';
import { Graphic3D } from '@orillusion/graphic';
import {
    BoxGeometry, CatmullRomCurve3, CatmullRomType, Color, Cylindrical, Engine3D, LitMaterial, MeshRenderer,
    Object3D, Scene3D, SphereGeometry, Spherical, Time, UnLitMaterial, Vector3, View3D,
} from '@orillusion/core';
import { createExampleScene, createSceneParam } from '@samples/utils/ExampleScene';

/**
 * Math additions demo.
 *
 * - `CatmullRomCurve3`: red spheres are the control points, the white line is
 *   the spline through them. Yellow dots are `getSpacedPoints` (equal arc
 *   length) and cyan dots are `getPoints` (equal parameter) — note how the
 *   cyan ones bunch up where control points are close. The box travels with
 *   `getPointAt` (constant speed) and faces along `getTangentAt`.
 * - `Spherical` / `Cylindrical`: the green satellite orbits on a sphere, the
 *   purple one climbs a helix, both driven purely by coordinate conversion.
 */
class Sample_CatmullRomPath {
    private scene: Scene3D;
    private graphic: Graphic3D;
    private curve: CatmullRomCurve3;
    private follower: Object3D;
    private sat: Object3D;
    private heli: Object3D;
    private spacedDots: Object3D[] = [];
    private paramDots: Object3D[] = [];
    private readonly state = { curveType: 'centripetal' as CatmullRomType, tension: 0.5, closed: true, speed: 0.08, constantSpeed: true, length: 0 };
    private u = 0;
    private spherical = new Spherical(9, Math.PI / 3, 0);
    private cylindrical = new Cylindrical(6, 0, 0);

    async run() {
        const engine = await Engine3D.init({ renderLoop: () => this.loop() });
        const param = createSceneParam();
        param.camera.distance = 85;
        param.camera.pitch = -35;
        const ex = createExampleScene(engine, param);
        this.scene = ex.scene;
        this.graphic = new Graphic3D();
        this.scene.addChild(this.graphic);

        const control = [
            new Vector3(-30, 2, -10), new Vector3(-24, 10, -6), new Vector3(-20, 3, 0),      // three close together
            new Vector3(5, 14, 14), new Vector3(28, 4, 6), new Vector3(24, 8, -18), new Vector3(-4, 2, -24),
        ];
        this.curve = new CatmullRomCurve3(control, this.state.closed, this.state.curveType, this.state.tension);

        const red = new UnLitMaterial(); red.baseColor = new Color(1, 0.15, 0.1);
        const yellow = new UnLitMaterial(); yellow.baseColor = new Color(1, 0.9, 0.2);
        const cyan = new UnLitMaterial(); cyan.baseColor = new Color(0.2, 0.9, 1);
        control.forEach(p => this.dot(new SphereGeometry(0.9, 16, 16), red, p));
        const small = new SphereGeometry(0.35, 8, 8);
        for (let i = 0; i <= 40; i++) {
            this.spacedDots.push(this.dot(small, yellow, new Vector3()));
            this.paramDots.push(this.dot(small, cyan, new Vector3()));
        }

        const mat = new LitMaterial(); mat.baseColor = new Color(0.9, 0.5, 0.1); mat.roughness = 0.5;
        this.follower = new Object3D();
        const mr = this.follower.addComponent(MeshRenderer);
        mr.geometry = new BoxGeometry(1.6, 1.6, 4); mr.material = mat;
        this.scene.addChild(this.follower);

        const green = new LitMaterial(); green.baseColor = new Color(0.2, 0.8, 0.3);
        const purple = new LitMaterial(); purple.baseColor = new Color(0.6, 0.3, 0.9);
        this.sat = this.dot(new SphereGeometry(1, 24, 24), green, new Vector3());
        this.heli = this.dot(new SphereGeometry(1, 24, 24), purple, new Vector3());

        const floor = new Object3D();
        const fm = floor.addComponent(MeshRenderer);
        fm.geometry = new BoxGeometry(120, 1, 120);
        const fmat = new LitMaterial(); fmat.baseColor = new Color(0.45, 0.45, 0.5); fmat.roughness = 0.9;
        fm.material = fmat;
        floor.y = -1;
        this.scene.addChild(floor);

        engine.startRenderView(ex.view);
        this.rebuild();
        this.initGUI();
    }

    private dot(geo: any, mat: any, p: Vector3): Object3D {
        const o = new Object3D();
        const mr = o.addComponent(MeshRenderer);
        mr.geometry = geo; mr.material = mat; mr.castShadow = false;
        o.localPosition = p;
        this.scene.addChild(o);
        return o;
    }

    private rebuild() {
        const c = this.curve;
        c.closed = this.state.closed; c.curveType = this.state.curveType; c.tension = this.state.tension;
        this.graphic.Clear('curve');
        this.graphic.drawLines('curve', c.getPoints(300), new Color(1, 1, 1));
        const spaced = c.getSpacedPoints(40), param = c.getPoints(40);
        for (let i = 0; i <= 40; i++) {
            this.spacedDots[i].localPosition = new Vector3(spaced[i].x, spaced[i].y + 0.9, spaced[i].z);
            this.paramDots[i].localPosition = new Vector3(param[i].x, param[i].y - 0.9, param[i].z);
        }
        this.state.length = +c.getLength().toFixed(2);
    }

    private loop() {
        if (!this.curve) return;
        const dt = Time.delta * 0.001;
        this.u = (this.u + dt * this.state.speed) % 1;
        const pos = this.state.constantSpeed ? this.curve.getPointAt(this.u) : this.curve.getPoint(this.u);
        const tan = this.state.constantSpeed ? this.curve.getTangentAt(this.u) : this.curve.getTangent(this.u);
        this.follower.transform.lookAt(pos, new Vector3(pos.x + tan.x, pos.y + tan.y, pos.z + tan.z));

        this.spherical.theta += dt * 0.9;
        this.spherical.phi = Math.PI / 2 + Math.sin(Time.time * 0.0007) * 0.9;
        const s = this.spherical.toVector3();
        this.sat.localPosition = new Vector3(s.x, s.y + 14, s.z);

        this.cylindrical.theta += dt * 1.6;
        this.cylindrical.y = 14 + Math.sin(this.cylindrical.theta * 0.25) * 9;
        this.heli.localPosition = this.cylindrical.toVector3();
    }

    private initGUI() {
        GUIHelp.init();
        const f = GUIHelp.addFolder('CatmullRomCurve3');
        f.add(this.state, 'curveType', ['centripetal', 'chordal', 'catmullrom']).onChange(() => this.rebuild());
        f.add(this.state, 'tension', 0, 1, 0.01).onChange(() => this.rebuild());
        f.add(this.state, 'closed').onChange(() => this.rebuild());
        f.add(this.state, 'constantSpeed');
        f.add(this.state, 'speed', 0, 0.4, 0.005);
        f.add(this.state, 'length').listen();
        f.open();
    }
}

new Sample_CatmullRomPath().run();
