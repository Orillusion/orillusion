import { test, end, expect, delay, waitUntil } from '../util'
import { Engine3D, Scene3D, View3D, Camera3D, Object3D, WaterRenderer, WaterMaterial, Vector2, Vector3, DirectLight, GeometryBase, VertexAttributeName, WaterSpectrum, Time } from '@orillusion/core'

/** Height (g) and Jacobian-related stats of an rgba16float texture's channel, read back from the GPU. */
async function channelStats(engine: Engine3D, texture: any, channel: number) {
    const device = engine.context3D.device as GPUDevice
    const g = texture.getGPUTexture() as GPUTexture
    const bpr = Math.ceil(g.width * 8 / 256) * 256
    const buf = device.createBuffer({ size: bpr * g.height, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ })
    const enc = device.createCommandEncoder()
    enc.copyTextureToBuffer({ texture: g }, { buffer: buf, bytesPerRow: bpr }, [g.width, g.height, 1])
    device.queue.submit([enc.finish()])
    await buf.mapAsync(GPUMapMode.READ)
    const u16 = new Uint16Array(buf.getMappedRange().slice(0))
    buf.unmap()
    buf.destroy()
    const half = (h: number) => {
        const e = (h >> 10) & 31, m = h & 1023
        const v = e === 0 ? m / 1024 * 2 ** -14 : (1 + m / 1024) * 2 ** (e - 15)
        return h >> 15 ? -v : v
    }
    let sum = 0, sq = 0, n = 0
    for (let y = 0; y < g.height; y++) {
        for (let x = 0; x < g.width; x++) {
            const v = half(u16[(y * bpr) / 2 + x * 4 + channel])
            sum += v
            sq += v * v
            n++
        }
    }
    const mean = sum / n
    return { mean, rms: Math.sqrt(sq / n - mean * mean) }
}

/** Waits for `count` whole frames begun after the call; a frame is done once the next one starts. Frames with the FFT take seconds under software rendering. */
async function frames(count: number) {
    const until = Time.frame + count + 1
    await waitUntil(() => Time.frame >= until, 30000)
}

/** Flat disc in the xz plane: a center vertex and rings of segments. */
function discGeometry(radius: number, rings = 16, segments = 48) {
    const count = 1 + rings * segments
    const pos = new Float32Array(count * 3)
    const nor = new Float32Array(count * 3)
    const uv = new Float32Array(count * 2)
    nor[1] = 1
    for (let r = 1; r <= rings; r++) {
        for (let s = 0; s < segments; s++) {
            const i = 1 + (r - 1) * segments + s
            const a = s / segments * Math.PI * 2
            pos[i * 3] = Math.cos(a) * radius * r / rings
            pos[i * 3 + 2] = Math.sin(a) * radius * r / rings
            nor[i * 3 + 1] = 1
        }
    }
    const idx: number[] = []
    for (let s = 0; s < segments; s++) idx.push(0, 1 + (s + 1) % segments, 1 + s)
    for (let r = 1; r < rings; r++) {
        for (let s = 0; s < segments; s++) {
            const a = 1 + (r - 1) * segments + s
            const b = 1 + (r - 1) * segments + (s + 1) % segments
            idx.push(a, b, a + segments, b, b + segments, a + segments)
        }
    }
    const g = new GeometryBase()
    g.setIndices(new Uint16Array(idx))
    g.setAttribute(VertexAttributeName.position, pos)
    g.setAttribute(VertexAttributeName.normal, nor)
    g.setAttribute(VertexAttributeName.uv, uv)
    g.setAttribute(VertexAttributeName.TEXCOORD_1, uv)
    g.addSubGeometry({ indexStart: 0, indexCount: idx.length, vertexStart: 0, vertexCount: 0, firstStart: 0, index: 0, topology: 0 })
    return g
}

async function createView(render: any = {}) {
    const engine = await Engine3D.init({ setting: { render } })
    const scene = new Scene3D()
    const cameraObj = new Object3D()
    const camera = cameraObj.addComponent(Camera3D)
    camera.perspective(60, engine.aspect, 0.1, 200)
    cameraObj.y = 5
    cameraObj.z = -12
    cameraObj.rotationX = 20
    scene.addChild(cameraObj)
    const view = new View3D()
    view.scene = scene
    view.camera = camera
    engine.startRenderView(view)
    return { engine, scene, view, cameraObj }
}

