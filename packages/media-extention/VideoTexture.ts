import { Texture, webGPUContext } from "@orillusion/core";

/**
 * Video Texture
 * @group Texture
 */
export class VideoTexture extends Texture {
    public media: HTMLVideoElement;
    private external: boolean = false;
    private _des: GPUExternalTextureDescriptor;
    constructor() {
        super();
        this.useMipmap = false;
        this.isVideoTexture = true;
        this.samplerBindingLayout = null;
    }

    /**
     * load one Video Source
     * @param video the url of a video source, or a MediaStream object, or a HTMLVideoElement
     */
    public async load(video: string | MediaStream | HTMLVideoElement) {
        let media: HTMLVideoElement, old: HTMLVideoElement
        if (this.media && !this.external)
            old = this.media

        if (typeof video === 'string') {
            media = this.createVideo()
            media.src = video
        } else if (video.constructor.name === 'MediaStream') {
            media = this.createVideo()
            media.srcObject = video as MediaStream
        } else if (video.constructor.name === 'HTMLVideoElement') {
            this.external = true
            media = video as HTMLVideoElement
        } else
            throw new Error('no video or src provided')

        await media.play()
        this.media = media
        this._des = {
            source: this.media
        }
        if (old) {
            old.pause()
            old.src = old.srcObject = null
            old.load()
        }
    }

    public getGPUTexture() {
        return null;
    }

    protected updateGPUTexture() {}

    private videoTexture: GPUExternalTexture;
    public getGPUView() {
        this.samplerBindingLayout = null;
        this.videoTexture = webGPUContext.device.importExternalTexture(this._des)
        this.noticeChange()
        return this.videoTexture
    }

    protected noticeChange() {
        this.gpuSampler = webGPUContext.device.createSampler(this);
        this._stateChangeRef.forEach((v, k) => {
            v();
        });
    }

    private createVideo() {
        let video = document.createElement(`video`) as HTMLVideoElement;
        video.controls = false;
        video.autoplay = false;
        video.muted = true;
        video.loop = true;
        video.playsInline = true
        video.crossOrigin = ''
        return video
    }
}