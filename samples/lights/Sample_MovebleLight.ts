import { BoxGeometry, Camera3D, ComponentBase, Engine3D, LitMaterial, MeshRenderer, Object3D, Scene3D, View3D, Color, Object3DUtil, PointLight, PointerEvent3D, Vector3, ColliderComponent, BlendMode, UnLitMaterial, KelvinUtil } from "@orillusion/core";
import { Stats } from "@orillusion/stats";
import dat from "dat.gui";

class Sample_MovebleLight {
    private light: PointLight;
    async run() {
        //set shadow and pick mode
        Engine3D.setting.shadow.pointShadowBias = 0.0001;
        Engine3D.setting.shadow.type = "HARD";
        Engine3D.setting.pick.mode = "pixel";

        //Engine init
        await Engine3D.init();

        //create scene and add FPS
        let scene = new Scene3D();
        scene.addComponent(Stats);

        //create camera
        let cameraObj = new Object3D();
        let camera = cameraObj.addComponent(Camera3D);
        camera.perspective(60, Engine3D.aspect, 1, 5000);
        camera.lookAt(new Vector3(0, 0, 30), new Vector3(0, 0, 0));
        scene.addChild(cameraObj);

        //create PointLight
        let lightObj = new Object3D();
        this.light = lightObj.addComponent(PointLight);
        this.light.intensity = 4;
        this.light.range = 20;
        this.light.radius = 0.1;
        lightObj.z = 5;
        this.light.lightColor = KelvinUtil.color_temperature_to_rgb(2345);
        this.light.castShadow = true;
        scene.addChild(lightObj);

        //add debug GUI
        let lightColor = {
            color: [255, 255, 255, 255],
        };
        const gui = new dat.GUI();
        let light = gui.addFolder("light");
        light.add(this.light, "intensity", 5, 30, 1);
        light.add(this.light, "range", 1, 30, 1);
        light.add(this.light, "radius", 0.01, 2, 0.01);
        light.addColor(lightColor, "color").onChange((v) => {
            this.light.lightColor = new Color(v[0] / 255, v[1] / 255, v[2] / 255);
        });
        light.add({ tips: "Move Your Mouse" }, "tips");
        light.open();

        //add background
        let floor = Object3DUtil.GetSingleCube(100, 100, 1, 1, 1, 1);
        floor.z = -3;
        scene.addChild(floor);

        //create 100 boxes
        let boxObj = new Object3D();
        let boxMr = boxObj.addComponent(MeshRenderer);
        let boxMat = new LitMaterial();
        boxMr.geometry = new BoxGeometry(2, 2, 2);
        boxMr.material = boxMat;
        for (let i = 0; i < 10; i++) {
            for (let j = 0; j < 10; j++) {
                let obj = boxObj.clone();
                obj.addComponent(RotateScript);
                obj.x = i * 4 - 18;
                obj.y = j * 4 - 18;
                scene.addChild(obj);
            }
        }

        //create pick helper
        let helper = new Object3D();
        helper.z = 5;
        let mr = helper.addComponent(MeshRenderer);
        mr.geometry = new BoxGeometry(100, 100, 1);
        let mat = new UnLitMaterial();
        mr.material = mat;

        //set helper invisible
        mat.baseColor = new Color(1, 1, 1, 0);
        mat.blendMode = BlendMode.ALPHA;

        helper.addComponent(ColliderComponent);

        //add point-move event listener
        helper.addEventListener(PointerEvent3D.PICK_MOVE, this.onMove, this);
        scene.addChild(helper);

        //start render
        let view = new View3D();
        view.scene = scene;
        view.camera = camera;
        Engine3D.startRenderView(view);
    }
    private onMove(e: PointerEvent3D) {
        //set pick position as light position
        this.light.transform.x = e.data.worldPos.x;
        this.light.transform.y = e.data.worldPos.y;
    }
}
//rotate component
class RotateScript extends ComponentBase {
    onUpdate() {
        this.object3D.rotationY += 0.5;
        this.object3D.rotationX += 1;
        this.object3D.rotationZ += 1.5;
    }
}
new Sample_MovebleLight().run();
