// import { Engine3D } from "../../engine/Engine3D";
// import { AtmosphericComponent } from "../../engine/components/AtmosphericComponent";
// import { ColliderComponent } from "../../engine/components/ColliderComponent";
// import { HoverCameraController } from "../../engine/components/controller/HoverCameraController";
// import { DirectLight } from "../../engine/components/lights/DirectLight";
// import { MeshRenderer } from "../../engine/components/renderer/MeshRenderer";
// import { Camera3D } from "../../engine/core/Camera3D";
// import { Scene3D } from "../../engine/core/Scene3D";
// import { View3D } from "../../engine/core/View3D";
// import { Object3D } from "../../engine/core/entities/Object3D";
// import { PointerEvent3D } from "../../engine/event/eventConst/PointerEvent3D";
// import { webGPUContext } from "../../engine/gfx/graphics/webGpu/Context3D";
// import { LitMaterial } from "../../engine/materials/LitMaterial";
// import { Color } from "../../engine/math/Color";
// import { SphereGeometry } from "../../engine/shape/SphereGeometry";
// import { defaultRes } from "../../engine/textures/DefaultRes";
// import { CameraUtil } from "../../engine/util/CameraUtil";
// import { KelvinUtil } from "../../engine/util/KelvinUtil";
// import { MaterialStateComponent } from "./coms/MaterialStateComponent";

// export class Sample_MousePick {
//     lightObj: Object3D;
//     cameraObj: Camera3D;
//     scene: Scene3D;
//     hover: HoverCameraController;

//     constructor() { }

//     async run() {
//         Engine3D.setting.pick.enable = true;
//         Engine3D.setting.pick.mode = `pixel`;

//         await Engine3D.init({});

//         this.scene = new Scene3D();
//         this.scene.addComponent(AtmosphericComponent);
//         let camera = CameraUtil.createCamera3DObject(this.scene);
//         camera.perspective(60, webGPUContext.aspect, 1, 5000.0);

//         this.hover = camera.object3D.addComponent(HoverCameraController);
//         this.hover.setCamera(-45, -45, 120);

//         let wukong = await Engine3D.res.loadGltf('gltfs/wukong/wukong.gltf');
//         wukong.transform.x = 100;
//         wukong.transform.scaleX = 10;
//         wukong.transform.scaleY = 10;
//         wukong.transform.scaleZ = 10;
//         wukong.forChild((node) => {
//             if (node.hasComponent(MeshRenderer)) {
//                 node.addComponent(MaterialStateComponent);
//                 node.addComponent(ColliderComponent);
//                 node.addEventListener(PointerEvent3D.PICK_UP, this.onUp, this);
//                 node.addEventListener(PointerEvent3D.PICK_DOWN, this.onDown, this);
//                 node.addEventListener(PointerEvent3D.PICK_CLICK, this.onPick, this);
//                 node.addEventListener(PointerEvent3D.PICK_OVER, this.onOver, this);
//                 node.addEventListener(PointerEvent3D.PICK_OUT, this.onOut, this);
//                 node.addEventListener(PointerEvent3D.PICK_MOVE, this.onMove, this);
//             }
//         });
//         this.scene.addChild(wukong);

//         let view = new View3D();
//         view.scene = this.scene;
//         view.camera = camera;




//         Engine3D.startRenderView(view);

//         this.initPickObject(this.scene);
//     }

//     private initPickObject(scene: Scene3D): void {
//         /******** light *******/
//         {
//             this.lightObj = new Object3D();
//             this.lightObj.x = 0;
//             this.lightObj.y = 30;
//             this.lightObj.z = -40;
//             this.lightObj.rotationX = 115;
//             this.lightObj.rotationY = 200;
//             this.lightObj.rotationZ = 160;
//             let lc = this.lightObj.addComponent(DirectLight);
//             lc.lightColor = KelvinUtil.color_temperature_to_rgb(5355);
//             lc.castShadow = true;
//             lc.intensity = 1.7;
//             lc.debug();
//             scene.addChild(this.lightObj);
//         }

//         let size: number = 9;
//         // let shape = new BoxColliderShape();
//         // shape.setFromCenterAndSize(new Vector3(), new Vector3(size, size, size));

