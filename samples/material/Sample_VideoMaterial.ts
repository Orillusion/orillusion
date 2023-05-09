import { Engine3D, Scene3D, Object3D, Camera3D, View3D, MeshRenderer, HoverCameraController, AtmosphericComponent, BoxGeometry } from "@orillusion/core";
import { VideoTexture, VideoMaterial } from "@orillusion/media-extention"

async function demo() {
    await Engine3D.init();
    let scene = new Scene3D();
    scene.addComponent(AtmosphericComponent);

    let camera = new Object3D();
    scene.addChild(camera)
    let mainCamera = camera.addComponent(Camera3D);
    mainCamera.perspective(60, Engine3D.aspect, 0.1, 10000.0);
    let hc = camera.addComponent(HoverCameraController);
    hc.setCamera(-45, 0, 5);

    let video = document.createElement('video')
    video.src = 'https://cdn.orillusion.com/videos/bunny.mp4'
    video.muted = true
    video.autoplay = true
    video.loop = true
    video.crossOrigin = ''
    video.setAttribute('controlslist', 'nodownload nofullscreen noremoteplayback')
    video.setAttribute('style', 'position:fixed;right:0;top:0;z-index:1')
    video.controls = true
    document.body.appendChild(video)

    // Create VideoTexture
    let videoTexture = new VideoTexture();
    await videoTexture.load(video)
    // Create VideoMaterial
    let mat = new VideoMaterial();
    mat.baseMap = videoTexture;

    // Create a cube to play video
    let planeObj = new Object3D();
    let mr = planeObj.addComponent(MeshRenderer);
    mr.geometry = new BoxGeometry(2, 2, 2);
    mr.material = mat;
    scene.addChild(planeObj);

    let view = new View3D();
    view.scene = scene;
    view.camera = mainCamera;
    // start render
    Engine3D.startRenderView(view);
}

demo();