await test('WaterRenderer renders and animates without errors', async () => {
    const { engine, scene } = await createView()
    const obj = new Object3D()
    obj.y = 1
    const water = obj.addComponent(WaterRenderer)
    water.width = 8
    water.length = 6
    water.resolution = 64
    scene.addChild(obj)
    expect(water.waterMaterial instanceof WaterMaterial).toEqual(true)
    expect(water.waterMaterial.transmissionFactor).toEqual(1)
    await delay(300)
    expect(water.time > 0).toEqual(true)
    water.timeScale = 0
    const t = water.time
    await delay(100)
    expect(water.time).toEqual(t)
    engine.dispose()
})

await test('setting.render.water adds SceneLinearDepthPass between the pyramid and transmission', async () => {
    const off = await createView()
    expect(off.view.renderGraph!.getPass('SceneLinearDepthPass') == null).toEqual(true)
    off.engine.dispose()

    const { engine, scene, view } = await createView({ water: true })
    const order = (view.renderGraph as any)._compiled as string[]
    const at = (name: string) => order.indexOf(name)
    expect(at('SceneLinearDepthPass') > at('SceneColorPyramidPass')).toEqual(true)
    expect(at('SceneLinearDepthPass') < at('TransmissionOpaquePass')).toEqual(true)
    expect(at('CausticsPass') > at('SkyPass')).toEqual(true)
    expect(at('CausticsPass') < at('SceneColorPyramidPass')).toEqual(true)
    expect(at('WaterSimulationPass') < at('CausticsPass')).toEqual(true)
    expect(at('WaterSimulationPass') < at('TransmissionOpaquePass')).toEqual(true)
    expect(at('UnderwaterPass') > at('SortedTransparentPass')).toEqual(true)
    expect(at('UnderwaterPass') < at('PostPass')).toEqual(true)
    const obj = new Object3D()
    obj.addComponent(WaterRenderer)
    scene.addChild(obj)
    await delay(300)
    engine.dispose()
})

await test('WaterRenderer.getHeight follows the Gerstner surface', async () => {
    const { engine, scene } = await createView()
    const obj = new Object3D()
    obj.y = 2
    const water = obj.addComponent(WaterRenderer)
    scene.addChild(obj)
    await delay(50)

    // Flat water: the surface is the owner's height.
    water.waves = []
    expect(Math.abs(water.getHeight(1.3, -0.7) - 2) < 1e-6).toEqual(true)

    // One wave: height stays within its amplitude, and moves with time.
    water.waves = [{ direction: new Vector2(1, 0), wavelength: 4, steepness: 0.3 }]
    const amplitude = 0.3 / (2 * Math.PI / 4)
    water.timeScale = 0
    water.time = 0
    let min = Infinity, max = -Infinity
    for (let x = -4; x <= 4; x += 0.1) {
        const h = water.getHeight(x, 0) - 2
        min = Math.min(min, h)
        max = Math.max(max, h)
    }
    expect(max <= amplitude + 1e-4 && min >= -amplitude - 1e-4).toEqual(true)
    expect(max - min > amplitude).toEqual(true)
    const h0 = water.getHeight(0.5, 0)
    water.time = 0.7
    expect(Math.abs(water.getHeight(0.5, 0) - h0) > 1e-3).toEqual(true)
    engine.dispose()
})

await test('WaterRenderer.isUnderwater checks the footprint and the surface', async () => {
    const { engine, scene } = await createView()
    const obj = new Object3D()
    obj.x = 10
    obj.y = 1
    const water = obj.addComponent(WaterRenderer)
    water.width = 4
    water.length = 2
    water.waves = []
    scene.addChild(obj)
    await delay(50)

    expect(water.containsXZ(11.9, 0.9)).toEqual(true)
    expect(water.containsXZ(12.1, 0)).toEqual(false)
    expect(water.containsXZ(10, -1.1)).toEqual(false)
    expect(water.isUnderwater(new Vector3(10, 0.9, 0))).toEqual(true)
    expect(water.isUnderwater(new Vector3(10, 1.1, 0))).toEqual(false)
    // Below the surface height but outside the footprint.
    expect(water.isUnderwater(new Vector3(0, 0, 0))).toEqual(false)
    expect(water.containsXZ(12.4, 0, 0.5)).toEqual(true)

    // Rotated a quarter turn and scaled: half extents are 4 * 2 / 2 along z and 2 * 3 / 2 along x.
    obj.rotationY = 90
    obj.scaleX = 2
    obj.scaleZ = 3
    expect(water.containsXZ(10, 3.9)).toEqual(true)
    expect(water.containsXZ(10, 4.1)).toEqual(false)
    expect(water.containsXZ(12.9, 0)).toEqual(true)
    expect(water.containsXZ(13.1, 0)).toEqual(false)
    expect(water.containsXZ(13.4, 0, 0.5)).toEqual(true)
    engine.dispose()
})

