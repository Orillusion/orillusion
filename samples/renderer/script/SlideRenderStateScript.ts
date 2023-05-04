import { ComponentBase, Engine3D, KeyEvent, KeyCode, RTResourceMap, RTResourceConfig } from "@orillusion/core";

enum RenderState {
    Cancel = 'Cancel',
    Lighting = 'Lighting',
    GI = 'GI',
    SSAO = 'SSAO',
    Normal = 'Normal',
    Diffuse = 'Diffuse',
}

enum SlideState {
    None,
    ADD,
    Reduce,
}

export class SlideRenderStateScript extends ComponentBase {
    private renderState: string;
    private currentSlide: number = 0;
    private slideState: SlideState = SlideState.None;

    private allStates: string[];

    constructor() {
        super();
        this.allStates = [RenderState.Cancel, RenderState.Diffuse, RenderState.Lighting, RenderState.GI, RenderState.SSAO, RenderState.Normal];
        Engine3D.inputSystem.addEventListener(KeyEvent.KEY_DOWN, this.keyDown, this);
    }

    private keyDown(e: KeyEvent) {
        let index = -1;
        switch (e.keyCode) {
            case KeyCode.Key_0:
                index = 0;
                break;
            case KeyCode.Key_1:
                index = 1;
                break;
            case KeyCode.Key_2:
                index = 2;
                break;
            case KeyCode.Key_3:
                index = 3;
                break;
            case KeyCode.Key_4:
                index = 4;
                break;
            case KeyCode.Key_5:
                index = 5;
                break;
        }
        if (index >= 0) {
            this.changeRenderState(this.allStates[index]);
        }
    }

    start(): void {
        this.initGUI();

    }

    private initGUI(): void {
    }

    private changeRenderState(value: string): void {
        if (this.renderState == value) return;
        this.renderState = value;
        let slideEnable = true;
        switch (this.renderState) {
            case RenderState.Lighting:
                Engine3D.setting.render.renderState_right = 5;
                Engine3D.setting.render.renderState_left = 1;
                break;
            case RenderState.GI:
                Engine3D.setting.render.renderState_right = 5;
                Engine3D.setting.render.renderState_left = 3;
                break;
            case RenderState.SSAO:
                Engine3D.setting.render.renderState_right = 5;
                Engine3D.setting.render.renderState_left = 8;
                break;
            case RenderState.Normal:
                Engine3D.setting.render.renderState_right = 5;
                Engine3D.setting.render.renderState_left = 2;
                break;
            case RenderState.Diffuse:
                Engine3D.setting.render.renderState_right = 5;
                Engine3D.setting.render.renderState_left = 11;
                break;
            default:
                slideEnable = false;
                break;
        }

        if (!slideEnable) this.slideState = SlideState.None;
        else if (this.slideState == SlideState.None) {
            this.slideState = SlideState.ADD;
        }
    }

    onUpdate(): void {
        let texture = RTResourceMap.getTexture(RTResourceConfig.colorBufferTex_NAME);
        let maxWidth = texture ? texture.width : 2048;
        let speed = maxWidth * 0.005;
        if (this.slideState == SlideState.ADD) {
            this.currentSlide += speed;
            if (this.currentSlide > maxWidth * 0.9) {
                this.slideState = SlideState.Reduce;
            }
        } else if (this.slideState == SlideState.Reduce) {
            this.currentSlide -= speed;
            if (this.currentSlide <= maxWidth * 0.1) {
                this.slideState = SlideState.ADD;
            }
        }

        Engine3D.setting.render.renderState_split = this.slideState == SlideState.None ? 9999 : this.currentSlide;
    }
}
