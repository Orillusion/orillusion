import { Engine3D, Scene3D, View3D, Object3D, Color, Vector3, AtmosphericComponent, CameraUtil, HoverCameraController, DirectLight, KelvinUtil, Time, Object3DUtil, lerpVector3, Camera3D, AxisObject, ColliderComponent, PointerEvent3D, ComponentBase, Plane } from '@orillusion/core';
import { Stats } from '@orillusion/stats';
import { Graphic3D } from '@orillusion/graphic';
import * as dat from 'dat.gui';

interface PathInfo {
    name: string, // 曲线名称
    color: Color | Color[], // 线段颜色
    basePoints: Vector3[]; // 曲线基点
    curvePoints: Vector3[]; // 曲线包含的所有点
}

enum CameraModes {
    DualOrbit = 'DualOrbit', // 相机和目标按照各自的轨道进行运动
    FixedCamera = 'FixedCamera', // 相机固定位置，目标按轨道运动
    FixedTarget = 'FixedTarget', // 目标固定位置，相机按轨道运动
    FreeCamera = 'FreeCamera'// 自由相机，相机模拟物体面向目标物体进行运动
}

class Sample_CameraPathAnimation {
    view: View3D;
    camera: Camera3D;
    graphic3D: Graphic3D;

    cameraMode = CameraModes.DualOrbit;
    guiControl: dat.GUIController<object>;

    // 相机与目标的路径信息
    cameraPathInfo: PathInfo = {
        name: 'cameraCurve',
        color: Color.hexRGBColor(Color.YELLOW),
        basePoints: [],
        curvePoints: [],
    };
    targetPathInfo: PathInfo = {
        name: 'targetCurve',
        color: Color.hexRGBColor(Color.DEEPPINK),
        basePoints: [],
        curvePoints: []
    };

    // 移动对象
    targetSphere: Object3D; // 目标路径上的球体
    cameraBox: Object3D; // 相机路径上的长方体

    // 过渡开始时间、过渡持续时间
    startTime: number = 0;
    duration: number = 60; // SECS

    isMove: boolean = false;
    _tmpVecA = new Vector3();
    lookAtUp = new Vector3(0.03, 1, 0.03);

    async run() {
        Engine3D.setting.pick.enable = true;
        Engine3D.setting.pick.mode = `pixel`;

        await Engine3D.init({ renderLoop: () => this.loop() });

        let scene = new Scene3D();
        scene.addComponent(Stats);

        let camera = CameraUtil.createCamera3DObject(scene);
        camera.perspective(60, Engine3D.aspect, 1, 1000.0);
        camera.transform.rotationX = 90;
        camera.enableCSM = true;

        let hoverCtrl = camera.object3D.addComponent(HoverCameraController);
        hoverCtrl.setCamera(-40, -25, 250);
        hoverCtrl.dragSmooth = 4;
        hoverCtrl.enable = false

        // create direction light
        let lightObj3D = new Object3D()
        lightObj3D.localPosition = new Vector3(0, 30, -40)
        lightObj3D.localRotation = new Vector3(20, 160, 0)

        let light = lightObj3D.addComponent(DirectLight)
        light.lightColor = KelvinUtil.color_temperature_to_rgb(5355)
        light.castShadow = true
        light.intensity = 10;
        scene.addChild(light.object3D)

        // init sky 
        let atmosphericSky = scene.addComponent(AtmosphericComponent);
        atmosphericSky.relativeTransform = light.transform;
        atmosphericSky.displaySun = false;
        atmosphericSky.sunRadiance = 1;

        let view = this.view = new View3D();
        view.camera = this.camera = camera;
        view.scene = scene;

        // init Graphic3D to draw lines
        this.graphic3D = new Graphic3D()
        scene.addChild(this.graphic3D)

        Engine3D.startRenderView(view);

        await this.initScene(scene, hoverCtrl);
        hoverCtrl.enable = true;
    }

