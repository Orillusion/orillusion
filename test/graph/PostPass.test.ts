import { test, end, expect, delay } from '../util'
import {
    Engine3D,
    Scene3D,
    View3D,
    Camera3D,
    Object3D,
    PostPass,
    FINAL_COLOR,
    COLOR_BUFFER,
} from '@orillusion/core'

// C8 acceptance: PostPass registered at stage=Post, reads _ColorBuffer,
// writes _FinalColor. After one frame (FXAAPost runs) the _FinalColor
// handle resolves to a non-null texture. PostPass is registered
// eagerly in the constructor (PostRenderer is built by addPost(FXAAPost)
// during RendererJob construction, so it's available then).

await test('PostPass registered eagerly at stage=Post, reads _ColorBuffer, writes _FinalColor', async () => {
    const engine = await Engine3D.init({})
    const scene = new Scene3D()
    const cameraObj = new Object3D()
    const camera = cameraObj.addComponent(Camera3D)
    camera.perspective(60, engine.aspect, 1, 5000)
    scene.addChild(cameraObj)
    const view = new View3D()
    view.scene = scene
    view.camera = camera
    engine.startRenderView(view)

    const feature = view.renderGraph!.getPass('PostPass') as PostPass | null
    if (!feature) throw new Error('PostPass not registered')
    // _ColorBuffer plus _MotionVector (MotionBlurPost may sample per-object velocities).
    expect(feature.reads.length).toEqual(2)
    expect(feature.reads[0]).toEqual(COLOR_BUFFER)
    expect(feature.reads[1]).toEqual('_MotionVector')
    expect(feature.writes.length).toEqual(1)
    expect(feature.writes[0]).toEqual(FINAL_COLOR)

    // _FinalColor handle is registered eagerly. It falls back to the
    // colorPass GBuffer's color texture when `lastRenderPassState`
    // is still null on frame 0 — the pool.get() call still succeeds.
    const pool = view.renderGraph!.pool
    expect(pool.has(FINAL_COLOR)).toEqual(true)
    const finalColor = pool.get(FINAL_COLOR)
    if (!finalColor) throw new Error('_FinalColor resolved to null')

    // One RAF tick drives the post chain; afterward the feature's
    // getter should surface whatever the last post (FXAA by default)
    // wrote.
    await delay(200)
    const afterFrame = pool.get(FINAL_COLOR)
    if (!afterFrame) throw new Error('_FinalColor null after frame')

    engine.dispose()
})

setTimeout(end, 2500)
