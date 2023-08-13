import {
    AtmosphericComponent, BoxGeometry, CameraUtil, Color, Engine3D, HoverCameraController, LitMaterial, MeshRenderer, Object3D, PlaneGeometry, PointLight, Scene3D, SphereGeometry, Vector3, View3D, webGPUContext, Camera3D, Time, DEGREES_TO_RADIANS
} from '@orillusion/core';

import {
    ParticleSystem, ParticleMaterial, ParticleStandardSimulator, EmitLocation, ParticleEmitterModule, ParticleGravityModifierModule, ParticleOverLifeColorModule, ShapeType, SimulatorSpace
} from '@orillusion/particle';

export class Sample_CandleFlame {
    lightObj: Object3D;
    async run() {
        Engine3D.setting.shadow.enable = true;
        Engine3D.setting.shadow.pointShadowBias = 0.001;
        Engine3D.setting.shadow.autoUpdate = true;
        Engine3D.setting.shadow.updateFrameRate = 1;
        await Engine3D.init();

        let scene = new Scene3D();
        let sky = scene.addComponent(AtmosphericComponent);
        let camera = CameraUtil.createCamera3DObject(scene);
        camera.perspective(60, webGPUContext.aspect, 0.1, 5000.0);

        let ctrl = camera.object3D.addComponent(HoverCameraController);
        ctrl.setCamera(45, -20, 65, new Vector3(0, 15, 51));
        // ctrl.maxDistance = 1000;

        await this.initScene(scene);
        sky.relativeTransform = this.lightObj.transform;
        let view = new View3D();
        view.scene = scene;
        view.camera = camera;

        Engine3D.startRenderView(view);
    }

    async addParticleTo(scene: Scene3D) {
        let obj = new Object3D();
        obj.x = 0;
        obj.y = 15;
        obj.z = 51;
        scene.addChild(obj);

        let particleSystem = obj.addComponent(ParticleSystem);

        {
            let lightObj = this.lightObj = new Object3D();
            let pl = lightObj.addComponent(PointLight);
            pl.range = 56;
            pl.radius = 1;
            pl.intensity = 15;
            pl.castShadow = true;
            pl.realTimeShadow = true;
            pl.lightColor = new Color(67 / 255, 195 / 255, 232 / 255);
            pl.debug();
            obj.addChild(lightObj);
        }

        let material = new ParticleMaterial();
        material.baseMap = await Engine3D.res.loadTexture('particle/fx_a_glow_003.png');

        particleSystem.geometry = new PlaneGeometry(5, 5, 1, 1, Vector3.Z_AXIS);
        particleSystem.material = material;

        let simulator = particleSystem.useSimulator(ParticleStandardSimulator);
        simulator.simulatorSpace = SimulatorSpace.Local;

        let emitter = simulator.addModule(ParticleEmitterModule);
        emitter.maxParticle = 1 * 10000;
        emitter.duration = 10;
        emitter.emissionRate = 100;
        emitter.startLifecycle.setScalar(1);
        emitter.shapeType = ShapeType.Circle;
        emitter.radius = 0.5;
        emitter.emitLocation = EmitLocation.Shell;

        simulator.addModule(ParticleGravityModifierModule).gravity = new Vector3(0, 0.3, 0);

        let overLifeColorModule = simulator.addModule(ParticleOverLifeColorModule);
        overLifeColorModule.startColor = new Color(1, 0.3, 0);
        overLifeColorModule.endColor = new Color(0, 0.6, 1);
        overLifeColorModule.startAlpha = 1.0;
        overLifeColorModule.endAlpha = 0.0;

        particleSystem.play();
    }

    async initScene(scene: Scene3D) {
        await this.addParticleTo(scene);

        let chair = await Engine3D.res.loadGltf('PBR/SheenChair/SheenChair.gltf');
        chair.scaleX = chair.scaleY = chair.scaleZ = 60;
        chair.transform.y = 0;
        scene.addChild(chair);

        let Duck = await Engine3D.res.loadGltf('PBR/Duck/Duck.gltf');
        Duck.scaleX = Duck.scaleY = Duck.scaleZ = 0.15;
        Duck.transform.y = 0;
        Duck.transform.x = -16;
        Duck.transform.z = 36;
        scene.addChild(Duck);

        if (true) {
            let mat = new LitMaterial();
            mat.baseMap = Engine3D.res.whiteTexture;
            mat.normalMap = Engine3D.res.normalTexture;
            mat.aoMap = Engine3D.res.whiteTexture;
            mat.maskMap = Engine3D.res.createTexture(32, 32, 255.0, 255.0, 0.0, 1);
            mat.emissiveMap = Engine3D.res.blackTexture;
            mat.roughness = 0.5;
            mat.metallic = 0.2;

            let floor = new Object3D();
            let floorMr = floor.addComponent(MeshRenderer);
            floorMr.geometry = new BoxGeometry(1000, 5, 1000);
            floorMr.material = mat;
            scene.addChild(floor);

            let ball = new Object3D();
            let mr = ball.addComponent(MeshRenderer);
            mr.geometry = new SphereGeometry(6, 20, 20);
            mr.material = mat;
            scene.addChild(ball);
            ball.transform.x = -17;
            ball.transform.y = 34;
            ball.transform.z = 23;

            //wall
            let back_wall = new Object3D();
            let mr2 = back_wall.addComponent(MeshRenderer);
            mr2.geometry = new BoxGeometry(500, 500, 10);
            mr2.material = mat;
            back_wall.z = - 200;
            scene.addChild(back_wall);

            let front_wall = new Object3D();
            let mr3 = front_wall.addComponent(MeshRenderer);
            mr3.geometry = new BoxGeometry(500, 500, 10);
            mr3.material = mat;
            front_wall.z = 200;
            scene.addChild(front_wall);

            let left_wall = new Object3D();
            let mr4 = left_wall.addComponent(MeshRenderer);
            mr4.geometry = new BoxGeometry(10, 500, 500);
            mr4.material = mat;
            left_wall.x = - 200;
            scene.addChild(left_wall);

            let right_wall = new Object3D();
            let mr5 = right_wall.addComponent(MeshRenderer);
            mr5.geometry = new BoxGeometry(10, 500, 500);
            mr5.material = mat;
            right_wall.x = 200;
            scene.addChild(right_wall);
        }
    }
}
