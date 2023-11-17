import { Engine3D, Scene3D, CameraUtil, HoverCameraController, Object3D, MeshRenderer, View3D, PlaneGeometry, UnLitMaterial, Color, Vector3, PointerEvent3D, Camera3D, SphereGeometry, CylinderGeometry, MathUtil, BlendMode, GPUCullMode, ViewPanel, UITextField, TextAnchor, ComponentBase, BoundUtil, WorldPanel, UIPanel } from '@orillusion/core';
import { Stats } from '@orillusion/stats';

class Sample_TextBarrage {
    private scene: Scene3D
    private camera: Camera3D

    async run() {
        // init engine
        await Engine3D.init();
        // create new Scene
        let scene = new Scene3D();
        this.scene = scene;
        
        // load base font
        await Engine3D.res.loadFont('https://cdn.orillusion.com/fnt/0.fnt')

        // init camera3D
        let mainCamera = CameraUtil.createCamera3D(null, scene);
        mainCamera.orthoOffCenter(-window.innerWidth / 2, window.innerWidth / 2, -window.innerHeight / 2, window.innerHeight / 2, 0, 5000)
        this.camera = mainCamera

        // add basic plane
        let plane = new Object3D();
        let mr = plane.addComponent(MeshRenderer);
        mr.geometry = new PlaneGeometry(window.innerWidth, window.innerHeight, 1, 1, Vector3.Z_AXIS);
        let mat = new UnLitMaterial()
        mat.baseColor = new Color(0.2, 0.2, 0.2)
        mr.material = mat;
        plane.z = 100;
        scene.addChild(plane);

        // create a view with target scene and camera
        let view = new View3D();
        view.scene = scene;
        view.camera = mainCamera;

        // create UIpanel root
        let panelRoot: Object3D = new Object3D()
        let panel: UIPanel = panelRoot.addComponent(WorldPanel)
        panel.cullMode = GPUCullMode.none
        // add to UIcanvas
        let canvas = view.enableUICanvas()
        canvas.addChild(panelRoot)

        // Create text barrage
        const textCount = 50;
        for (let i = 0; i < textCount; ++i) {
            const textQuad = new Object3D();
            panelRoot.addChild(textQuad);
            const text = textQuad.addComponent(UITextField);
            // text.text = 'test'
            text.color = new Color(1, 1, 1)
            text.fontSize = 12
            text.alignment = TextAnchor.MiddleRight
            text.uiTransform.resize(120, 12)

            // Init and reset text barrage animation
            const barrage = textQuad.addComponent(TextBarrageAnimation);
            barrage.camera = this.camera;
            barrage.priorityOffset = textCount;
            barrage.play();
        }

        // start render
        Engine3D.startRenderView(view);
    }
}

class TextBarrageAnimation extends ComponentBase {
    // prettier-ignore
    static words = [ "GALACEAN", "galacean", "HELLO", "hello", "WORLD", "world", "TEXT", "text", "PEACE", "peace", "LOVE", "love", "abcdefg", "hijklmn", "opqrst", "uvwxyz", "ABCDEFG", "HIJKLMN", "OPQRST", "UVWXYZ", "~!@#$", "%^&*", "()_+" ];
    static colors = [
      new Color(1, 1, 1, 1),
      new Color(1, 0, 0, 1),
      new Color(0, 1, 0.89, 1),
    ];
  
    public camera: Camera3D;
    public priorityOffset: number = 0;
  
    private _speed: number = 0;
    private _range: number = 0;
    private _isPlaying: boolean = false;
    private _text: UITextField;
    private lastTime: number = 0;
  
    play() {
      this._isPlaying = true;
    }
  
    start(): void {
      this._text = this.object3D.getComponent(UITextField)
      this._range = -window.innerWidth / 2 * this.camera.aspect;
      this.lastTime = Date.now();
      this._reset(true);
    }
  
    onUpdate(): void {
      if (this._isPlaying) {
        const now = Date.now()
        const dt = (now - this.lastTime)
        this.lastTime = now
        this.object3D.transform.x += this._speed * dt;
        if (this.object3D.transform.x < this._range) {
          this._reset(false);
        }
      }
    }
  
    private _reset(isFirst: boolean) {
      const text = this._text;
      const { words, colors } = TextBarrageAnimation;
  
      // Reset the text to render
      const wordLastIndex = words.length - 1;
      text.text = `${words[getRandomNum(0, wordLastIndex)]} ${
        words[getRandomNum(0, wordLastIndex)]
      } ${getRandomNum(0, 99)}`;
  
      // Reset color
      text.color = colors[getRandomNum(0, colors.length - 1)];
  
      // Reset position
      const orthographicSize = window.innerWidth / 2
      if (isFirst) {
        const halfOrthoWidth = orthographicSize * this.camera.aspect;
        this.object3D.transform.x = getRandomNum(-halfOrthoWidth, halfOrthoWidth);
      } else {
        this.object3D.transform.x = orthographicSize * this.camera.aspect + 120
      }
      this.object3D.transform.y = getRandomNum(-window.innerHeight / 2, window.innerHeight / 2);
  
      // Reset speed
      this._speed = getRandomNum(-500, -200) * 0.0005;
    }
  }
  
  function getRandomNum(min: number, max: number): number {
    const range = max - min;
    const rand = Math.random();
    return min + Math.round(rand * range);
  }

  new Sample_TextBarrage().run()