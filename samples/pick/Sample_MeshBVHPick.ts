import { GUIHelp } from '@orillusion/debug/GUIHelp';
import { Stats } from '@orillusion/stats';
import {
    BoxGeometry, ColliderComponent, Color, Engine3D, LitMaterial, MeshBVH, MeshColliderShape, MeshRenderer,
    Object3D, PointerEvent3D, Scene3D, SphereGeometry, TorusGeometry, UnLitMaterial, Vector3, View3D,
} from '@orillusion/core';
import { createExampleScene, createSceneParam } from '@samples/utils/ExampleScene';
import { GUIUtil } from '@samples/utils/GUIUtil';

/**
 * MeshBVH picking demo.
 *
 * A 320k-triangle sphere, a 40k-triangle torus and a few boxes all carry a
 * `MeshColliderShape`. Moving the mouse raycasts against the exact triangles
 * every frame (bound-mode picking) and drops a marker at the hit point,
 * oriented along the interpolated normal. The GUI shows BVH stats and a
 * benchmark button that fires 2 000 random rays through both the BVH and
 * the brute-force scan, reporting ms per ray and whether the results agree.
 */
class Sample_MeshBVHPick {
    private scene: Scene3D;
    private view: View3D;
    private marker: Object3D;
    private normalStick: Object3D;
    private bigSphere: MeshRenderer;
    private readonly stats = {
        triangles: 0, bvhNodes: 0, bvhDepth: 0, buildMs: 0,
        lastHit: '-', lastDistance: 0,
        benchRays: 2000, bvhUsPerRay: 0, bruteUsPerRay: 0, speedup: 0, mismatches: -1,
    };

    async run() {
        const engine = await Engine3D.init({
            setting: { pick: { enable: true, mode: 'bound' }, shadow: { enable: true, shadowBound: 80 } },
        });
        const param = createSceneParam();
        param.camera.distance = 60;
        param.camera.pitch = -20;
        const ex = createExampleScene(engine, param);
        this.scene = ex.scene;
        this.view = ex.view;
        this.scene.addComponent(Stats);
        GUIHelp.init();
        GUIUtil.renderDirLight(ex.light, false);

        this.buildScene();
        engine.startRenderView(this.view);
        this.initGUI();

        this.view.pickFire.addEventListener(PointerEvent3D.PICK_MOVE, this.onPickMove, this);
        this.view.pickFire.addEventListener(PointerEvent3D.PICK_CLICK, this.onPickClick, this);
    }

    private addPickable(geometry: any, material: LitMaterial, pos: Vector3, scale = 1, name = ''): MeshRenderer {
        const obj = new Object3D();
        obj.name = name;
        obj.localPosition = pos;
        obj.localScale = new Vector3(scale, scale, scale);
        const mr = obj.addComponent(MeshRenderer);
        mr.geometry = geometry;
        mr.material = material;
        mr.castShadow = true;
        const shape = new MeshColliderShape();
        shape.mesh = geometry;
        obj.addComponent(ColliderComponent).shape = shape;
        this.scene.addChild(obj);
        return mr;
    }

    private buildScene() {
        const mat = (r: number, g: number, b: number) => { const m = new LitMaterial(); m.baseColor = new Color(r, g, b); m.roughness = 0.5; return m; };

        // 400×400 sphere ≈ 320k triangles — brute force would scan every one per mouse move.
        const t0 = performance.now();
        const sphereGeo = new SphereGeometry(10, 400, 400);
        this.bigSphere = this.addPickable(sphereGeo, mat(0.3, 0.6, 0.9), new Vector3(0, 10, 0), 1, 'sphere-320k');
        const bvh = MeshBVH.get(sphereGeo);
        this.stats.buildMs = +(performance.now() - t0).toFixed(1);
        this.stats.triangles = bvh.triCount;
        this.stats.bvhNodes = bvh.nodeCount;
        this.stats.bvhDepth = bvh.depth;

        // Torus with a non-uniform-scale-free but rotated transform; ~40k tris.
        const torus = this.addPickable(new TorusGeometry(6, 2, 128, 160), mat(0.9, 0.6, 0.2), new Vector3(-24, 6, 0), 1, 'torus');
        torus.object3D.rotationX = 60;

        // Scaled boxes: exercises the world-space distance path under non-unit scale.
        const box = new BoxGeometry(1, 1, 1);
        for (let i = 0; i < 4; i++) {
            const mr = this.addPickable(box, mat(0.5, 0.85, 0.4), new Vector3(20 + i * 7, 3, (i % 2) * 6 - 3), 6, 'box-' + i);
            mr.object3D.rotationY = i * 25;
        }

        // Floor (also pickable, so clicks on the ground report a hit too).
        const floor = this.addPickable(new BoxGeometry(200, 1, 200), mat(0.6, 0.6, 0.62), new Vector3(0, -0.5, 0), 1, 'floor');
        floor.castShadow = false;

        // Hit marker: small sphere + stick pointing along the normal.
        this.marker = new Object3D();
        const mm = this.marker.addComponent(MeshRenderer);
        mm.geometry = new SphereGeometry(0.35, 12, 12);
        const um = new UnLitMaterial(); um.baseColor = new Color(1, 0.1, 0.1);
        mm.material = um;
        mm.castShadow = false;
        // Second, yellow sphere placed 1.5 units along the hit normal: the
        // pair reads as a short "normal arrow" without any orientation math.
        this.normalStick = new Object3D();
        const sm = this.normalStick.addComponent(MeshRenderer);
        sm.geometry = new SphereGeometry(0.22, 10, 10);
        const us = new UnLitMaterial(); us.baseColor = new Color(1, 1, 0.2);
        sm.material = us;
        sm.castShadow = false;
        this.marker.transform.enable = false;
        this.normalStick.transform.enable = false;
        this.scene.addChild(this.marker);
        this.scene.addChild(this.normalStick);
    }