    private async initScene(scene: Scene3D, hoverCtrl: HoverCameraController) {
        // 添加目标对象
        this.targetSphere = Object3DUtil.GetSingleSphere(4.5, 1, 1, 1);
        this.cameraBox = Object3DUtil.GetSingleCube(2, 2, 8, 0.5, 0.5, 0.5);
        scene.addChild(this.targetSphere);
        scene.addChild(this.cameraBox);

        // 两条曲线的基准点，用于曲线构建
        const { cameraBasePoints, targetBasePoints } = this.getBasePoints()
        this.cameraPathInfo.basePoints = cameraBasePoints;
        this.targetPathInfo.basePoints = targetBasePoints;

        // 基于每个基准点创建3D对象并添加到控制组对象中
        let controlPointsGroup = new Object3D();
        this.createAndAddControlBoxes(this.cameraPathInfo, controlPointsGroup);
        this.createAndAddControlBoxes(this.targetPathInfo, controlPointsGroup);
        scene.addChild(controlPointsGroup);

        // 创建线条
        this.refreshLine(this.cameraPathInfo);
        this.refreshLine(this.targetPathInfo);

        // 添加坐标轴组件
        let axisControl = scene.addComponent(AxisController);
        axisControl.view = this.view;
        axisControl.cameraCtrl = hoverCtrl;
        axisControl.setControlGroup(controlPointsGroup);
        axisControl.onMoveEvent((target) => this.modifyBasePoints(target));

        // 加载场景模型（渲染视图前加载会影响坐标轴组件的拾取精准度）
        // https://cdn.orillusion.com/gltfs/glb/BuildingWithCharacters/scene.glb
        let model = await Engine3D.res.loadGltf('gltfs/glb/BuildingWithCharacters.glb');
        model.scaleX = model.scaleY = model.scaleZ = 0.3;
        scene.addChild(model);

        this.initGui(controlPointsGroup, axisControl, hoverCtrl, model);
    }

    private getBasePoints() {
        let cameraBasePoints = [
            new Vector3(-100.1243, 13.8724, 116.2651),
            new Vector3(-22.9729, 13.8724, 135.2939),
            new Vector3(-21.9837, 104.3755, 117.4502),
            new Vector3(-17.1684, 77.5601, 46.0082),
            new Vector3(-28.4011, 83.2710, -97.7831),
            new Vector3(-122.0379, 142.4560, -89.7829),
            new Vector3(0.9048, 183.4332, 1.6006),
            new Vector3(122.3487, 36.6475, 23.2021),
            new Vector3(18.2206, 6.7467, 105.1357),
            new Vector3(-28.6247, 15.8723, 39.2853),
            new Vector3(-77.3121, 9.8309, 33.5839),
            new Vector3(-115.7828, 78.2913, 19.2395),
            new Vector3(-48.5328, 79.0903, -62.0619),
            new Vector3(-14.7059, 79.4859, -18.5764),
            new Vector3(-12.2206, 86.5313, 63.0162),
            new Vector3(-39.3602, 50.7533, 38.1593),
            new Vector3(-183.4780, 137.8206, -99.2229)
        ];

        let targetBasePoints = [
            new Vector3(100.2351, 50.2681, -131.0346),
            new Vector3(-24.4349, 93.0914, -131.0346),
            new Vector3(-21.1782, 20.2790, -131.0346),
            new Vector3(-21.9568, 60.1899, -72.9576),
            new Vector3(-51.7717, 63.6999, 33.4793),
            new Vector3(13.0265, 109.2561, 10.8372),
            new Vector3(-35.5919, 3.8006, 52.0907),
            new Vector3(-80.0583, 16.5457, 1.3015),
            new Vector3(-70.4104, -23.8815, -28.1115),
            new Vector3(-24.7756, 5.9985, -64.5841),
            new Vector3(-63.4902, 41.5661, -44.0699),
            new Vector3(-42.4930, 81.2731, -31.3227),
            new Vector3(-2.1510, 72.4425, 4.9373),
            new Vector3(-29.0113, 36.8627, 134.4743),
            new Vector3(-71.4757, 22.3481, 21.2798),
            new Vector3(-14.7888, 41.8757, 23.3403),
            new Vector3(-54.8118, 51.4163, -20.6089)
        ];

        return { cameraBasePoints, targetBasePoints };
    }

    private createAndAddControlBoxes(pathInfo: PathInfo, controlPointsGroup: Object3D) {
        pathInfo.basePoints.forEach((position, index) => {
            let box = Object3DUtil.GetSingleCube(2, 2, 2, Math.random(), Math.random(), Math.random());

            // 为每个控制体关联其所在曲线的路径信息以及对应的索引，以便在其位置被修改后更新曲线
            box.data = { pathInfo, index };
            box.localPosition = position;
            controlPointsGroup.addChild(box);
        })
    }

