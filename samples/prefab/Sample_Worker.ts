import { WasmMatrix } from "@orillusion/wasm-matrix/WasmMatrix";
import { Matrix4 } from "../../src/math/Matrix4";
import { webGPUContext } from "../../src/gfx/graphics/webGpu/Context3D";

export class Sample_Worker {

    private canvas: HTMLCanvasElement;
    constructor() {

    }

    async run() {
        await WasmMatrix.init(Matrix4.allocCount);



        this.canvas = document.createElement('canvas');
        // this.canvas.style.position = 'fixed';
        this.canvas.style.position = `absolute`;
        this.canvas.style.top = '0px';
        this.canvas.style.left = '0px';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        document.body.appendChild(this.canvas);

        const adapter = await navigator.gpu.requestAdapter();
        const device = await adapter.requestDevice();
        const context = this.canvas.getContext('webgpu');
        console.log("adapter", adapter);
        console.log("device", device);
        console.log("canvas", context);

        const worker = new Worker(new URL('./worker/Worker.ts', import.meta.url));
        worker.addEventListener('message', (ev) => {
            switch (ev.data.type) {
                case 'log': {
                    console.log(ev.data.message);
                    break;
                }
                default: {
                    console.error(`Unknown Message Type: ${ev.data.type}`);
                }
            }
        });

        try {
            const offscreenCanvas = this.canvas.transferControlToOffscreen();
            const devicePixelRatio = window.devicePixelRatio || 1;
            offscreenCanvas.width = this.canvas.clientWidth * devicePixelRatio;
            offscreenCanvas.height = this.canvas.clientHeight * devicePixelRatio;

            worker.postMessage({ type: 'init', offscreenCanvas }, [offscreenCanvas]);
        } catch (err) {
            console.warn(err.message);
            worker.terminate();
        }
    }
}