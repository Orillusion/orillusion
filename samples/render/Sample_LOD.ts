import { GUIHelp } from '@orillusion/debug/GUIHelp';
import { Stats } from '@orillusion/stats';
import {
    BoxGeometry, Color, Engine3D, GeometryBase, LitMaterial, LODGroup, LODMode,
    MeshRenderer, Object3D, PlaneGeometry, Scene3D, SphereGeometry, Vector3, View3D,
} from '@orillusion/core';
import { createExampleScene, createSceneParam } from '@samples/utils/ExampleScene';
import { GUIUtil } from '@samples/utils/GUIUtil';

/**
 * LODGroup demo — a 24×24 field of objects, each with three detail levels:
 *   L0  high-poly sphere   (green)   48×48 segments, 4.6k tris
 *   L1  low-poly sphere    (yellow)   8×8 segments,   128 tris
 *   L2  box impostor       (red)      12 tris
 *   culled beyond the last threshold
 * Colors make the active level visible at a glance. Zoom / orbit the camera
 * and watch the rings change; the GUI shows live counts per level and lets
 * you switch between screen-size and distance metrics, tweak bias /
 * hysteresis, or force a level.
 */
class Sample_LOD {
    private engine: Engine3D;
    private scene: Scene3D;
    private view: View3D;
    private groups: LODGroup[] = [];
    private counts = { L0: 0, L1: 0, L2: 0, culled: 0, triangles: 0 };
    private readonly trisPerLevel = [48 * 48 * 2, 8 * 8 * 2, 12];

    async run() {
        this.engine = await Engine3D.init({
            renderLoop: () => this.loop(),
            setting: { shadow: { enable: true, shadowBound: 200, shadowSize: 2048 } },
        });

        const param = createSceneParam();
        param.camera.distance = 90;
        param.camera.pitch = -35;
        param.camera.far = 2000;
        param.light.castShadow = true;
        const ex = createExampleScene(this.engine, param);
        ex.hoverCtrl.maxDistance = 1500;
        this.scene = ex.scene;
        this.view = ex.view;
        this.scene.addComponent(Stats);

        this.buildFloor();
        this.buildField();

        this.engine.startRenderView(this.view);
        this.initGUI(ex.light);
    }

    private buildFloor() {
        const floor = new Object3D();
        const mr = floor.addComponent(MeshRenderer);
        mr.geometry = new PlaneGeometry(400, 400);
        const mat = new LitMaterial();
        mat.baseColor = new Color(0.55, 0.55, 0.6);
        mat.roughness = 0.9;
        mr.material = mat;
        mr.castShadow = false;
        this.scene.addChild(floor);
    }

    private buildField() {
        // Shared geometries + materials: LOD only toggles visibility, so 576
        // groups cost 3 geometries and 3 materials total.
        const geos: GeometryBase[] = [
            new SphereGeometry(1.5, 48, 48),
            new SphereGeometry(1.5, 8, 8),
            new BoxGeometry(2.4, 2.4, 2.4),
        ];
        const colors = [new Color(0.25, 0.85, 0.35), new Color(0.95, 0.85, 0.2), new Color(0.9, 0.3, 0.25)];
        const mats = colors.map(c => { const m = new LitMaterial(); m.baseColor = c; m.roughness = 0.6; return m; });

        const n = 24, spacing = 6;
        for (let ix = 0; ix < n; ix++) {
            for (let iz = 0; iz < n; iz++) {
                const root = new Object3D();
                root.localPosition = new Vector3((ix - n / 2 + 0.5) * spacing, 1.5, (iz - n / 2 + 0.5) * spacing);
                const lod = root.addComponent(LODGroup);
                for (let l = 0; l < 3; l++) {
                    const obj = new Object3D();
                    const mr = obj.addComponent(MeshRenderer);
                    mr.geometry = geos[l];
                    mr.material = mats[l];
                    mr.castShadow = true;
                    root.addChild(obj);
                    // ScreenSize thresholds: sphere diameter as a fraction of viewport height.
                    lod.addLevel(obj, [0.12, 0.05, 0.015][l]);
                }
                this.scene.addChild(root);
                this.groups.push(lod);
            }
        }
    }

    private loop() {
        const c = this.counts;
        c.L0 = c.L1 = c.L2 = c.culled = c.triangles = 0;
        for (const g of this.groups) {
            const l = g.currentLevel;
            if (l === LODGroup.CULLED) c.culled++;
            else { (l === 0 ? c.L0++ : l === 1 ? c.L1++ : c.L2++); c.triangles += this.trisPerLevel[l]; }
        }
    }

    private initGUI(light: any) {
        GUIHelp.init();
        const f = GUIHelp.addFolder('LOD');
        const state = {
            mode: 'ScreenSize',
            bias: 1,
            hysteresis: 0.1,
            cullBeyondLast: true,
            forceLevel: 'auto',
        };
        // Distance thresholds are only used when the mode is switched.
        const distThresholds = [25, 60, 200];
        const sizeThresholds = [0.12, 0.05, 0.015];

        f.add(state, 'mode', ['ScreenSize', 'Distance']).onChange((v: string) => {
            const mode = v === 'Distance' ? LODMode.Distance : LODMode.ScreenSize;
            const th = mode === LODMode.Distance ? distThresholds : sizeThresholds;
            for (const g of this.groups) {
                g.mode = mode;
                g.setThresholds(th);
            }
        });
        f.add(state, 'bias', 0.25, 4, 0.05).onChange((v: number) => this.groups.forEach(g => g.bias = v));
        f.add(state, 'hysteresis', 0, 0.5, 0.01).onChange((v: number) => this.groups.forEach(g => g.hysteresis = v));
        f.add(state, 'cullBeyondLast').onChange((v: boolean) => this.groups.forEach(g => g.cullBeyondLast = v));
        f.add(state, 'forceLevel', ['auto', '0', '1', '2', 'culled']).onChange((v: string) => {
            const lvl = v === 'auto' ? null : v === 'culled' ? LODGroup.CULLED : Number(v);
            for (const g of this.groups) g.forceLevel = lvl;
        });
        f.open();

        const stats = GUIHelp.addFolder('Live counts');
        stats.add(this.counts, 'L0').listen();
        stats.add(this.counts, 'L1').listen();
        stats.add(this.counts, 'L2').listen();
        stats.add(this.counts, 'culled').listen();
        stats.add(this.counts, 'triangles').listen();
        stats.open();

        GUIUtil.renderDirLight(light, false);
    }
}

new Sample_LOD().run();