//         let geometry = new SphereGeometry(size / 2, 20, 20);
//         for (let i = 0; i < 10; i++) {
//             let obj = new Object3D();
//             obj.name = 'sphere ' + i;
//             scene.addChild(obj);
//             obj.x = (i - 5) * 10;

//             let mat = new LitMaterial();
//             mat.emissiveMap = defaultRes.grayTexture;
//             mat.emissiveIntensity = 0.0;

//             let renderer = obj.addComponent(MeshRenderer);
//             renderer.geometry = geometry;
//             renderer.material = mat;

//             obj.addComponent(MaterialStateComponent);

//             obj.addComponent(ColliderComponent);
//             obj.addEventListener(PointerEvent3D.PICK_UP, this.onUp, this);
//             obj.addEventListener(PointerEvent3D.PICK_DOWN, this.onDown, this);
//             obj.addEventListener(PointerEvent3D.PICK_CLICK, this.onPick, this);
//             obj.addEventListener(PointerEvent3D.PICK_OVER, this.onOver, this);
//             obj.addEventListener(PointerEvent3D.PICK_OUT, this.onOut, this);
//             obj.addEventListener(PointerEvent3D.PICK_MOVE, this.onMove, this);
//         }
//     }

//     private onUp(e: PointerEvent3D) {
//         if (e.currentTarget.current) {
//             console.log("onUp -> ", e.currentTarget.current.name);
//             console.log("onUp -> pickInfo", e.data.pickInfo);
//             console.log("onUp -> worldPos", e.data.pickInfo.worldPos);
//         }

//         let obj = e.currentTarget.current as Object3D;
//         let msc = obj.getComponent(MaterialStateComponent);
//         msc.changeColor(new Color(2, 0, 0, 1), 120);
//     }

//     private onDown(e: PointerEvent3D) {
//         if (e.currentTarget.current) {
//             console.log("onDow -> ", e.currentTarget.current.name);
//             console.log("onDow -> pickInfo", e.data.pickInfo);
//             console.log("onDow -> worldPos", e.data.pickInfo.worldPos);
//         }

//         let obj = e.currentTarget.current as Object3D;
//         let msc = obj.getComponent(MaterialStateComponent);
//         msc.changeColor(new Color(2, 2, 0, 1), 120);
//     }

//     private onPick(e: PointerEvent3D) {
//         if (e.currentTarget.current) {
//             console.log("onPick", e.currentTarget.current.name);
//             console.log("onPick -> pickInfo", e.data.pickInfo);
//             console.log("onPick -> worldPos", e.data.pickInfo.worldPos);
//         }

//         let obj = e.currentTarget.current as Object3D;
//         let msc = obj.getComponent(MaterialStateComponent);
//         msc.changeColor(new Color(2, 0, 0, 1), 120);
//     }

//     private onOver(e: PointerEvent3D) {
//         if (e.currentTarget.current) {
//             console.log("onOver -> ", e.currentTarget.current.name);
//             console.log("onOver -> kInfo", e.data.pickInfo);
//             console.log("onOver -> worldPos", e.data.pickInfo.worldPos);
//         }

//         let obj = e.currentTarget.current as Object3D;
//         let msc = obj.getComponent(MaterialStateComponent);
//         msc.changeColor(new Color(1, 0.64, 0.8, 2.5), 100);
//     }

//     private onOut(e: PointerEvent3D) {
//         if (e.currentTarget.current) {
//             console.log("onOut -> ", e.currentTarget.current.name);
//             console.log("onOut -> pickInfo", e.data.pickInfo);
//             console.log("onOut -> worldPos", e.data.pickInfo.worldPos);
//         }

//         let obj = e.currentTarget.current as Object3D;
//         let msc = obj.getComponent(MaterialStateComponent);
//         msc.changeColor(new Color(0, 0, 0), 120);
//     }

//     private onMove(e: PointerEvent3D) {
//         if (e.currentTarget.current) {
//             console.log("onMove -> ", e.currentTarget.current.name);
//             console.log("onMove -> pickInfo", e.data.pickInfo);
//             console.log("onMove -> worldPos", e.data.pickInfo.worldPos);
//         }
//     }

//     renderUpdate() { }
// }
