import { BitmapTexture2D, BoxGeometry, Color, Context3D, LitMaterial, MeshRenderer, Object3D, Scene3D } from "@orillusion/core";

export type PoolOptions = {
    /** Inner size along x. */
    width: number;
    /** Inner size along z. */
    depth: number;
    /** Wall height above the floor. */
    wallHeight: number;
    /** Thickness of the walls and of the floor slab under the inner floor. */
    wallThickness: number;
    /** Edge length of one floor tile. */
    tileSize: number;
    /** Number of dark lane lines on the floor, running along x. */
    lanes: number;
    /** Inner corner of the pool (min x, floor y, min z). */
    x?: number;
    y?: number;
    z?: number;
};

const WALL_COLOR = new Color(0.55, 0.82, 0.88);
const COPING_COLOR = new Color(0.95, 0.95, 0.92);

/**
 * Swimming pool: a mosaic-tiled floor slab with lane lines, light aqua
 * walls and a white coping on top. The inner volume starts at (x, y, z);
 * the slab and walls reach down to y - wallThickness.
 */
export function createPool(scene: Scene3D, ctx: Context3D, o: PoolOptions): Object3D {
    const x0 = o.x ?? 0, y0 = o.y ?? 0, z0 = o.z ?? 0;
    const { width: w, depth: d, wallHeight: h, wallThickness: t } = o;
    const pool = new Object3D();

    const floorMat = new LitMaterial();
    floorMat.baseMap = paintFloor(ctx, o);
    floorMat.roughness = 0.35;
    floorMat.metallic = 0;
    pool.addChild(box(new BoxGeometry(w, t, d), floorMat, x0 + w / 2, y0 - t / 2, z0 + d / 2));

    const wallMat = new LitMaterial();
    wallMat.baseColor = WALL_COLOR;
    wallMat.roughness = 0.4;
    wallMat.metallic = 0;
    const copingMat = new LitMaterial();
    copingMat.baseColor = COPING_COLOR;
    copingMat.roughness = 0.6;
    copingMat.metallic = 0;
    const ch = Math.max(0.02, t * 0.4);
    const walls: [number, number, number, number][] = [
        // [size x, size z, center x, center z]
        [w + 2 * t, t, x0 + w / 2, z0 - t / 2],
        [w + 2 * t, t, x0 + w / 2, z0 + d + t / 2],
        [t, d, x0 - t / 2, z0 + d / 2],
        [t, d, x0 + w + t / 2, z0 + d / 2],
    ];
    for (const [sx, sz, cx, cz] of walls) {
        pool.addChild(box(new BoxGeometry(sx, h + t, sz), wallMat, cx, y0 + (h - t) / 2, cz));
        pool.addChild(box(new BoxGeometry(sx + t * 0.3, ch, sz + t * 0.3), copingMat, cx, y0 + h + ch / 2, cz));
    }
    scene.addChild(pool);
    return pool;
}

function box(geometry: BoxGeometry, material: LitMaterial, x: number, y: number, z: number): Object3D {
    const obj = new Object3D();
    obj.x = x;
    obj.y = y;
    obj.z = z;
    const mr = obj.addComponent(MeshRenderer);
    mr.geometry = geometry;
    mr.material = material;
    // Receive only: the thin walls give jagged shadow-map edges on the ground.
    mr.receiveShadow = true;
    mr.castShadow = false;
    return obj;
}

/** Mosaic tiles with light grout and dark-blue lane lines that end in a T before each wall. */
function paintFloor(ctx: Context3D, o: PoolOptions): BitmapTexture2D {
    const tilesX = Math.round(o.width / o.tileSize);
    const tilesZ = Math.round(o.depth / o.tileSize);
    const px = Math.max(8, Math.floor(2048 / Math.max(tilesX, tilesZ)));
    const canvas = document.createElement('canvas');
    canvas.width = tilesX * px;
    canvas.height = tilesZ * px;
    const g = canvas.getContext('2d')!;

    g.fillStyle = 'rgb(225, 242, 246)';
    g.fillRect(0, 0, canvas.width, canvas.height);
    const grout = Math.max(1, Math.round(px * 0.08));
    for (let i = 0; i < tilesX; i++) {
        for (let j = 0; j < tilesZ; j++) {
            const k = 0.94 + Math.random() * 0.1;
            g.fillStyle = `rgb(${Math.round(110 * k)}, ${Math.round(200 * k)}, ${Math.round(218 * k)})`;
            g.fillRect(i * px + grout, j * px + grout, px - 2 * grout, px - 2 * grout);
        }
    }

    // Lane lines: one tile wide, stopping two tiles short of the end walls, with a T bar.
    g.fillStyle = 'rgb(18, 42, 105)';
    const margin = 2 * px;
    for (let l = 1; l <= o.lanes; l++) {
        const zc = Math.round((l * tilesZ) / (o.lanes + 1)) * px;
        g.fillRect(margin, zc - px / 2, canvas.width - 2 * margin, px);
        for (const xe of [margin, canvas.width - margin - px]) {
            g.fillRect(xe, zc - 1.5 * px, px, 3 * px);
        }
    }

    const tex = new BitmapTexture2D(true, ctx, 'srgb');
    tex.source = canvas;
    return tex;
}
