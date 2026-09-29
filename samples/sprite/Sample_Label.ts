import { GUIHelp } from "@orillusion/debug/GUIHelp";
import {
    AtmosphericComponent,
    BitmapTexture2D,
    BoxGeometry,
    BillboardComponent,
    BillboardType,
    CameraUtil,
    Color,
    DirectLight,
    Engine3D,
    HoverCameraController,
    KelvinUtil,
    LitMaterial,
    MeshRenderer,
    Object3D,
    Scene3D,
    SpriteRenderer,
    UIUtil,
    Vector2,
    Vector3,
    View3D,
} from "@orillusion/core";

/**
 * Floating HP-bar labels above 3D cubes. Demonstrates the canonical
 * "3D-scene sprite" pattern: a `SpriteRenderer` in world space, driven
 * by `UIUtil.textToTexture` for dynamic text, attached to a
 * `BillboardComponent` so the label always faces the camera, and
 * optionally marked `distanceInvariantSize` so distant enemies stay
 * readable.
 */
class Sample_Label {
    engine: Engine3D;
    scene: Scene3D;
    view: View3D;
    lightObj: Object3D;

    private labelSlots: Array<{
        sprite: SpriteRenderer;
        billboard: BillboardComponent;
        texture: BitmapTexture2D;
        enemyName: string;
    }> = [];

    private readonly state = {
        hpPercent: 100,
        width: 2.4,
        height: 0.6,
        cornerRadius: 0.1,
        distanceInvariant: true,
        billboard: BillboardType.BillboardY,
    };

    async run() {
        GUIHelp.init();

        this.engine = await Engine3D.init({});

        this.scene = new Scene3D();
        let sky = this.scene.addComponent(AtmosphericComponent);

        let camera = CameraUtil.createCamera3DObject(this.scene);
        camera.perspective(60, this.engine.aspect, 0.1, 5000.0);
        // 10 m is the reference depth for distanceInvariantSize, so the label
        // `size` values below are literal world units at this distance.
        camera.object3D.addComponent(HoverCameraController).setCamera(0, -15, 10);

        this.view = new View3D();
        this.view.scene = this.scene;
        this.view.camera = camera;

        this.engine.startRenderView(this.view);

        await this.initScene();
        sky.relativeTransform = this.lightObj.transform;

        this.initGUI();
    }

    async initScene() {
        /******** light *******/
        {
            this.lightObj = new Object3D();
            this.lightObj.rotationX = 45;
            this.lightObj.rotationY = 110;
            let lc = this.lightObj.addComponent(DirectLight);
            lc.lightColor = KelvinUtil.color_temperature_to_rgb(5355);
            lc.intensity = 3;
            this.scene.addChild(this.lightObj);
        }

        /******** enemies + labels *******/
        const enemies = ['Orc', 'Goblin', 'Troll'];
        const boxGeom = new BoxGeometry(1.5, 1.5, 1.5);
        for (let i = 0; i < enemies.length; i++) {
            const name = enemies[i];
            const pos = new Vector3((i - 1) * 4, 0, 0);

            // Enemy cube (real 3D mesh)
            const enemy = new Object3D();
            const mr = enemy.addComponent(MeshRenderer);
            mr.geometry = boxGeom;
            const mat = new LitMaterial();
            mat.baseColor = new Color(0.5 + 0.2 * i, 0.4, 0.6 - 0.1 * i, 1);
            mr.material = mat;
            enemy.localPosition = pos;
            this.scene.addChild(enemy);

            // Label (world-space sprite floating above enemy)
            const labelObj = new Object3D();
            const sprite = labelObj.addComponent(SpriteRenderer);
            const tex = await UIUtil.textToTexture(
                this._labelText(name, this.state.hpPercent),
                this.engine.context3D,
                { fontSize: 28, color: '#ffffff', strokeColor: '#000000', strokeWidth: 2, padding: 6 },
            );
            sprite.texture = tex;
            sprite.size = new Vector2(this.state.width, this.state.height);
            sprite.pivot = new Vector2(0.5, 0);
            sprite.cornerRadius = this.state.cornerRadius;
            sprite.distanceInvariantSize = this.state.distanceInvariant;

            const bb = labelObj.addComponent(BillboardComponent);
            bb.type = this.state.billboard;

            labelObj.localPosition = new Vector3(pos.x, pos.y + 1.6, pos.z);
            this.scene.addChild(labelObj);

            this.labelSlots.push({ sprite, billboard: bb, texture: tex, enemyName: name });
        }
    }

    private _labelText(name: string, hp: number): string {
        return `${name}   HP ${hp | 0}%`;
    }

    private async _refreshLabels() {
        for (const slot of this.labelSlots) {
            await UIUtil.updateTextTexture(
                slot.texture,
                this._labelText(slot.enemyName, this.state.hpPercent),
                { fontSize: 28, color: '#ffffff', strokeColor: '#000000', strokeWidth: 2, padding: 6 },
            );
        }
    }

    private initGUI() {
        GUIHelp.addFolder('Labels');
        GUIHelp.add(this.state, 'hpPercent', 0, 100, 1).onChange(() => this._refreshLabels());
        GUIHelp.add(this.state, 'width', 0.5, 6, 0.1).onChange((v: number) => {
            for (const slot of this.labelSlots) slot.sprite.size = new Vector2(v, this.state.height);
        });
        GUIHelp.add(this.state, 'height', 0.2, 2, 0.05).onChange((v: number) => {
            for (const slot of this.labelSlots) slot.sprite.size = new Vector2(this.state.width, v);
        });
        GUIHelp.add(this.state, 'cornerRadius', 0, 0.6, 0.01).onChange((v: number) => {
            for (const slot of this.labelSlots) slot.sprite.cornerRadius = v;
        });
        GUIHelp.add(this.state, 'distanceInvariant').onChange((v: boolean) => {
            for (const slot of this.labelSlots) slot.sprite.distanceInvariantSize = v;
        });
        GUIHelp.add(this.state, 'billboard', {
            None: BillboardType.None,
            'Billboard Y': BillboardType.BillboardY,
            'Billboard XYZ': BillboardType.BillboardXYZ,
        }).onChange((v: any) => {
            const t = Number(v) as BillboardType;
            for (const slot of this.labelSlots) slot.billboard.type = t;
        });
        GUIHelp.open();
        GUIHelp.endFolder();
    }
}

new Sample_Label().run();
