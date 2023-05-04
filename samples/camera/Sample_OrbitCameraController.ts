import { Object3D, Scene3D, Engine3D, AtmosphericComponent, Vector3, Camera3D, OrbitController, View3D, PointerEvent3D, Interpolator, InterpolatorEnum, MeshRenderer, BoxGeometry, LitMaterial, Color, ColliderComponent, DirectLight, KelvinUtil } from "@orillusion/core";

export class Sample_OrbitCameraController {
    lightObj: Object3D;
    scene: Scene3D;
    camera: Object3D
    constructor() { }

    async run() {
        Engine3D.setting.pick.enable = true;
        Engine3D.setting.pick.mode = `pixel`;

        await Engine3D.init({
            renderLoop: () => this.loop(),
        });

        this.scene = new Scene3D();
        this.scene.addComponent(AtmosphericComponent);
        this.camera = new Object3D()
        this.camera.localPosition = new Vector3(0, 20, 50)
        let mainCamera = this.camera.addComponent(Camera3D)
        this.scene.addChild(this.camera)

        mainCamera.perspective(60, window.innerWidth / window.innerHeight, 1, 2000.0);
        let orbit = this.camera.addComponent(OrbitController)
        orbit.maxDistance = 500
        orbit.autoRotateSpeed = 0.5
        await this.initScene(this.scene);

        let view = new View3D();
        view.scene = this.scene;
        view.camera = mainCamera;

        Engine3D.startRenderView(view);

        // target & zoom camera on double click
        let target: Object3D, time: number = 0
        Engine3D.views[0].pickFire.addEventListener(PointerEvent3D.PICK_CLICK, (e: PointerEvent3D) => {
            if (target && time && e.target === target && (Date.now() - time < 200)) {
                console.log('double click', e.target, e.data)
                let dir = this.camera.localPosition.subtract(e.data.pickInfo.worldPos)
                Interpolator.to(orbit.target, {
                    x: e.data.pickInfo.worldPos.x,
                    y: e.data.pickInfo.worldPos.y,
                    z: e.data.pickInfo.worldPos.z,
                }, 300, InterpolatorEnum.AccelerateDecelerateInterpolator);
                // anime({
                //     targets: orbit.target,
                //     x: e.data.pickInfo.worldPos.x,
                //     y: e.data.pickInfo.worldPos.y,
                //     z: e.data.pickInfo.worldPos.z,
                //     easing: 'easeInOutQuad',
                //     duration: 300,
                // })
                // anime({
                //     targets: this.camera,
                //     x: e.data.pickInfo.worldPos.x + dir.x * 0.5,
                //     y: e.data.pickInfo.worldPos.y + dir.y * 0.5,
                //     z: e.data.pickInfo.worldPos.z + dir.z * 0.5,
                //     easing: 'easeInOutQuad',
                //     duration: 300,
                // })

                Interpolator.to(this.camera, {
                    x: e.data.pickInfo.worldPos.x + dir.x * 0.5,
                    y: e.data.pickInfo.worldPos.y + dir.y * 0.5,
                    z: e.data.pickInfo.worldPos.z + dir.z * 0.5,
                }, 300, InterpolatorEnum.AccelerateDecelerateInterpolator);
            }
            else {
                target = e.target
                time = Date.now()
            }
        }, this);

        setTimeout(() => {
        })
    }

    /**
     * @param scene
     * @returns
     */
    async initScene(scene: Scene3D) {
        {
            let box = new Object3D()
            let mr = box.addComponent(MeshRenderer)
            mr.geometry = new BoxGeometry(10, 10, 10)
            let mat = new LitMaterial()
            mat.baseColor = new Color(1, 1, 0)
            mr.material = mat

            box.addComponent(ColliderComponent)
            this.scene.addChild(box)
            box.y = 5
        }
        {
            let wall = new Object3D()
            let mr = wall.addComponent(MeshRenderer)
            mr.geometry = new BoxGeometry()
            let mat = new LitMaterial()
            mat.baseColor = new Color(1, 0, 0)
            mr.material = mat

            wall.addComponent(ColliderComponent)
            this.scene.addChild(wall)
            wall.localScale = new Vector3(40, 30, 1)
            wall.y = 5
            wall.z = -10
        }

        {
            let mat = new LitMaterial();
            mat.baseMap = Engine3D.res.grayTexture;
            mat.roughness = 0.85;
            mat.metallic = 0.1;

            let floor = new Object3D();
            let mr = floor.addComponent(MeshRenderer);
            mr.geometry = new BoxGeometry(3000, 1, 3000);
            mr.material = mat;
            this.scene.addChild(floor);
        }

        /******** light *******/
        {
            this.lightObj = new Object3D();
            this.lightObj.x = 0;
            this.lightObj.y = 30;
            this.lightObj.z = -40;
            this.lightObj.rotationX = 45;
            this.lightObj.rotationY = 0;
            this.lightObj.rotationZ = 0;
            let lc = this.lightObj.addComponent(DirectLight);
            lc.lightColor = KelvinUtil.color_temperature_to_rgb(5355);
            // lc.castShadow = true;
            lc.intensity = 10.65;
            scene.addChild(this.lightObj);
        }

        return true;
    }
    loop() { }
}