    private onPickMove(e: PointerEvent3D) {
        const d = e.data;
        if (!d || !e.target) return;
        this.marker.transform.enable = true;
        this.normalStick.transform.enable = true;
        this.marker.localPosition = d.worldPos;
        const n: Vector3 = d.worldNormal;
        this.normalStick.localPosition = new Vector3(d.worldPos.x + n.x * 1.5, d.worldPos.y + n.y * 1.5, d.worldPos.z + n.z * 1.5);
        this.stats.lastHit = e.target.name || '(unnamed)';
        this.stats.lastDistance = +(d.distance ?? 0).toFixed(2);
    }

    private onPickClick(e: PointerEvent3D) {
        const mr = e.target?.getComponent(MeshRenderer);
        if (mr && mr !== this.bigSphere) (mr.material as LitMaterial).baseColor = new Color(Math.random(), Math.random(), Math.random());
    }

    private benchmark() {
        const bvh = MeshBVH.get(this.bigSphere.geometry);
        const n = this.stats.benchRays;
        // Random rays aimed at the sphere from a shell around it (local space).
        const origins: Vector3[] = [], dirs: Vector3[] = [];
        for (let i = 0; i < n; i++) {
            const o = new Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize().multiplyScalar(30);
            const jitter = new Vector3(Math.random() * 6 - 3, Math.random() * 6 - 3, Math.random() * 6 - 3);
            const d = new Vector3(-o.x + jitter.x, -o.y + jitter.y, -o.z + jitter.z).normalize();
            origins.push(o); dirs.push(d);
        }
        const bvhT: number[] = [], bvhTri: number[] = [];
        let t0 = performance.now();
        for (let i = 0; i < n; i++) { const h = bvh.raycast(origins[i], dirs[i]); bvhT.push(h ? h.t : -1); bvhTri.push(h ? h.triIndex : -1); }
        const bvhMs = performance.now() - t0;
        let mismatches = 0;
        t0 = performance.now();
        for (let i = 0; i < n; i++) {
            const h = bvh.raycastBruteForce(origins[i], dirs[i]);
            const t = h ? h.t : -1;
            if (Math.abs(t - bvhT[i]) > 1e-4) mismatches++;
        }
        const bruteMs = performance.now() - t0;
        this.stats.bvhUsPerRay = +((bvhMs / n) * 1000).toFixed(1);
        this.stats.bruteUsPerRay = +((bruteMs / n) * 1000).toFixed(1);
        this.stats.speedup = +(bruteMs / Math.max(bvhMs, 1e-6)).toFixed(1);
        this.stats.mismatches = mismatches;
        console.log(`[MeshBVH] ${n} rays vs ${bvh.triCount} tris: BVH ${bvhMs.toFixed(1)} ms, brute ${bruteMs.toFixed(1)} ms, mismatches ${mismatches}`);
    }

    private initGUI() {
        const f = GUIHelp.addFolder('MeshBVH');
        f.add(this.stats, 'triangles').listen();
        f.add(this.stats, 'bvhNodes').listen();
        f.add(this.stats, 'bvhDepth').listen();
        f.add(this.stats, 'buildMs').listen();
        f.add(this.stats, 'lastHit').listen();
        f.add(this.stats, 'lastDistance').listen();
        f.open();
        const b = GUIHelp.addFolder('Benchmark (sphere)');
        b.add(this.stats, 'benchRays', 100, 20000, 100);
        b.add({ run: () => this.benchmark() }, 'run');
        b.add(this.stats, 'bvhUsPerRay').listen();
        b.add(this.stats, 'bruteUsPerRay').listen();
        b.add(this.stats, 'speedup').listen();
        b.add(this.stats, 'mismatches').listen();
        b.open();
    }
}

new Sample_MeshBVHPick().run();
