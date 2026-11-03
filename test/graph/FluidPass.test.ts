import { test, end, expect, delay } from '../util'
import { Engine3D, Scene3D, View3D, Camera3D, Object3D, FluidRenderer, FluidPass, FluidDebug, FluidDepthFilter, FluidThicknessMode } from '@orillusion/core'

async function createView(render: any, canvas?: HTMLCanvasElement) {
    const engine = await Engine3D.init({ setting: { render }, ...(canvas ? { canvasConfig: { canvas, devicePixelRatio: 1 } } : {}) })
    const scene = new Scene3D()
    const cameraObj = new Object3D()
    const camera = cameraObj.addComponent(Camera3D)
    camera.perspective(60, engine.aspect, 0.1, 100)
    cameraObj.z = -5
    scene.addChild(cameraObj)
    const view = new View3D()
    view.scene = scene
    view.camera = camera
    engine.startRenderView(view)
    return { engine, scene, view }
}

function compiledOrder(view: View3D): string[] {
    return (view.renderGraph as any)._compiled as string[]
}

await test('FluidPass is absent unless setting.render.fluid is on', async () => {
    const { engine, view } = await createView({})
    expect(view.renderGraph!.getPass('FluidPass') == null).toEqual(true)
    engine.dispose()
})

await test('FluidPass runs after the opaque half and before transparents', async () => {
    const { engine, view } = await createView({ fluid: true, decals: true })
    expect(view.renderGraph!.getPass('FluidPass') instanceof FluidPass).toEqual(true)
    const order = compiledOrder(view)
    const at = (name: string) => order.indexOf(name)
    expect(at('FluidPass') > at('TransmissionOpaquePass')).toEqual(true)
    expect(at('FluidPass') > at('DecalShadowVolumePass')).toEqual(true)
    expect(at('FluidPass') < at('SortedTransparentPass')).toEqual(true)
    engine.dispose()
})

await test('FluidRenderer renders CPU particles without errors', async () => {
    const { engine, scene } = await createView({ fluid: true })
    const obj = new Object3D()
    const fluid = obj.addComponent(FluidRenderer)
    const data = new Float32Array(64 * 4)
    for (let i = 0; i < 64; i++) data.set([(i % 4) * 0.2, Math.floor(i / 16) * 0.2, (Math.floor(i / 4) % 4) * 0.2, 1], i * 4)
    fluid.setDataBuffer(data)
    scene.addChild(obj)
    expect(fluid.particleCount).toEqual(64)
    await delay(250)
    data[0] = 1
    fluid.setDataBuffer(data, 32)
    expect(fluid.particleCount).toEqual(32)
    await delay(100)
    // Reduced-size maps, divided blur targets and every debug view.
    fluid.depthMapSize = 256
    fluid.thicknessMapSize = 128
    fluid.blurDepthSizeDivisor = 2
    fluid.blurThicknessSizeDivisor = 2
    fluid.debug = true
    for (const mode of [FluidDebug.DepthTexture, FluidDebug.ThicknessTexture, FluidDebug.ThicknessBlurredTexture, FluidDebug.Normals]) {
        fluid.debugFeature = mode
        await delay(50)
    }
    engine.dispose()
})

await test('FluidPass composites with fixed thickness, no environment, stencil depth and log depth', async () => {
    for (const render of [{ fluid: true, useStencil: true, zPrePass: false }, { fluid: true, useLogDepth: true }]) {
        const { engine, scene } = await createView(render)
        const obj = new Object3D()
        const fluid = obj.addComponent(FluidRenderer)
        const data = new Float32Array(27 * 4)
        for (let i = 0; i < 27; i++) data.set([(i % 3) * 0.1, Math.floor(i / 9) * 0.1, (Math.floor(i / 3) % 3) * 0.1, 1], i * 4)
        fluid.setDataBuffer(data)
        scene.addChild(obj)
        await delay(150)
        fluid.useFixedThickness = true
        fluid.minimumThickness = 0.5
        fluid.environmentMap = null
        await delay(150)
        engine.dispose()
    }
})

await test('FluidPass renders anisotropic ellipsoids with the narrow-range filter', async () => {
    const { engine, scene } = await createView({ fluid: true })
    const obj = new Object3D()
    const fluid = obj.addComponent(FluidRenderer)
    // A thin 12 x 12 x 2 slab: interior particles become flat ellipsoids, corner ones stay near spheres.
    const n = 12 * 12 * 2
    const data = new Float32Array(n * 4)
    for (let i = 0; i < n; i++) data.set([(i % 12) * 0.05, Math.floor(i / 144) * 0.05, (Math.floor(i / 12) % 12) * 0.05, 1], i * 4)
    fluid.setDataBuffer(data)
    fluid.depthFilter = FluidDepthFilter.NarrowRange
    fluid.useAnisotropy = true
    fluid.edgeSoftness = 5
    scene.addChild(obj)
    await delay(200)
    // More particles than the first allocation regrows the neighbor-search buffers.
    const more = new Float32Array(n * 8)
    more.set(data)
    for (let i = n; i < 2 * n; i++) more.set([data[(i - n) * 4], 0.1 + data[(i - n) * 4 + 1], data[(i - n) * 4 + 2], 1], i * 4)
    fluid.setDataBuffer(more)
    fluid.debug = true
    fluid.debugFeature = FluidDebug.Normals
    await delay(200)
    // Geometric thickness: back-depth stage on the ellipsoids, then far - near.
    fluid.debug = false
    fluid.thicknessMode = FluidThicknessMode.Geometric
    await delay(150)
    fluid.thicknessMode = '0' as any
    expect(fluid.thicknessMode === FluidThicknessMode.Accumulated).toEqual(true)
    fluid.useAnisotropy = false
    fluid.thicknessMode = FluidThicknessMode.Geometric
    await delay(150)
    fluid.depthFilter = '0' as any
    expect(fluid.depthFilter === FluidDepthFilter.Bilateral).toEqual(true)
    await delay(100)
    engine.dispose()
})

await test('FluidPass runs in two engines at once', async () => {
    const instances = []
    for (let k = 0; k < 2; k++) {
        const canvas = document.createElement('canvas')
        canvas.width = 160
        canvas.height = 120
        document.body.appendChild(canvas)
        const inst = await createView({ fluid: true }, canvas)
        const obj = new Object3D()
        const fluid = obj.addComponent(FluidRenderer)
        fluid.setDataBuffer(new Float32Array([0, 0, 0, 1, 0.1, 0, 0, 1, 0, 0.1, 0, 1]))
        inst.scene.addChild(obj)
        instances.push({ ...inst, canvas })
    }
    await delay(250)
    for (const { engine, canvas } of instances) {
        engine.dispose()
        canvas.remove()
    }
})

await test('FluidRenderer data layout', async () => {
    const fluid = new FluidRenderer()
    fluid.setDataBuffer(new Float32Array(30), undefined, { stride: 12 })
    expect(fluid.particleCount).toEqual(10)
    fluid.setDataBuffer(new Float32Array(32), undefined, { stride: 32, positionOffset: 16 })
    expect(fluid.particleCount).toEqual(4)
    let threw = false
    try { fluid.setDataBuffer(new Float32Array(8), undefined, { stride: 16, positionOffset: 8 }) } catch { threw = true }
    expect(threw).toEqual(true)
})

await test('FluidRenderer.debugFeature accepts GUI string values', async () => {
    const fluid = new FluidRenderer()
    fluid.debugFeature = '4' as any
    expect(fluid.debugFeature === FluidDebug.Normals).toEqual(true)
})

setTimeout(end, 500)
