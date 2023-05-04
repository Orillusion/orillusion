import { ComponentBase } from '../ComponentBase';

/**
 * Audio Listener
 * Used in conjunction {@link PositionAudio} or {@link StaticAudio}
 * @internal
 * @group Audio
 */
export class AudioListener extends ComponentBase {
    public readonly context: AudioContext;
    public readonly gain: GainNode;
    constructor() {
        super();
        this.context = new AudioContext();
        this.gain = this.context.createGain();
        this.gain.connect(this.context.destination);
    }
    public start() {

    }
    public onUpdate() {
        if (!this.context) {
            return;
        }
        const listener = this.context.listener;
        const _position = this.object3D.transform.worldPosition;
        const _orientation = this.object3D.transform.forward;
        const up = this.object3D.transform.up;
        if (isNaN(_orientation.x)) {
            return;
        }
        if (listener.positionX) {
            const endTime = this.context.currentTime;
            listener.positionX.linearRampToValueAtTime(_position.x, endTime);
            listener.positionY.linearRampToValueAtTime(_position.y, endTime);
            listener.positionZ.linearRampToValueAtTime(_position.z, endTime);
            listener.forwardX.linearRampToValueAtTime(_orientation.x, endTime);
            listener.forwardY.linearRampToValueAtTime(_orientation.y, endTime);
            listener.forwardZ.linearRampToValueAtTime(_orientation.z, endTime);
            listener.upX.linearRampToValueAtTime(up.x, endTime);
            listener.upY.linearRampToValueAtTime(up.y, endTime);
            listener.upZ.linearRampToValueAtTime(up.z, endTime);
        } else {
            listener.setPosition(_position.x, _position.y, _position.z);
            listener.setOrientation(_orientation.x, _orientation.y, _orientation.z, up.x, up.y, up.z);
        }
    }

    destroy() {
        this.gain.disconnect();
        this.context.close();
        super.destroy();
    }
}
