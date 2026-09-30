import { Engine3D, View3D } from '@orillusion/core';

/**
 * Screenshot-regression harness.
 *
 * A scene is rendered on a fixed 320×180 canvas (DPR 1), the final
 * tone-mapped target is read back and reduced to a coarse grid of cell
 * averages, and that grid is compared with a JSON baseline committed under
 * `test/visual/baselines/`. Cell averages are insensitive to the sub-pixel
 * differences between GPU backends (Metal, D3D12, Vulkan, SwiftShader) but
 * move clearly when lighting, materials, shadows or post-processing change.
 *
 * Updating baselines (after an intentional visual change):
 *   npm run test:visual:update
 * which runs only the visual tests with `?update` and lets the Electron
 * host write the new JSON files.
 */

export const GRID_COLS = 16;
export const GRID_ROWS = 9;
export const CANVAS_W = 320;
export const CANVAS_H = 180;

export interface Baseline {
    cols: number;
    rows: number;
    /** rows × cols × 3 linear display-referred values in [0,1], row-major from the top-left. */
    grid: number[];
}

export interface Tolerance {
    /** Largest allowed per-channel difference of any single cell. */
    maxCell: number;
    /** Largest allowed mean absolute difference over the whole grid. */
    mean: number;
}

export const DEFAULT_TOLERANCE: Tolerance = { maxCell: 0.06, mean: 0.012 };

const baselineModules = import.meta.glob('./baselines/*.json', { eager: true }) as Record<string, any>;
const parentWin: any = window.parent;
export const UPDATE_MODE = /[?&]update\b/.test(parentWin.location.search);

export function getBaseline(name: string): Baseline | null {
    const mod = baselineModules[`./baselines/${name}.json`];
    return mod ? (mod.default ?? mod) : null;
}

/** Create an engine on its own fixed-size canvas so results do not depend on the window. */
export async function createVisualEngine(setting: any = {}): Promise<Engine3D> {
    const canvas = document.createElement('canvas');
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;
    canvas.style.position = 'absolute';
    canvas.style.left = '0px';
    canvas.style.top = '0px';
    canvas.style.width = CANVAS_W + 'px';
    canvas.style.height = CANVAS_H + 'px';
    document.body.appendChild(canvas);
    return Engine3D.init({ canvasConfig: { canvas, devicePixelRatio: 1 }, setting });
}

/** Wait until this engine has rendered `frames` more frames. */
export async function settle(engine: Engine3D, frames: number = 40, timeoutMs: number = 20000): Promise<void> {
    const target = engine.frameCount + frames;
    const deadline = performance.now() + timeoutMs;
    while (engine.frameCount < target) {
        if (performance.now() > deadline) throw new Error(`settle: only reached frame ${engine.frameCount}, wanted ${target}`);
        await new Promise(r => setTimeout(r, 30));
    }
}

function halfToFloat(h: number): number {
    const s = (h & 0x8000) ? -1 : 1, e = (h >> 10) & 0x1f, f = h & 0x3ff;
    if (e === 0) return s * Math.pow(2, -14) * (f / 1024);
    if (e === 31) return f ? NaN : s * Infinity;
    return s * Math.pow(2, e - 15) * (1 + f / 1024);
}

function finalTexture(engine: Engine3D, view: View3D): GPUTexture {
    const posts = (engine.getRenderJob(view) as any)?.graph?.getPass('PostPass')?.postList;
    // ColorGradingPost runs after the tonemap, so when it is attached its target is the final image.
    const post = posts?.get('ColorGradingPost')?.renderTexture ? posts.get('ColorGradingPost') : posts?.get('TonemapPost');
    if (!post?.renderTexture) throw new Error('visual: final post target not available (tonemap disabled?)');
    return post.renderTexture.getGPUTexture();
}