    private refreshLine(pathInfo: PathInfo, index?: number) {
        const basePoints = pathInfo.basePoints;
        const samples = 20; // 每个基点的样本量

        if (index === undefined) {
            pathInfo.curvePoints = this.generateOrUpdateCurve(basePoints, samples, 0.5);
        } else {

            // 根据选中的基点及其相邻点重新计算曲线片段并定义需要重新计算的点的索引范围
            const start = Math.max(0, index - 2);
            const end = Math.min(basePoints.length - 1, index + 1);
            const indicesToCalculate = Array.from({ length: end - start + 1 }, (_, i) => start + i);

            // 计算受影响的曲线段
            const curveSegmentPoints = this.generateOrUpdateCurve(basePoints, samples, 0.5, indicesToCalculate);

            // 根据更新的范围计算替换起始索引
            const dataStartIndex = (start * (samples + 1)); // 包含样本点及其起始点

            // 替换原曲线点，更新曲线值
            pathInfo.curvePoints.splice(dataStartIndex, curveSegmentPoints.length, ...curveSegmentPoints);
        }

        this.graphic3D.Clear(pathInfo.name);
        this.graphic3D.drawLines(pathInfo.name, pathInfo.curvePoints, pathInfo.color);
    }

    public generateOrUpdateCurve(points: Vector3[], samples: number = 20, tension: number = 0.5, indicesToUpdate?: number[]): Vector3[] {
        let curveData: Vector3[] = [];
        let u = new Vector3(), v = new Vector3();
        for (let i = 0; i < points.length - 1; ++i) {
            if (!indicesToUpdate || indicesToUpdate.includes(i)) {
                const p0 = points[Math.max(i - 1, 0)];
                const p1 = points[i];
                const p2 = points[i + 1];
                const p3 = points[Math.min(i + 2, points.length - 1)];

                p2.subtract(p0, u).multiplyScalar(tension / 3.0).add(p1, u);
                p1.subtract(p3, v).multiplyScalar(tension / 3.0).add(p2, v);

                curveData.push(p1);
                curveData.push(...this.calculateBezierCurve(p1, u, v, p2, samples));
            }
        }

        if (!indicesToUpdate || indicesToUpdate.includes(points.length - 1)) {
            curveData.push(points[points.length - 1]);
        }

        return curveData;
    }

    protected calculateBezierCurve(p0: Vector3, p1: Vector3, p2: Vector3, p3: Vector3, samples: number): Vector3[] {
        var result = new Array<Vector3>(samples);
        for (let i = 0; i < samples; ++i) {
            let t = (i + 1) / (samples + 1.0);
            let _1t = 1 - t;
            let v0 = p0.mul(_1t * _1t * _1t);
            let v1 = p1.mul(3 * t * _1t * _1t);
            let v2 = p2.mul(3 * t * t * _1t);
            let v3 = p3.mul(t * t * t);
            result[i] = v0.add(v1).add(v2).add(v3);
        }
        return result;
    }

    private modifyBasePoints(target: Object3D) {
        let { pathInfo, index }: { pathInfo: PathInfo, index: number } = target.data;
        if (!pathInfo.basePoints[index].equals(target.localPosition)) {
            pathInfo.basePoints[index].copyFrom(target.localPosition);
            this.refreshLine(pathInfo, index);
        }
    }

    private initGui(controlPointsGroup: Object3D, axisControl: AxisController, hoverCtrl: HoverCameraController, model: Object3D) {
        let data = { duration: this.duration, changeLine: true };
        let gui = new dat.GUI();
        let f = gui.addFolder('CameraPathAnimation');

        f.add({ CameraModes: this.cameraMode }, 'CameraModes', CameraModes).onChange((value) => changeCameraMode(value));
        this.guiControl = f.add(this, 'isMove').name('Run').onChange((value) => run(value));
        f.add(data, 'changeLine').name('Show Lines').onChange((value) => changeLine(value));
        f.add(controlPointsGroup.transform, 'enable').name('Show Boxs');
        f.add(this.targetSphere.transform, 'enable').name('Show Target').onChange((value) => this.cameraBox.transform.enable = value);
        f.add(model.transform, 'enable').name('Show Model');
        f.add(data, 'duration', 10, 120, 1).name('Duration (SECS)').onFinishChange((value) => {
            this.duration = value;
            this.startTime = Time.time;
        });
        f.add({ Reset: () => { location.reload(); } }, 'Reset');
        f.add({ 'Click Box': 'Click box to show axis' }, 'Click Box');
        f.add({ 'Drag Axis': 'Drag the axis for move' }, 'Drag Axis');
        f.open();

        const changeCameraMode = (value: CameraModes) => {
            this.cameraMode = value;
            if (this.isMove) hoverCtrl.enable = axisControl.enable = value === CameraModes.FreeCamera;

            switch (this.cameraMode) {
                case CameraModes.FixedCamera:
                    this.cameraBox.localPosition = new Vector3(-130, 110, 100)
                    break;
                case CameraModes.FixedTarget:
                    this.targetSphere.localPosition = new Vector3(-75, 36, 50)
                    break;
                case CameraModes.FreeCamera:
                    hoverCtrl.setCamera(-40, -25, 250, Vector3.ZERO);
                    break;
            }
        }

        const run = (status: boolean) => {
            hoverCtrl.enable = axisControl.enable = this.cameraMode === CameraModes.FreeCamera || !status;

            if (status) this.startTime = Time.time;
            else if (this.cameraMode !== CameraModes.FreeCamera) {
                hoverCtrl.setCamera(-40, -25, 250, Vector3.ZERO);
            }
        }

        const changeLine = (show: boolean) => {
            if (show) {
                this.graphic3D.drawLines(this.cameraPathInfo.name, this.cameraPathInfo.curvePoints, this.cameraPathInfo.color);
                this.graphic3D.drawLines(this.targetPathInfo.name, this.targetPathInfo.curvePoints, this.targetPathInfo.color);
                console.log('camerabasePoints', this.cameraPathInfo.basePoints);
                console.log('targetbasePoints', this.targetPathInfo.basePoints);
            } else {
                this.graphic3D.Clear(this.cameraPathInfo.name);
                this.graphic3D.Clear(this.targetPathInfo.name);
            }
        }
    }

