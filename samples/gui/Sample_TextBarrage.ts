import { Engine3D, Scene3D, CameraUtil, HoverCameraController, Object3D, MeshRenderer, View3D, PlaneGeometry, UnLitMaterial, Color, Vector3, PointerEvent3D, Camera3D, SphereGeometry, CylinderGeometry, MathUtil, BlendMode, GPUCullMode, ViewPanel, UITextField, TextAnchor, ComponentBase, BoundUtil, WorldPanel, UIPanel, AtmosphericComponent } from '@orillusion/core';

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

        // add an Atmospheric sky enviroment
        let sky = scene.addComponent(AtmosphericComponent);
        sky.sunY = 0.6

        // init camera3D
        let mainCamera = CameraUtil.createCamera3D(null, scene);
        mainCamera.perspective(60, Engine3D.aspect, 1, 2000.0);
        this.camera = mainCamera

        // add a basic camera controller
        const hoverCameraController = mainCamera.object3D.addComponent(HoverCameraController);
        hoverCameraController.setCamera(0, 0, 20)

        // create a view with target scene and camera
        let view = new View3D();
        view.scene = scene;
        view.camera = mainCamera;

        // create UIpanel root
        let panelRoot: Object3D = new Object3D()
        const panel = panelRoot.addComponent(ViewPanel, {billboard: true});
        // add to UIcanvas
        let canvas = view.enableUICanvas()
        canvas.addChild(panel.object3D)

        // Create text barrage
        const textCount = 50;
        for (let i = 0; i < textCount; ++i) {
            const textQuad = new Object3D();
            panelRoot.addChild(textQuad);
            const text = textQuad.addComponent(UITextField);
            text.color = new Color(1, 1, 1)
            text.fontSize = 32
            text.alignment = TextAnchor.MiddleCenter
            text.uiTransform.resize(150 * window.devicePixelRatio, 12)

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
      this._text = this.object3D.getComponent(UITextField);
      this._range = - Engine3D.width * 0.5
      this.lastTime = Date.now();
      this._reset(true);
    }
  
    onUpdate(): void {
      if (this._isPlaying) {
        const now = Date.now()
        const dt = (now - this.lastTime)
        this.lastTime = now
        this._text.uiTransform.x += this._speed * dt;
        if (this._text.uiTransform.x + 300 < this._range) {
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
  
      const halfWidth = Engine3D.width * 0.5
      const halfHeight = Engine3D.height * 0.5
      // Reset position
      if (isFirst) {
        this._text.uiTransform.x = getRandomNum(-halfWidth, halfWidth);
      } else {
        this._text.uiTransform.x = halfWidth + 150 * window.devicePixelRatio / 2
      }
      this._text.uiTransform.y = getRandomNum(-halfHeight, halfHeight);
  
      // Reset speed
      this._speed = getRandomNum(-500, -200) * 0.0003;
    }
  }
  
  function getRandomNum(min: number, max: number): number {
    const range = max - min;
    const rand = Math.random();
    return min + Math.round(rand * range);
  }

  new Sample_TextBarrage().run()