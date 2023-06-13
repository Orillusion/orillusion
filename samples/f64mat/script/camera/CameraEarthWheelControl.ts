import { HoverCameraController } from "@orillusion/core";

export class CameraEarthWheelControl {
    private _controller: HoverCameraController;
    private _maxRadius: number;
    private _minRadius: number;
    wheelStep: number;
    constructor(Control:HoverCameraController) {
        this._maxRadius = 10378137;
        this._minRadius = 6356752.314245;
        this._controller = Control;
        this.wheelStep = 0;
    }
    getTypeName() {
      return null
    }
    getClassName() {
      return "CameraEarthWheelControl"
    }
    getSimpleName() {
      return "earthmousewheel"
    }
    computeDeltaFromMouseWheelLegacyEvent(wheelDelta:number,distance:number) {
        let i = 0;
        const n = .01 * wheelDelta * this.wheelStep * distance;
        return i = wheelDelta > 0 ? n / (1 + this.wheelStep) : n * (1 + this.wheelStep),
          i
    }
    attachControl() {
        

    }
    detachControl() {

    }
    checkInputs() {

    }
  }