import { GUIHelp } from '@orillusion/debug/GUIHelp';
import { Stats } from '@orillusion/stats';
import {
    AnimatorComponent, Color, ComponentBase, Engine3D, MeshDeformer, MeshRenderer, Object3D, Object3DUtil, Raycaster,
    RaycastHit, Scene3D, SphereGeometry, UnLitMaterial, Vector3, View3D,
} from '@orillusion/core';
import { createExampleScene, createSceneParam } from '@samples/utils/ExampleScene';

/**
 * Picking skinned and morph-target meshes.
 *
 * Two animated soldiers (glTF skin) and a lion with blend shapes. Every
 * frame a `Raycaster` is cast through the mouse position against the
 * characters: the GPU deforms these meshes in the vertex shader, so the
 * raycaster replays that deformation on the CPU (`MeshDeformer`) and the
 * red marker sticks to the surface as drawn, while it animates under a
 * still mouse. The blue marker is the same ray against the bind pose
 * (`deformation = 'bindPose'`), which is what picking would report without
 * CPU deformation. The yellow dot points along the hit normal.
 */
class Sample_SkinnedMeshPick {
    private scene: Scene3D;
    private view: View3D;
    private characters: Object3D;
    private soldiers: Object3D[] = [];
    private animators: AnimatorComponent[] = [];
    private lion: Object3D;
    private lionAnimator: AnimatorComponent;
    private hitMarker: Object3D;
    private normalMarker: Object3D;
    private bindMarker: Object3D;
    private readonly raycaster = new Raycaster();
    private readonly bindRaycaster = new Raycaster();
    private readonly stats = {
        animate: true, clip: 'Run', showBindPose: true,
        lastHit: '-', faceIndex: -1, uv: '-', distance: 0, pickMs: 0, deformedVertices: 0, bindPoseOffset: '-',
    };
    private readonly morph: { [key: string]: number } = {};

    async run() {
        const engine = await Engine3D.init({ setting: { shadow: { enable: true, shadowBound: 200 } } });
        const param = createSceneParam();
        param.camera.distance = 150;
        param.camera.pitch = -12;
        const ex = createExampleScene(engine, param);
        this.scene = ex.scene;
        this.view = ex.view;
        ex.hoverCtrl.setCamera(0, -12, 150, new Vector3(20, 18, 0));
        this.scene.addComponent(Stats);
        GUIHelp.init();

        this.scene.addChild(Object3DUtil.GetSingleCube(400, 1, 400, 0.45, 0.45, 0.48));
        this.characters = new Object3D();
        this.scene.addChild(this.characters);
        await this.loadSoldiers(engine);
        await this.loadLion(engine);
        this.createMarkers();
        this.bindRaycaster.deformation = 'bindPose';

        engine.startRenderView(this.view);
        this.initGUI();
        // Re-pick every frame: the characters move under a still mouse.
        this.scene.addComponent(PickEveryFrame).sample = this;
    }

    private async loadSoldiers(engine: Engine3D) {
        const soldier = await engine.res.loadGltf('gltfs/glb/Soldier.glb');
        soldier.scaleX = soldier.scaleY = soldier.scaleZ = 20;
        soldier.rotationY = 200;
        soldier.x = -20;
        this.characters.addChild(soldier);
        const walker = soldier.clone();
        walker.x = 15;
        walker.rotationY = 160;
        this.characters.addChild(walker);
        this.soldiers = [soldier, walker];
        this.animators = this.soldiers.map(s => s.getComponentsInChild(AnimatorComponent)[0]);
        this.animators[0].playAnim('Run');
        this.animators[1].playAnim('Walk');
    }

    private async loadLion(engine: Engine3D) {
        const lion = await engine.res.loadGltf('gltfs/glb/lion.glb');
        lion.scaleX = lion.scaleY = lion.scaleZ = 0.4;
        this.characters.addChild(lion);
        this.lion = lion;
        // Stand it on the ground at x = 55 using its bounds.
        let minY = Infinity, cx = 0, n = 0;
        for (const r of lion.getComponentsInChild(MeshRenderer)) {
            const b = r.geometry.bounds, m = r.transform.worldMatrix;
            for (const p of [b.min, b.max]) {
                const w = m.transformPoint(p.clone());
                minY = Math.min(minY, w.y); cx += w.x; n++;
            }
        }
        lion.y -= minY;
        lion.x += 55 - cx / n;
        this.lionAnimator = lion.addComponent(AnimatorComponent);
        for (const key in this.lionAnimator.cloneMorphRenderers()) this.morph[key] = 0;
    }

