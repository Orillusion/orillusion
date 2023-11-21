import { Engine3D, Scene3D, CameraUtil, HoverCameraController, Object3D, View3D, Color, Camera3D, ViewPanel, UITextField, TextAnchor, ComponentBase, AtmosphericComponent, webGPUContext, CResizeEvent } from "@orillusion/core";

class Sample_TextBarrage {
    private scene: Scene3D;
    private camera: Camera3D;

    async run() {
        // init engine
        await Engine3D.init();
        // create new Scene
        let scene = new Scene3D();
        this.scene = scene;

        // load base font
        await Engine3D.res.loadFont("https://cdn.orillusion.com/fnt/0.fnt");

        // add an Atmospheric sky enviroment
        let sky = scene.addComponent(AtmosphericComponent);
        sky.sunY = 0.6;

        // init camera3D
        let mainCamera = CameraUtil.createCamera3D(null, scene);
        mainCamera.perspective(60, Engine3D.aspect, 1, 2000.0);
        this.camera = mainCamera;

        // add a basic camera controller
        const hoverCameraController = mainCamera.object3D.addComponent(HoverCameraController);
        hoverCameraController.setCamera(0, 0, 20);

        // create a view with target scene and camera
        let view = new View3D();
        view.scene = scene;
        view.camera = mainCamera;

        // create UIpanel root
        let panelRoot: Object3D = new Object3D();
        const panel = panelRoot.addComponent(ViewPanel);
        // resize panel radio
        webGPUContext.addEventListener(CResizeEvent.RESIZE, () => panel.uiTransform.resize(Engine3D.width, Engine3D.height), this);

        // add to UIcanvas
        let canvas = view.enableUICanvas();
        canvas.addChild(panel.object3D);

        // Create text barrage
        const textCount = 100;
        for (let i = 0; i < textCount; ++i) {
            const textQuad = new Object3D();
            panelRoot.addChild(textQuad);
            const text = textQuad.addComponent(UITextField);
            text.color = new Color(1, 1, 1);
            text.fontSize = 32;
            text.alignment = TextAnchor.MiddleCenter;
            text.uiTransform.resize(300, 12);

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
    static colors = new Array(10).fill(1).map(() => Color.random());

    public camera: Camera3D;
    public priorityOffset: number = 0;

    private _speed: number = 0;
    private _isPlaying: boolean = false;
    private _text: UITextField;
    private lastTime: number = 0;

    play() {
        this._isPlaying = true;
    }

    start(): void {
        this._text = this.object3D.getComponent(UITextField);
        this.lastTime = Date.now();
        this._reset(true);
    }

    onUpdate(): void {
        if (this._isPlaying) {
            const now = Date.now();
            const dt = now - this.lastTime;
            this.lastTime = now;
            let halfWidth = Engine3D.width * 0.5,
                halfHeight = Engine3D.height * 0.5;
            let { x, y, width, height } = this._text.uiTransform;

            // move text to left
            this._text.uiTransform.x += this._speed * dt;
            // reset text position after pass the left side of the screen
            if (x < -halfWidth - width) {
                this._reset(false);
            }
            // limit y position in view port
            if (y < -halfHeight + height) this._text.uiTransform.y = -halfHeight + height;
            else if (y > halfHeight - height) this._text.uiTransform.y = halfHeight - height;
        }
    }

    private _reset(isFirst: boolean) {
        const text = this._text;
        const { words, colors } = TextBarrageAnimation;

        // Reset the text to render
        const wordLastIndex = words.length - 1;
        text.text = `${words[getRandomNum(0, wordLastIndex)]} ${words[getRandomNum(0, wordLastIndex)]}`;
        // Reset color
        text.color = colors[getRandomNum(0, colors.length - 1)];
        const halfWidth = Engine3D.width * 0.5;
        const halfHeight = Engine3D.height * 0.5;
        // Reset position
        this._text.uiTransform.x = isFirst ? getRandomNum(halfWidth, halfWidth * 3) : halfWidth + this._text.uiTransform.width;
        this._text.uiTransform.y = getRandomNum(-halfHeight + this._text.uiTransform.height, halfHeight - this._text.uiTransform.height);
        // Reset speed
        this._speed = getRandomNum(-500, -200) * 0.0003;
    }
}

/**
 * Get a random number between min and max
 * @param min
 * @param max
 */
function getRandomNum(min: number, max: number): number {
    const range = max - min;
    const rand = Math.random();
    return min + Math.round(rand * range);
}

new Sample_TextBarrage().run();
