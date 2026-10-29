import { Context3D } from '../../gfx/graphics/webGpu/Context3D';
import { BitmapTexture2D } from '../../textures/BitmapTexture2D';

const SIZE = 512;
const BUBBLES = 6000;

const cache = new WeakMap<Context3D, BitmapTexture2D>();

/**
 * Tileable sea foam (r = foam): bubbles of many sizes packed into clusters,
 * each drawn as a bright rim around a clear inside, brightest where the
 * clusters are densest. Water shading reveals it above a threshold that
 * falls as the foam coverage rises, so thin foam shows the densest
 * clusters first. Generated once per context.
 * @internal
 */
export function waterFoamTexture(ctx: Context3D): BitmapTexture2D {
    let texture = cache.get(ctx);
    if (!texture) {
        texture = new BitmapTexture2D(true, ctx);
        texture.source = paintFoam();
        cache.set(ctx, texture);
    }
    return texture;
}

function paintFoam(): HTMLCanvasElement {
    const random = mulberry32(7);
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = SIZE;
    const g = canvas.getContext('2d')!;
    g.fillStyle = 'black';
    g.fillRect(0, 0, SIZE, SIZE);

    // Where the foam gathers: tileable value noise, three octaves.
    const lattice = new Float32Array(32 * 32).map(() => random());
    const cluster = (x: number, y: number) => {
        let v = 0, amp = 0.5, freq = 4;
        for (let o = 0; o < 3; o++) {
            v += amp * tileNoise(lattice, 32, x / SIZE * freq, y / SIZE * freq, freq);
            amp *= 0.5;
            freq *= 2;
        }
        return v / 0.875;
    };

    g.globalCompositeOperation = 'lighter';
    let placed = 0;
    for (let tries = 0; placed < BUBBLES && tries < BUBBLES * 20; tries++) {
        const x = random() * SIZE;
        const y = random() * SIZE;
        const density = cluster(x, y);
        if (random() > density * density * 1.6) continue;
        placed++;
        // Many small bubbles, few large ones.
        const r = 1.2 + 10 * Math.pow(random(), 3);
        const bright = 0.25 + 0.6 * density;
        // Wrapped copies near the edges keep the texture tileable.
        for (const ox of [-SIZE, 0, SIZE]) {
            for (const oy of [-SIZE, 0, SIZE]) {
                const cx = x + ox, cy = y + oy;
                if (cx < -r || cx > SIZE + r || cy < -r || cy > SIZE + r) continue;
                const rim = g.createRadialGradient(cx, cy, r * 0.45, cx, cy, r);
                rim.addColorStop(0, 'rgba(255,255,255,0)');
                rim.addColorStop(0.75, `rgba(255,255,255,${bright * 0.55})`);
                rim.addColorStop(1, 'rgba(255,255,255,0)');
                g.fillStyle = rim;
                g.beginPath();
                g.arc(cx, cy, r, 0, Math.PI * 2);
                g.fill();
            }
        }
    }
    return canvas;
}

// Smooth value noise on a periodic lattice of the given period.
function tileNoise(lattice: Float32Array, n: number, x: number, y: number, period: number): number {
    const xi = Math.floor(x), yi = Math.floor(y);
    const fx = x - xi, fy = y - yi;
    const at = (i: number, j: number) => lattice[(((j % period) + period) % period % n) * n + (((i % period) + period) % period % n)];
    const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    const top = at(xi, yi) + (at(xi + 1, yi) - at(xi, yi)) * sx;
    const bottom = at(xi, yi + 1) + (at(xi + 1, yi + 1) - at(xi, yi + 1)) * sx;
    return top + (bottom - top) * sy;
}

// Small seeded random generator, so every run paints the same foam.
function mulberry32(seed: number): () => number {
    return () => {
        seed |= 0;
        seed = (seed + 0x6d2b79f5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