    protected easeInOutCubic(t: number): number {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    loop() {
        if (!this.isMove) return;

        let timeElapsed = Time.time - this.startTime;
        let progress = this.easeInOutCubic(timeElapsed / (this.duration * 1000));

        if (progress >= 1) return this.guiControl.setValue(!this.isMove);

        const cameraCurvePoints = this.cameraPathInfo.curvePoints;
        const targetCurvePoints = this.targetPathInfo.curvePoints;

        // 计算曲线段的进度
        let lastIndex = cameraCurvePoints.length - 1;
        let currentIndex = Math.floor(progress * lastIndex);
        let nextIndex = Math.min(currentIndex + 1, lastIndex);
        let segmentProgress = (progress * lastIndex) - currentIndex;

        // 计算当前进度对应的曲线上的两个点的位置，使用lerp替代lerpVector3 可节省实例化Vector3的开销
        let cameraNextPos = lerpVector3(cameraCurvePoints[currentIndex], cameraCurvePoints[nextIndex], segmentProgress);
        let targetNextPos = lerpVector3(targetCurvePoints[currentIndex], targetCurvePoints[nextIndex], segmentProgress);

        switch (this.cameraMode) {
            case CameraModes.DualOrbit: // 相机和目标按照各自的轨道进行运动
                this.targetSphere.localPosition = targetNextPos;
                this._tmpVecA = lerpVector3(this._tmpVecA, this.targetSphere.localPosition, 0.008);
                // this.camera.transform.lookAt(cameraNextPos, this._tmpVecA, this.lookAtUp);
                let cameraPos = lerpVector3(this.camera.transform.localPosition, cameraNextPos, 0.08)
                this.camera.transform.lookAt(cameraPos, this._tmpVecA, this.lookAtUp)
                break;
            case CameraModes.FixedCamera: // 相机固定位置，目标按轨道运动
                this.targetSphere.localPosition = targetNextPos;
                this.camera.transform.lookAt(this.cameraBox.localPosition, targetNextPos);
                break;
            case CameraModes.FixedTarget: // 目标固定位置，相机按轨道运动
                this.camera.transform.lookAt(cameraNextPos, this.targetSphere.localPosition, this.lookAtUp);
                break;
            case CameraModes.FreeCamera: // 自由相机，相机模拟物体面向目标物体进行运动
                this.targetSphere.localPosition = targetNextPos;
                // this.cameraBox.transform.lookAt(cameraNextPos, this.targetSphere.localPosition);
                let cameraBoxNextPos = lerpVector3(this.cameraBox.localPosition, cameraNextPos, 0.08)
                this.cameraBox.transform.lookAt(cameraBoxNextPos, this.targetSphere.localPosition);
                break;
        }
    }

}

/* 坐标轴控制器 */
class AxisController extends ComponentBase {
    public view: View3D;
    public cameraCtrl: { enable: boolean } | undefined;

    // 坐标轴对象
    private axisObject: Object3D;

    // 选中的目标对象与轴向
    private selectedTarget: Object3D;
    private selectedAxis: 'x' | 'y' | 'z';

    // 射线交点与轴对象位置之间的偏移量
    private offsetDistance: number = 0;

    private _tmpVecA: Vector3 = new Vector3()
    private _tmpVecB: Vector3 = new Vector3()