for (const extra of [{}, { msaa: 4 }, { useLogDepth: true }, { zPrePass: false }, { zPrePass: false, msaa: 4 }]) await test(`UnderwaterPass renders with the camera at and below the surface ${JSON.stringify(extra)}`, async () => {
    const { engine, scene, cameraObj } = await createView({ water: true, ...extra })
    const obj = new Object3D()
    const water = obj.addComponent(WaterRenderer)
    water.width = 30
    water.length = 30
    scene.addChild(obj)
    // A sun, so the caustics pass draws too.
    const sun = new Object3D()
    sun.rotationX = 50
    sun.addComponent(DirectLight)
    scene.addChild(sun)
    // A second, rotated surface overlapping the first.
    const obj2 = new Object3D()
    obj2.y = -0.5
    obj2.rotationY = 30
    const water2 = obj2.addComponent(WaterRenderer)
    water2.width = 10
    water2.length = 40
    scene.addChild(obj2)
    cameraObj.rotationX = 0
    for (const y of [0, -1]) {
        cameraObj.y = y
        await delay(150)
    }
    water.caustics = false
    water2.caustics = false
    await delay(100)
    expect(water.isUnderwater(new Vector3(0, -1, -12))).toEqual(true)
    engine.dispose()
})

await test('WaterRenderer.surfaceGeometry follows a custom outline', async () => {
    const { engine, scene } = await createView()
    const obj = new Object3D()
    obj.x = 10
    obj.y = 1
    const water = obj.addComponent(WaterRenderer)
    water.waves = []
    scene.addChild(obj)
    await delay(50)

    water.surfaceGeometry = discGeometry(3)
    expect(water.geometry === water.surfaceGeometry).toEqual(true)
    // Inside the disc; inside its bounding square but outside the disc.
    expect(water.containsXZ(12.5, 0)).toEqual(true)
    expect(water.containsXZ(12.5, 2.5)).toEqual(false)
    expect(water.containsXZ(13.2, 0)).toEqual(false)
    expect(water.containsXZ(13.2, 0, 0.5)).toEqual(true)
    expect(water.isUnderwater(new Vector3(10, 0.5, 1))).toEqual(true)
    expect(water.isUnderwater(new Vector3(12.5, 0.5, 2.5))).toEqual(false)
    // Rectangle settings no longer rebuild the mesh.
    water.width = 30
    expect(water.geometry === water.surfaceGeometry).toEqual(true)

    // Scaled along x and rotated a quarter turn: radius 6 along world z, still 3 along world x.
    obj.scaleX = 2
    obj.rotationY = 90
    expect(water.containsXZ(10, 5.5)).toEqual(true)
    expect(water.containsXZ(12.5, 0)).toEqual(true)
    expect(water.containsXZ(13.2, 0)).toEqual(false)

    water.surfaceGeometry = null
    expect(water.footprint == null).toEqual(true)
    expect(water.containsXZ(12.5, 2.5)).toEqual(true)
    engine.dispose()
})

for (const extra of [{}, { zPrePass: false, msaa: 4 }]) await test(`custom surface renders underwater and with caustics ${JSON.stringify(extra)}`, async () => {
    const { engine, scene, cameraObj } = await createView({ water: true, ...extra })
    const sun = new Object3D()
    sun.rotationX = 50
    sun.addComponent(DirectLight)
    scene.addChild(sun)
    const obj = new Object3D()
    obj.z = -10
    const water = obj.addComponent(WaterRenderer)
    water.surfaceGeometry = discGeometry(6, 24, 96)
    scene.addChild(obj)
    const floor = new Object3D()
    floor.y = -2
    floor.addComponent(WaterRenderer).waves = []
    scene.addChild(floor)
    cameraObj.rotationX = 0
    for (const y of [1, -1]) {
        cameraObj.y = y
        await delay(150)
    }
    expect(water.footprint!.triangleCount > 0).toEqual(true)
    engine.dispose()
})