/** Read the final tone-mapped target and average it into a cols×rows grid. */
export async function captureGrid(engine: Engine3D, view: View3D, cols: number = GRID_COLS, rows: number = GRID_ROWS): Promise<Baseline> {
    const tex = finalTexture(engine, view);
    const w = tex.width, h = tex.height;
    const bytesPerRow = Math.ceil((w * 8) / 256) * 256;
    const device = engine.context3D.device;
    const buf = device.createBuffer({ size: bytesPerRow * h, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ });
    const enc = device.createCommandEncoder();
    enc.copyTextureToBuffer({ texture: tex }, { buffer: buf, bytesPerRow, rowsPerImage: h }, { width: w, height: h });
    device.queue.submit([enc.finish()]);
    await buf.mapAsync(GPUMapMode.READ);
    const u16 = new Uint16Array(buf.getMappedRange().slice(0));
    buf.unmap(); buf.destroy();

    const sums = new Float64Array(cols * rows * 3), counts = new Uint32Array(cols * rows);
    const rowStride = bytesPerRow / 2;
    for (let y = 0; y < h; y++) {
        const gy = Math.min(rows - 1, Math.floor((y * rows) / h));
        for (let x = 0; x < w; x++) {
            const gx = Math.min(cols - 1, Math.floor((x * cols) / w));
            const o = y * rowStride + x * 4, c = gy * cols + gx;
            for (let k = 0; k < 3; k++) {
                const v = halfToFloat(u16[o + k]);
                sums[c * 3 + k] += Number.isFinite(v) ? Math.min(Math.max(v, 0), 1) : 0;
            }
            counts[c]++;
        }
    }
    const grid: number[] = [];
    for (let c = 0; c < cols * rows; c++) for (let k = 0; k < 3; k++) grid.push(+(sums[c * 3 + k] / Math.max(counts[c], 1)).toFixed(4));
    return { cols, rows, grid };
}

export interface GridDiff { max: number; mean: number; worstCell: [number, number]; worstChannel: number; }

export function compareGrids(a: Baseline, b: Baseline): GridDiff {
    if (a.cols !== b.cols || a.rows !== b.rows || a.grid.length !== b.grid.length) {
        return { max: Infinity, mean: Infinity, worstCell: [-1, -1], worstChannel: -1 };
    }
    let max = 0, sum = 0, worst = 0;
    for (let i = 0; i < a.grid.length; i++) {
        const d = Math.abs(a.grid[i] - b.grid[i]);
        sum += d;
        if (d > max) { max = d; worst = i; }
    }
    const cell = Math.floor(worst / 3);
    return { max, mean: sum / a.grid.length, worstCell: [cell % a.cols, Math.floor(cell / a.cols)], worstChannel: worst % 3 };
}

/** Compact luminance picture of a grid for failure logs. */
export function gridToAscii(b: Baseline): string {
    const ramp = ' .:-=+*#%@';
    let out = '';
    for (let y = 0; y < b.rows; y++) {
        for (let x = 0; x < b.cols; x++) {
            const i = (y * b.cols + x) * 3;
            const l = 0.2126 * b.grid[i] + 0.7152 * b.grid[i + 1] + 0.0722 * b.grid[i + 2];
            out += ramp[Math.min(ramp.length - 1, Math.floor(l * ramp.length))];
        }
        out += '\n';
    }
    return out;
}

/**
 * Compare the current frame with the named baseline. In update mode the
 * baseline is (re)written instead. Throws with a readable report on mismatch.
 */
export async function expectVisual(name: string, engine: Engine3D, view: View3D, tolerance: Tolerance = DEFAULT_TOLERANCE): Promise<GridDiff | null> {
    const current = await captureGrid(engine, view);
    if (UPDATE_MODE) {
        if (parentWin.electron?.baseline) parentWin.electron.baseline({ name, data: current });
        else console.log(`[visual] baseline ${name}:\n` + JSON.stringify(current));
        console.log(`[visual] wrote baseline "${name}"\n` + gridToAscii(current));
        return null;
    }
    const baseline = getBaseline(name);
    if (!baseline) throw new Error(`visual: no baseline for "${name}" — run \`npm run test:visual:update\` and commit test/visual/baselines/${name}.json`);
    const diff = compareGrids(baseline, current);
    console.log(`[visual] ${name}: max ${diff.max.toFixed(4)} mean ${diff.mean.toFixed(4)}`);
    if (diff.max > tolerance.maxCell || diff.mean > tolerance.mean) {
        throw new Error(
            `visual mismatch "${name}": max cell diff ${diff.max.toFixed(4)} (limit ${tolerance.maxCell}) at cell ${diff.worstCell} channel ${diff.worstChannel}, ` +
            `mean ${diff.mean.toFixed(4)} (limit ${tolerance.mean})\nbaseline:\n${gridToAscii(baseline)}current:\n${gridToAscii(current)}`);
    }
    return diff;
}