    // 注册事件处理函数
    private moveEvent?: ((target: Object3D) => void) | undefined;
    public onMoveEvent(callback: (target: Object3D) => void): void {
        this.moveEvent = callback;
    }

    // 可控制的对象组，为方便管理 所有可控制对象均包含在一个3D对象中
    public setControlGroup(target: Object3D) {
        target.forChild((node: Object3D) => {
            node.addComponent(ColliderComponent);
            node.addEventListener(PointerEvent3D.PICK_CLICK, this.onPickClick, this);
        })
    }

    public start() {
        // 注册坐标轴XYZ对象的点击事件
        this.axisObject = new AxisObject(10, 0.5)
        this.axisObject.forChild((node: Object3D) => {
            node.data = { axis: node.x !== 0 ? 'x' : node.y !== 0 ? 'y' : 'z' }; // 为每条轴添加轴向标识
            node.addComponent(ColliderComponent);
            node.addEventListener(PointerEvent3D.PICK_DOWN, this.onPickDown, this);
        })
        this.axisObject.transform.enable = false;
        this.view.scene.addChild(this.axisObject);

        Engine3D.inputSystem.addEventListener(PointerEvent3D.POINTER_MOVE, this.onPointerMove, this);
        Engine3D.inputSystem.addEventListener(PointerEvent3D.POINTER_UP, this.onPointerUp, this);
    }

    private onPickClick(e: PointerEvent3D) {
        if (!this.enable) return;

        let target = e.currentTarget.current as Object3D;
        if (this.selectedTarget !== target) {
            this.selectedTarget = target;
            this.axisObject.localPosition = target.localPosition;
        } else {
            this.selectedTarget = null;
        }
        this.axisObject.transform.enable = !!this.selectedTarget;
    }

    private onPickDown(e: PointerEvent3D) {
        if (!this.enable) return;
        const axis = e.currentTarget.current.data?.axis as 'x' | 'y' | 'z';
        if (axis !== 'x' && axis !== 'y' && axis !== 'z') return console.error('Invalid axis value');

        this.selectedAxis = axis;
        this.cameraCtrl.enable = false;

        let targetPos = this.selectedTarget.localPosition;

        // 使用两个辅助向量定义参考线的起点和终点
        Vector3.HELP_0.copyFrom(targetPos)[axis] -= 10000;
        Vector3.HELP_1.copyFrom(targetPos)[axis] += 10000;

        // const color = { 'x': Color.COLOR_RED, 'y': Color.COLOR_GREEN, 'z': Color.COLOR_BLUE }[axis]
        this.view.graphic3D.drawLines('referenceLine', [Vector3.HELP_0, Vector3.HELP_1]); //  创建一条参考线

        // 计算坐标轴对象当前的坐标与交点的偏移量，以便后续拖动时修正位置
        let intersection = this.calculateIntersectionPoint(this.view.camera, targetPos);
        if (intersection) {
            this.offsetDistance = targetPos[axis] - intersection[axis];
        }
    }

    private onPointerUp(e: PointerEvent3D) {
        if (!this.selectedAxis || !this.selectedTarget || !this.enable) return;
        this.selectedAxis = null;
        this.cameraCtrl.enable = true;
        this.view.graphic3D.Clear('referenceLine');
    }

    private onPointerMove(e: PointerEvent3D) {
        if (!this.selectedAxis || !this.selectedTarget || !this.enable) return;

        const axis = this.selectedAxis;
        let targetTransform = this.selectedTarget.transform;
        let intersection = this.calculateIntersectionPoint(this.view.camera, targetTransform.localPosition);

        if (intersection) {
            // 更新位置
            targetTransform[axis] = intersection[axis] + this.offsetDistance;
            this.axisObject.transform[axis] = targetTransform[axis];
        }

        this.moveEvent(this.selectedTarget); // 执行注册的事件
    }

    private calculateIntersectionPoint(camera: Camera3D, targetPos: Vector3): Vector3 | null {
        // 视线方向向量
        let cameraDirection = camera.getWorldDirection(this._tmpVecA);

        // 构造与相机视角垂直的平面对象
        let p1 = new Plane(targetPos, cameraDirection);

        // 判断平面是否和射线相交，并计算交点
        let ray = camera.screenPointToRay(Engine3D.inputSystem.mouseX, Engine3D.inputSystem.mouseY);
        let intersection = this._tmpVecB;
        let hasIntersection = p1.intersectsRay(ray, intersection);

        return hasIntersection ? intersection : null;
    }

}

new Sample_CameraPathAnimation().run();