await test('addRipple starts the ripple simulation; points off the water are ignored', async () => {
    const { engine, scene } = await createView({ water: true })
    const obj = new Object3D()
    const water = obj.addComponent(WaterRenderer)
    water.width = 8
    water.length = 6
    scene.addChild(obj)
    await delay(100)
    expect(water.hasRipples).toEqual(false)
    water.addRipple(20, 0)
    await delay(100)
    expect(water.hasRipples).toEqual(false)
    water.addRipple(1, 1, 0.1, 0.3)
    expect(await waitUntil(() => water.hasRipples)).toEqual(true)
    // A new footprint clears them; the next ripple starts a fresh simulation.
    water.width = 10
    expect(water.hasRipples).toEqual(false)
    engine.dispose()
})

for (const extra of [{}, { useLogDepth: true }, { zPrePass: false, msaa: 4 }]) await test(`ripples render on rectangle and custom surfaces ${JSON.stringify(extra)}`, async () => {
    const { engine, scene, cameraObj } = await createView({ water: true, ...extra })
    const sun = new Object3D()
    sun.rotationX = 50
    sun.addComponent(DirectLight)
    scene.addChild(sun)
    const rect = new Object3D()
    const water = rect.addComponent(WaterRenderer)
    water.width = 30
    water.length = 30
    scene.addChild(rect)
    const pond = new Object3D()
    pond.y = 0.5
    pond.z = 10
    const pondWater = pond.addComponent(WaterRenderer)
    pondWater.surfaceGeometry = discGeometry(4, 16, 64)
    scene.addChild(pond)
    for (let i = 0; i < 5; i++) {
        water.addRipple(i - 2, 0, 0.1, 0.3)
        pondWater.addRipple(0, 10 + i * 0.5, 0.1, 0.3)
        cameraObj.y = i % 2 ? -1 : 3
        await delay(80)
    }
    expect(water.hasRipples && pondWater.hasRipples).toEqual(true)
    engine.dispose()
})

await test('WaterSpectrum: FFT cascades have the expected height statistics and follow the wind', async () => {
    const { engine, scene } = await createView({ water: true })
    const obj = new Object3D()
    const water = obj.addComponent(WaterRenderer)
    water.waves = []
    const spectrum = new WaterSpectrum()
    water.spectrum = spectrum
    scene.addChild(obj)
    expect(await waitUntil(() => water.fft, 30000) != null).toEqual(true)
    await frames(1)
    // Paused while reading back, so each read waits only for the frames already submitted.
    engine.pause()

    // 10 m/s over 100 km: significant height about 1.6 m, most of it in the first cascade.
    const height = await channelStats(engine, water.fft!.displacement[0], 1)
    expect(Math.abs(height.mean) < 0.05).toEqual(true)
    expect(height.rms > 0.25 && height.rms < 0.9).toEqual(true)
    const fine = await channelStats(engine, water.fft!.displacement[2], 1)
    expect(fine.rms < height.rms * 0.1).toEqual(true)
    // The foam map's Jacobian averages about 1: the waves move water around, not away.
    const jacobian = await channelStats(engine, water.fft!.foam, 1)
    expect(Math.abs(jacobian.mean - 1) < 0.1).toEqual(true)

    // Half the wind rebuilds the spectrum with about half the height (fetch-limited seas grow with the wind).
    spectrum.windSpeed = 5
    engine.resume()
    await frames(1)
    engine.pause()
    const calm = await channelStats(engine, water.fft!.displacement[0], 1)
    expect(calm.rms < height.rms * 0.7).toEqual(true)

    // getHeight picks up the FFT waves once a query has been read back.
    water.getHeight(3, 4)
    engine.resume()
    await frames(1)
    engine.pause()
    const h = await waitUntil(() => water.getHeight(3, 4), 30000)
    expect(h !== 0 && Math.abs(h) < 3).toEqual(true)

    water.spectrum = null
    expect(water.fft == null).toEqual(true)
    engine.dispose()
})

for (const extra of [{}, { useLogDepth: true }, { zPrePass: false, msaa: 4 }]) await test(`FFT ocean renders above and under the surface ${JSON.stringify(extra)}`, async () => {
    const { engine, scene, cameraObj } = await createView({ water: true, ...extra })
    const sun = new Object3D()
    sun.rotationX = 30
    sun.addComponent(DirectLight)
    scene.addChild(sun)
    const obj = new Object3D()
    const water = obj.addComponent(WaterRenderer)
    water.width = 200
    water.length = 200
    water.resolution = 256
    water.spectrum = new WaterSpectrum()
    scene.addChild(obj)
    cameraObj.rotationX = 0
    for (const y of [8, -3]) {
        cameraObj.y = y
        await delay(200)
    }
    expect(water.hasSimulation).toEqual(true)
    engine.dispose()
})

setTimeout(end, 500)
