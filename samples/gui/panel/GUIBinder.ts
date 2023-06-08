import { Object3D, CEvent, CEventDispatcher } from "@orillusion/core";
import { GUIPanelPOI } from "./GUIPanelPOI";

export class GUIPanelBinder {
    objUI: Object3D;
    panel: GUIPanelPOI;
    ball: Object3D;

    constructor(ball: Object3D, ui: Object3D, index: number) {
        this.ball = ball;
        this.objUI = ui;
        this.objUI.name = 'panel ' + index;
        this.objUI.scaleX = this.objUI.scaleY = this.objUI.scaleZ = 0.1;
        this.panel = new GUIPanelPOI(this.objUI, index);
    }

    update(delta: number) {
        this.objUI.localPosition = this.ball.transform.worldPosition;
        this.panel.update(delta);
    }
}

export let sampleUIPanelClick: CEvent = new CEvent('ClickUIPanel');
export let sampleUIPanelDispatcher: CEventDispatcher = new CEventDispatcher();
