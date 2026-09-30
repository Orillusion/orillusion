import { test, expect, end } from '../util'
import { Color, Engine3D, LitMaterial, MeshRenderer } from '@orillusion/core';
import { VISUAL_SCENES } from './scenes';
import { captureGrid, compareGrids, createVisualEngine, DEFAULT_TOLERANCE, expectVisual, GRID_COLS, GRID_ROWS, settle, UPDATE_MODE } from './VisualHarness';

for (const def of VISUAL_SCENES) {
    await test(`visual: ${def.name}`, async () => {
        const engine = await createVisualEngine(def.setting);
        try {
            const view = await def.build(engine);
            engine.startRenderView(view);
            await settle(engine, def.frames ?? 40);
            // The image must be stable before it is judged: two captures a few frames apart agree.
            const a = await captureGrid(engine, view);
            await settle(engine, 5);
            const b = await captureGrid(engine, view);
            const jitter = compareGrids(a, b);
            if (jitter.max > 0.01) throw new Error(`scene "${def.name}" is not stable frame to frame (max ${jitter.max.toFixed(4)})`);
            expect(a.grid.length).tobe(GRID_COLS * GRID_ROWS * 3);
            // A blank frame would match a blank baseline; require real content.
            const lum = a.grid.reduce((s, v) => s + v, 0) / a.grid.length;
            const spread = Math.max(...a.grid) - Math.min(...a.grid);
            if (lum < 0.01 || spread < 0.05) throw new Error(`scene "${def.name}" rendered (nearly) blank: mean ${lum.toFixed(4)}, spread ${spread.toFixed(4)}`);
            await expectVisual(def.name, engine, view, def.tolerance ?? DEFAULT_TOLERANCE);
        } finally {
            engine.dispose();
        }
    })
}

// The harness itself must be able to fail: change one material and the comparison has to trip.
await test('visual harness detects a real change (guards against false green)', async () => {
    if (UPDATE_MODE) return;
    const def = VISUAL_SCENES[0];
    const engine = await createVisualEngine(def.setting);
    try {
        const view = await def.build(engine);
        engine.startRenderView(view);
        await settle(engine, 40);
        const before = await captureGrid(engine, view);
        for (const mr of view.scene.getComponentsInChild(MeshRenderer)) {
            const m = mr.material as LitMaterial;
            if (m.metallic === 1) m.baseColor = new Color(0.9, 0.1, 0.9, 1);      // metal row turns magenta
        }
        await settle(engine, 10);
        const after = await captureGrid(engine, view);
        const d = compareGrids(before, after);
        console.log(`[visual] induced change: max ${d.max.toFixed(4)} mean ${d.mean.toFixed(4)}`);
        expect(d.max > DEFAULT_TOLERANCE.maxCell).tobe(true);
        let threw = false;
        try { await expectVisual(def.name, engine, view); } catch { threw = true; }
        expect(threw).tobe(true);
    } finally {
        engine.dispose();
    }
})

Engine3D.pause();
setTimeout(end, 500)
