// The worker process can instantiate a WebGPU device immediately, but it still needs an
// OffscreenCanvas to be able to display anything. Here we listen for an 'init' message from the
// main thread that will contain an OffscreenCanvas transferred from the page, and use that as the
// signal to begin WebGPU initialization.
self.addEventListener('message', (ev) => {
    switch (ev.data.type) {
        case 'init': {
            try {
                init(ev.data.offscreenCanvas);
            } catch (err) {
                self.postMessage({
                    type: 'log',
                    message: `Error while initializing WebGPU in worker process: ${err.message}`,
                });
            }
            break;
        }
    }
});

// Once we receive the OffscreenCanvas this init() function is called, which functions similarly
// to the init() method for all the other samples. The remainder of this file is largely identical
// to the rotatingCube sample.
async function init(canvas) {
    console.log("worker init");

    const adapter = await navigator.gpu.requestAdapter();
    const device = await adapter.requestDevice();
    const context = canvas.getContext('webgpu');
    console.log("adapter", adapter);
    console.log("device", device);

    const presentationFormat = navigator.gpu.getPreferredCanvasFormat();

    context.configure({
        device,
        format: presentationFormat,
        alphaMode: 'premultiplied',
    });
}
