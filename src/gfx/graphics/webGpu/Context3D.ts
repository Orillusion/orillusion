import { CanvasConfig } from './CanvasConfig';
/**
 * @internal
 */
class Context3D {
    public adapter: GPUAdapter;
    public device: GPUDevice;
    public context: GPUCanvasContext;
    public aspect: number;
    public presentationSize: number[] = [0, 0];
    public presentationFormat: GPUTextureFormat;
    public canvas: HTMLCanvasElement;
    public windowWidth: number;
    public windowHeight: number;
    public canvasConfig: CanvasConfig;
    public super: number = 1.0;
    // initSize: number[];
    public get pixelRatio() {
        return this.canvasConfig?.devicePixelRatio || window.devicePixelRatio || 1
    }
    /**
     * Configure canvas by CanvasConfig
     * @param canvasConfig
     * @returns
     */
    async init(canvasConfig?: CanvasConfig): Promise<boolean> {
        this.canvasConfig = canvasConfig;
        if (canvasConfig && canvasConfig.canvas) {
            this.canvas = canvasConfig.canvas;
            if (this.canvas === null)
                throw new Error('no Canvas')
            
            // check if external canvas has initial with and height style
            const _width = this.canvas.clientWidth, _height = this.canvas.clientHeight
            this.resize(this.canvas.clientWidth, this.canvas.clientHeight)
            // set a initial style if size changed
            if(_width != this.canvas.clientWidth)
                this.canvas.style.width = _width + 'px'
            if(_height != this.canvas.clientHeight)
                this.canvas.style.width = _height + 'px'
        } else {
            this.canvas = document.createElement('canvas');
            // this.canvas.style.position = 'fixed';
            this.canvas.style.position = `absolute`;
            this.canvas.style.top = '0px';
            this.canvas.style.left = '0px';
            this.canvas.style.width = '100%';
            this.canvas.style.height = '100%';
            this.canvas.style.zIndex = canvasConfig?.zIndex ? canvasConfig.zIndex.toString() : '0';
            document.body.appendChild(this.canvas);
        }
        // set canvas bg
        if (canvasConfig && canvasConfig.backgroundImage) {
            this.canvas.style.background = `url(${canvasConfig.backgroundImage})`
            this.canvas.style['background-size'] = 'cover'
            this.canvas.style['background-position'] = 'center'
        } else
            this.canvas.style.background = 'transparent';
        // prevent touch scroll
        this.canvas.style['touch-action'] = 'none'
        this.canvas.style['object-fit'] = 'cover'

        // check webgpu support
        if (navigator.gpu === undefined) {
            throw new Error( `Your browser is not support webgpu!` );
        }
        // request adapter
        this.adapter = await navigator.gpu.requestAdapter({
            powerPreference: 'high-performance',
            // powerPreference: 'low-power',
        });
        if (this.adapter == null) {
            throw new Error( `Your browser is not support webgpu!` );
        }
        // request device
        this.device = await this.adapter.requestDevice({
            //requiredFeatures: [`texture-compression-bc`],
            requiredLimits: {
                minUniformBufferOffsetAlignment: 256,
                maxStorageBufferBindingSize: this.adapter.limits.maxStorageBufferBindingSize
            }
        });
        if (this.device == null) {
            throw new Error( `Your browser is not support webgpu!` );
        }

        // configure webgpu context
        this.device.label = 'device';
        this.presentationFormat = navigator.gpu.getPreferredCanvasFormat();
        this.context = this.canvas.getContext('webgpu');
        this.context.configure({
            device: this.device,
            format: this.presentationFormat,
            usage: GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
            alphaMode: 'premultiplied',
            colorSpace: `display-p3`
        });

        // resize canvas size, aspect
        this.resize(this.canvas.clientWidth, this.canvas.clientHeight)
        let timer: any
        const resizeObserver = new ResizeObserver(() => {
            clearTimeout(timer)
            timer = setTimeout(() => {
                this.resize(this.canvas.clientWidth, this.canvas.clientHeight)
            }, 50)
        });
        resizeObserver.observe(this.canvas);
        return true;
    }

    public resize(width: number, height: number) {
        this.canvas.width = this.windowWidth = Math.floor(width * this.pixelRatio * this.super)
        this.canvas.height = this.windowHeight = Math.floor(height * this.pixelRatio * this.super)
        this.presentationSize[0] = this.windowWidth;
        this.presentationSize[1] = this.windowHeight;
        this.aspect = this.windowWidth / this.windowHeight;
    }
}

/**
 * @internal
 */
export let webGPUContext = new Context3D();
