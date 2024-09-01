import { Engine3D, LitMaterial, MeshRenderer, Object3D, Scene3D, View3D, Object3DUtil, Vector3, AtmosphericComponent, DirectLight, CameraUtil, HoverCameraController, Color, Quaternion, ExtrudeGeometry, BlendMode, BitmapTexture2D } from "@orillusion/core";
import { CollisionShapeUtil, Physics, Rigidbody } from "@orillusion/physics";
import { Stats } from "@orillusion/stats";
import dat from "dat.gui";
import { Graphic3D } from '@orillusion/graphic'

/**
 * Sample class demonstrating the creation of a domino effect with physics interactions.
 */
class Sample_Dominoes {
    async run() {
        // init physics and engine
        await Physics.init({ useDrag: true });
        await Engine3D.init({ renderLoop: () => Physics.update() });

        let scene = new Scene3D();
        scene.addComponent(Stats);

        // 启用物理调试功能时，需要为绘制器传入graphic3D对象
        const graphic3D = new Graphic3D();
        scene.addChild(graphic3D);
        Physics.initDebugDrawer(graphic3D, { enable: false });

        let camera = CameraUtil.createCamera3DObject(scene);
        camera.perspective(60, Engine3D.aspect, 0.1, 800.0);
        camera.object3D.addComponent(HoverCameraController).setCamera(0, -32, 80);

        // Create directional light
        let lightObj3D = new Object3D();
        lightObj3D.localPosition = new Vector3(0, 30, -40);
        lightObj3D.localRotation = new Vector3(20, 160, 0);
        let directLight = lightObj3D.addComponent(DirectLight);
        directLight.castShadow = true;
        directLight.intensity = 2;
        scene.addChild(lightObj3D);

        // init sky
        scene.addComponent(AtmosphericComponent).sunY = 0.8;

        let view = new View3D();
        view.camera = camera;
        view.scene = scene;

        Engine3D.startRenderView(view);

        await this.initScene(scene);

        this.debug(scene)
    }

    // init the scene with ground, Pipe, ball, and dominoes.
    private async initScene(scene: Scene3D) {
        // Create ground and add rigidbody
        let ground = Object3DUtil.GetSingleCube(100, 0.1, 100, 1, 1, 1);
        scene.addChild(ground);

        let rigidbody = ground.addComponent(Rigidbody);
        rigidbody.shape = CollisionShapeUtil.createBoxShape(ground);
        rigidbody.mass = 0;
        rigidbody.friction = 100; // Set high friction for the ground
        rigidbody.isSilent = true; // Disable collision events

        // Create dominoes
        this.createDominoes(scene);

        // Create Pipe
        this.createPipe(scene);

        // Create ball
        this.createBall(scene);
    }

    private async createPipe(scene: Scene3D) {
        // create a object
        const obj: Object3D = new Object3D();
        // add MeshRenderer to the object
        let mr: MeshRenderer = obj.addComponent(MeshRenderer);

        // build shape
        let shape: Vector3[] = [],
            vertexCount = 8,
            shapeRadius = 1;
        for (let i = 0; i < vertexCount; i++) {
            let angle = (Math.PI * 2 * i) / vertexCount;
            let point = new Vector3(Math.sin(angle), 0, Math.cos(angle)).multiplyScalar(shapeRadius);
            shape.push(point);
        }
        // build curve path
        let curve: Vector3[] = [],
            sectionCount = 44,
            modelRadius = 4;
        for (let i = 0; i < sectionCount; i++) {
            let angle = (Math.PI * 2 * i) / 22;
            modelRadius += (0.1 * i) / sectionCount;
            let offsetY = 0.6 - Math.sqrt(i / sectionCount);
            let point = new Vector3(Math.sin(angle), offsetY * 6, Math.cos(angle)).multiplyScalar(modelRadius);
            curve.push(point);
        }

        // build ExtrudeGeometry from shape & curve
        mr.geometry = new ExtrudeGeometry().build(shape, true, curve, 0.2);
        // set a pbr lit material
        let material = new LitMaterial();
        material.cullMode = 'none';
        material.depthCompare = 'always';
        material.blendMode = BlendMode.ADD;
        material.baseColor = new Color(0, 1, 0.5, 1.0);
        material.transparent = true;

        let texture = new BitmapTexture2D();
        texture.addressModeU = 'repeat';
        texture.addressModeV = 'repeat';
        await texture.load('https://cdn.orillusion.com/textures/grid.webp');

        material.baseMap = texture;
        mr.material = material;

        obj.localPosition = new Vector3(-30, 20, -3);
        scene.addChild(obj);

        let rigidbody = obj.addComponent(Rigidbody);
        rigidbody.shape = CollisionShapeUtil.createBvhTriangleMeshShape(obj);
        rigidbody.mass = 0;
    }

    // Create a series of dominoes with rigid bodies and arrange them in an S-shaped curve.
    private createDominoes(scene: Scene3D) {
        const width = 0.5;
        const height = 5;
        const depth = 2;

        const originX = -30;
        const originZ = 4.7;

        const totalDominoes = 40;
        const segmentLength = 2; // Distance between dominoes

        let previousX = originX;
        let previousZ = originZ;

        for (let i = 0; i < totalDominoes; i++) {
            let box = Object3DUtil.GetSingleCube(width, height, depth, Math.random(), Math.random(), Math.random());

            let angle = (Math.PI / (totalDominoes / 2)) * i;
            let x = originX + segmentLength * i;
            let z = originZ + Math.sin(angle) * 15; // Adjust sine curve amplitude for S-shape

            box.localPosition = new Vector3(x, height / 2, z);

            // Adjust each domino's rotation to align with the curve
            let deltaX = x - previousX;
            let deltaZ = z - previousZ;
            box.rotationY = i === 0 ? -48 : -Math.atan2(deltaZ, deltaX) * (180 / Math.PI);
            scene.addChild(box);
            previousX = x;
            previousZ = z;

            let rigidbody = box.addComponent(Rigidbody);
            rigidbody.shape = Rigidbody.collisionShape.createBoxShape(box);
            rigidbody.mass = 30;
            rigidbody.friction = 0.1;
            rigidbody.collisionEvent = (contactPoint, selfBody, otherBody) => {
                rigidbody.enableCollisionEvent = false; // Handle collision only once
                (box.getComponent(MeshRenderer).material as LitMaterial).baseColor = Color.random();
            };
        }
    }

    // Create a ball with a rigid body.
    private createBall(scene: Scene3D) {
        let ball = Object3DUtil.GetSingleSphere(0.8, 1, 0, 0);
        ball.name = 'ball';
        ball.localPosition = new Vector3(-30, 40, 1);
        scene.addChild(ball);

        let rigidbody = ball.addComponent(Rigidbody);
        rigidbody.shape = Rigidbody.collisionShape.createSphereShape(ball);
        rigidbody.mass = 50;
    }

    private debug(scene: Scene3D) {
        let gui = new dat.GUI();
        let f = gui.addFolder('PhysicsDebug');
        f.add(Physics.debugDrawer, 'enable');
        f.add(Physics.debugDrawer, 'debugMode', Physics.debugDrawer.debugModeList);
        gui.add({
            ResetBall: () => {
                const ballObj = scene.getChildByName('ball') as Object3D;
                ballObj?.getComponent(Rigidbody).updateTransform(new Vector3(-30, 40, 1), Quaternion._zero, true);
            }
        }, 'ResetBall');
    }
}

new Sample_Dominoes().run();
