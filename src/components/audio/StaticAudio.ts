import { ComponentBase } from '../ComponentBase';
import { AudioListener } from './AudioListener';
/**
 * Static audio component, volume level does not vary depending on the position of the monitor
 * @internal
 * @group Audio
 */
export class StaticAudio extends ComponentBase {
    private listener: AudioListener | null = null;
    public context: AudioContext | null = null;
    public gainNode: GainNode | null = null;
    public source: AudioBufferSourceNode | null = null
    private _options = {
        loop: true,
        volume: 1,
    };
    public playing = false;
    private _currentTime: number = 0;
    private _buffer: AudioBuffer | null = null
    constructor() {
        super();
    }
    public setLister(listener: AudioListener): this {
        this.listener = listener;
        this.context = listener.context as AudioContext;
        this.gainNode = this.context.createGain();
        this.gainNode.connect(this.listener.gain);

        this.context.addEventListener('statechange', () => {
            if (this.context?.state === 'closed') {
                console.warn('AudioListener removed');
                this.stop();
                this.gainNode?.disconnect();
                this.listener = null;
                this.context = null;
                this.gainNode = null;
            }
        })
        return this;
    }
    async load(url: string, options: {} = {}) {
        Object.assign(this._options, options);
        let req = await fetch(url);
        let buffer = await req.arrayBuffer();
        this._buffer = await this.context?.decodeAudioData(buffer) as AudioBuffer;
    }
    async loadBuffer(buffer: ArrayBuffer, options: {} = {}) {
        Object.assign(this._options, options);
        this._buffer = await this.context?.decodeAudioData(buffer) as AudioBuffer;
    }
    // loadAudio(mediaElement: HTMLAudioElement) {
    //     this.element = mediaElement;
    //     this.source = this.context.createMediaElementSource(mediaElement);
    //     this.connect();
    // }
    public play(): this {
        if (!this.context) {
            console.warn('no audio source yet');
            return this;
        }
        if (this.playing) {
            console.warn('Audio is alredy playing');
            return this;
        }
        if (!this._buffer) {
            console.warn('Audio is not ready');
            return this;
        }
        const source = this.context.createBufferSource();
        source.buffer = this._buffer;
        source.loop = this._options.loop;
        this.source = source;
        this.connect();
        this.source.start(0, this._currentTime);
        this.setVolume(this._options.volume);
        this.playing = true;
        return this;
    }
    public pause(): this {
        if (!this.playing) {
            console.warn('Audio is not playing');
            return this;
        }
        this._currentTime = this.context?.currentTime || 0;
        this.source?.stop();
        this.source?.disconnect();
        this.playing = false;
        return this;
    }
    public stop(): this {
        this.pause();
        this._currentTime = 0;
        return this;
    }
    public setVolume(value: number): this {
        if (!this.context) {
            console.warn('no audio source yet');
            return this;
        }
        this.gainNode?.gain.setTargetAtTime(value, this.context ? this.context.currentTime : 0, 0.01);
        return this;
    }
    protected connect() {
        this.source?.connect(this.gainNode as GainNode);
    }
    public onUpdate() {
        super.onUpdate();
    }
    public destroy() {
        this.stop();
        this.gainNode?.disconnect();
        super.destroy();
    }
}
