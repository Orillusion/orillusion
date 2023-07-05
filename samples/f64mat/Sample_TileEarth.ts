import {Stats} from '@orillusion/stats';
import {EarthControl} from './script/earthTool/EarthControl';

import {
    Engine3D,
    Scene3D,
    Object3D,
    Camera3D,
    DirectLight,
    HoverCameraController,
    Color,
    View3D,
    AtmosphericComponent,

} from "@orillusion/core";

class Sample_TileEarth {
    scene: Scene3D;

    async run() {

            // 初始化引擎
            await Engine3D.init({});
            // 新建场景根节点
            let scene3D: Scene3D = new Scene3D();
            // 添加天空渲染组件
            scene3D.addComponent(AtmosphericComponent);

            // 新建摄像机实例
            let cameraObj: Object3D = new Object3D();
            let camera = cameraObj.addComponent(Camera3D);
            // 调整摄像机视角
            camera.perspective(60, Engine3D.aspect, 0.01, 40960000.0);
            // 设置相机控制器
            let controller = (window as any).controller = camera.object3D.addComponent(HoverCameraController);
            controller.minDistance =10378137000;
            controller.maxDistance = 10378137;
            controller.wheelStep = 0.0001;
            controller.mouseLeftFactor = 3;
            controller.setCamera(-60, 45, 10378137000);


            // 添加相机节点
            scene3D.addChild(cameraObj);
            scene3D.addComponent(Stats);
            // 新建光照
            let light: Object3D = new Object3D();

            // 添加直接光组件
            let component: DirectLight = light.addComponent(DirectLight);
            // 调整光照参数
            light.rotationX = 45;
            light.rotationY = 30;
            component.lightColor = new Color(1.0, 1.0, 1.0, 1.0);
            component.intensity = 35;
            // 添加光照对象
            scene3D.addChild(light);

            new EarthControl(scene3D, camera, controller);

            // 创建渲染视图
            let view = new View3D();
            view.scene = scene3D;
            view.camera = camera;
            // 开始渲染
            Engine3D.startRenderView(view);

    }

    async initScene() {

    }

    renderUpdate() {

    }
}

new Sample_TileEarth().run();