    private createMarkers() {
        const dot = (r: number, color: Color) => {
            const o = new Object3D();
            const mr = o.addComponent(MeshRenderer);
            mr.geometry = new SphereGeometry(r, 16, 16);
            const m = new UnLitMaterial();
            m.baseColor = color;
            mr.material = m;
            mr.castShadow = false;
            o.transform.enable = false;
            this.scene.addChild(o);
            return o;
        };
        this.hitMarker = dot(1.1, new Color(1, 0.15, 0.1));
        this.normalMarker = dot(0.6, new Color(1, 0.95, 0.2));
        this.bindMarker = dot(0.9, new Color(0.2, 0.5, 1));
    }

    /** Called every frame by PickEveryFrame. */
    public pick() {
        const input = this.view.engine3D.inputSystem;
        const camera = this.view.camera;
        this.raycaster.setFromCamera(camera, input.mouseX, input.mouseY);
        const t0 = performance.now();
        const hit = this.raycaster.intersectFirst(this.characters);
        this.stats.pickMs = +(performance.now() - t0).toFixed(2);
        this.place(hit);

        let bind: RaycastHit = null;
        if (this.stats.showBindPose) {
            this.bindRaycaster.setFromCamera(camera, input.mouseX, input.mouseY);
            bind = this.bindRaycaster.intersectFirst(this.characters);
        }
        this.bindMarker.transform.enable = !!bind;
        if (bind) this.bindMarker.localPosition = bind.point;
        this.stats.bindPoseOffset = hit && bind ? Vector3.distance(hit.point, bind.point).toFixed(2) : '-';
    }

    private place(hit: RaycastHit) {
        this.hitMarker.transform.enable = this.normalMarker.transform.enable = !!hit;
        if (!hit) {
            this.stats.lastHit = '-';
            return;
        }
        this.hitMarker.localPosition = hit.point;
        const n = hit.normal;
        this.normalMarker.localPosition = new Vector3(hit.point.x + n.x * 3, hit.point.y + n.y * 3, hit.point.z + n.z * 3);
        this.stats.lastHit = hit.object3D.name || '(unnamed)';
        this.stats.faceIndex = hit.faceIndex;
        this.stats.uv = hit.uv ? `${hit.uv.x.toFixed(3)}, ${hit.uv.y.toFixed(3)}` : '-';
        this.stats.distance = +hit.distance.toFixed(2);
        const deformed = MeshDeformer.deform(hit.renderer);
        this.stats.deformedVertices = deformed ? deformed.geometry.getAttribute('position').data.length / 3 : 0;
    }

    private initGUI() {
        const a = GUIHelp.addFolder('Animation');
        a.add(this.stats, 'animate').onChange((v: boolean) => this.animators.forEach(an => an.timeScale = v ? 1 : 0));
        a.add(this.stats, 'clip', ['Idle', 'Walk', 'Run', 'TPose']).onChange((v: string) => this.animators[0].playAnim(v));
        a.open();
        const m = GUIHelp.addFolder('Lion blend shapes');
        for (const key in this.morph) {
            m.add(this.morph, key, 0, 1, 0.01).onChange((v: number) => {
                this.lionAnimator.updateBlendShape(['blendShape', 'blendShape', key], 'blendShape.blendShape.' + key, v);
            });
        }
        m.open();
        const p = GUIHelp.addFolder('Pick (mouse)');
        p.add(this.raycaster, 'deformation', ['cpu', 'bindPose', 'skip']);
        p.add(this.stats, 'showBindPose');
        p.add(this.stats, 'lastHit').listen();
        p.add(this.stats, 'faceIndex').listen();
        p.add(this.stats, 'uv').listen();
        p.add(this.stats, 'distance').listen();
        p.add(this.stats, 'bindPoseOffset').listen();
        p.add(this.stats, 'deformedVertices').listen();
        p.add(this.stats, 'pickMs').listen();
        p.open();
    }
}

class PickEveryFrame extends ComponentBase {
    public sample: Sample_SkinnedMeshPick;
    onUpdate() {
        this.sample?.pick();
    }
}

new Sample_SkinnedMeshPick().run();
