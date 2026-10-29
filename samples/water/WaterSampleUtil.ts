import {
    BoundUtil, Camera3D, Color, ComponentBase, Engine3D, GeometryBase, LitMaterial, MeshRenderer, Object3D, PointerEvent3D,
    Scene3D, SphereGeometry, Time, Vector3, VertexAttributeName, WaterRenderer,
} from "@orillusion/core";
import { GUIHelp } from "@orillusion/debug/GUIHelp";

/**
 * Floats its object on the water. It can drift in a circle, be dropped in or
 * pushed under, and starts ripples where it disturbs the surface: a splash on
 * entry or when pushed, another as it bobs back up, a wake while it moves.
 */
export class Floater extends ComponentBase {
    /** Drift in a circle starting from the initial point. */
    public drift = false;
    /** Yaw in degrees that turns the object's front toward +x; it faces where it drifts. */
    public heading = 0;

    private water!: WaterRenderer;
    private x = 0;
    private z = 0;
    private cx = 0;
    private cz = 0;
    /** Height of the object's origin above the surface. */
    private lift = 0;
    private size = 1;
    private angle = 0;
    /** Height while falling; NaN when floating. */
    private fallY = NaN;
    private vy = 0;
    private wakeX = 0;
    private wakeZ = 0;
    /** Bobbing about the resting height after a push: offset and its speed. */
    private bob = 0;
    private bobV = 0;

    /** @param size radius of the disturbance, for splash and wake */
    public init(param?: { water: WaterRenderer; x: number; z: number; lift: number; size: number }): void {
        if (!param) return;
        this.water = param.water;
        this.x = this.cx = this.wakeX = param.x;
        this.z = this.cz = this.wakeZ = param.z;
        this.lift = param.lift;
        this.size = param.size;
    }

    /** Radius of the disturbance, also what pointer clicks hit. */
    public get radius(): number {
        return this.size;
    }

    /** Pushes the object under; the water lifts it back, bobbing. */
    public push(): void {
        this.bobV = -4;
        this.water.addRipple(this.x, this.z, 0.5, this.size * 1.2);
    }

    /** Lifts the object this far above the water and lets it fall. */
    public drop(height: number): void {
        this.fallY = this.water.getHeight(this.x, this.z) + height;
        this.vy = 0;
    }

    public onUpdate(): void {
        if (!this.water) return;
        const dt = Math.min(Time.delta * 0.001, 1 / 30);
        if (this.drift) {
            // Two metres around (cx - 2, cz) at 0.8 m/s.
            this.angle += dt * 0.8 / 2;
            this.x = this.cx + 2 * Math.cos(this.angle) - 2;
            this.z = this.cz + 2 * Math.sin(this.angle);
            // Moving along (-sin, cos) of the angle.
            this.transform.rotationY = this.heading - Math.atan2(Math.cos(this.angle), -Math.sin(this.angle)) * 180 / Math.PI;
        }
        // Buoyancy as a spring toward the resting height, about one bob a second, damped.
        if (this.bob !== 0 || this.bobV !== 0) {
            const before = this.bob;
            this.bobV += (-40 * this.bob - 4 * this.bobV) * dt;
            this.bob += this.bobV * dt;
            // Breaking back through the surface on the way up throws a smaller ring.
            if (before < -this.size * 0.3 && this.bob >= -this.size * 0.3 && this.bobV > 1) {
                this.water.addRipple(this.x, this.z, 0.2, this.size);
            }
            if (Math.abs(this.bob) < 1e-3 && Math.abs(this.bobV) < 1e-2) this.bob = this.bobV = 0;
        }
        const rest = this.water.getHeight(this.x, this.z) + this.lift + this.bob;
        let y = rest;
        if (!Number.isNaN(this.fallY)) {
            this.vy -= 9.81 * dt;
            this.fallY += this.vy * dt;
            if (this.fallY > rest) {
                y = this.fallY;
            } else {
                // Splash: deeper the faster it hits.
                this.water.addRipple(this.x, this.z, Math.min(0.4, -this.vy * 0.05), this.size);
                this.fallY = NaN;
            }
        }
        this.transform.x = this.x;
        this.transform.y = y;
        this.transform.z = this.z;
        // Wake: a small ripple every 0.2 m of travel.
        if (Math.hypot(this.x - this.wakeX, this.z - this.wakeZ) > 0.2) {
            this.water.addRipple(this.x, this.z, 0.03, this.size * 0.7);
            this.wakeX = this.x;
            this.wakeZ = this.z;
        }
    }
}

/**
 * Pointer interaction: a click on a floater pushes it under; elsewhere on
 * the water, where the view ray meets the undisturbed surface, it splashes.
 * Holding Shift drags a trail of ripples.
 */
export function addPointerRipples(engine: Engine3D, camera: Camera3D, water: WaterRenderer, floaters: Floater[] = [], splash = 0.4, radius = 0.4): void {
    let lastTrail: Vector3 | null = null;
    const hitWater = (e: PointerEvent3D): Vector3 | null => {
        const ray = camera.screenPointToRay(e.mouseX, e.mouseY);
        if (ray.direction.y >= 0) return null;
        const t = (water.baseHeight - ray.origin.y) / ray.direction.y;
        return new Vector3(ray.origin.x + ray.direction.x * t, water.baseHeight, ray.origin.z + ray.direction.z * t);
    };
    // The nearest floater the view ray passes through, if any.
    const hitFloater = (e: PointerEvent3D): Floater | null => {
        const ray = camera.screenPointToRay(e.mouseX, e.mouseY);
        let best: Floater | null = null, bestT = Infinity;
        for (const f of floaters) {
            const c = f.transform.worldPosition;
            const ox = ray.origin.x - c.x, oy = ray.origin.y - c.y, oz = ray.origin.z - c.z;
            const b = ox * ray.direction.x + oy * ray.direction.y + oz * ray.direction.z;
            const disc = b * b - (ox * ox + oy * oy + oz * oz - f.radius * f.radius);
            const t = -b - Math.sqrt(Math.max(disc, 0));
            if (disc >= 0 && t > 0 && t < bestT) {
                best = f;
                bestT = t;
            }
        }
        return best;
    };
    engine.inputSystem.addEventListener(PointerEvent3D.POINTER_DOWN, (e: PointerEvent3D) => {
        const floater = hitFloater(e);
        if (floater) {
            floater.push();
            return;
        }
        const p = hitWater(e);
        if (p) water.addRipple(p.x, p.z, splash, radius);
    }, null);
    engine.inputSystem.addEventListener(PointerEvent3D.POINTER_MOVE, (e: PointerEvent3D) => {
        if (!e.shiftKey) {
            lastTrail = null;
            return;
        }
        const p = hitWater(e);
        if (!p) return;
        if (!lastTrail || Vector3.distance(p, lastTrail) > 0.15) {
            water.addRipple(p.x, p.z, splash * 0.3, radius * 0.6);
            lastTrail = p;
        }
    }, null);
}

/**
 * A short Water folder: pause and speed, the two water colors (the tint of
 * what is seen through it, and its own scattered color), density, overall
 * wave height (scales every Gerstner wave), and per sample the caustics
 * switch or the whitecap foam. Everything else keeps its default.
 */
export function addWaterGUI(water: WaterRenderer, options: { waves?: boolean; caustics?: boolean; foam?: boolean } = {}): void {
    const m = water.waterMaterial;
    const steepness = water.waves.map((w) => w.steepness);
    const controls = {
        paused: false,
        speed: water.timeScale,
        waveHeight: 1,
    };
    const applyTime = () => { water.timeScale = controls.paused ? 0 : controls.speed; };
    GUIHelp.addFolder('Water');
    GUIHelp.add(controls, 'paused').onChange(applyTime);
    GUIHelp.add(controls, 'speed', 0, 3, 0.01).onChange(applyTime);
    // On the material itself: the color picker writes the edited color back through its setter.
    GUIHelp.addColor(m, 'absorptionColor');
    GUIHelp.addColor(m, 'underwaterColor');
    GUIHelp.add(m, 'density', 0, 2, 0.01);
    if (options.waves !== false) {
        GUIHelp.add(controls, 'waveHeight', 0, 3, 0.01).onChange((v: number) => {
            water.waves.forEach((w, i) => { w.steepness = steepness[i] * v; });
        });
    }
    if (options.caustics !== false) GUIHelp.add(water, 'caustics');
    if (options.foam) GUIHelp.add(m, 'foamIntensity', 0, 1, 0.01);
    GUIHelp.open();
    GUIHelp.endFolder();
}

/**
 * Flat mesh in the xz plane bounded by a closed curve around the origin:
 * rings from the center out to `outline(angle)`, radii spaced by `ringRadius(t)`
 * for t from 0 to 1 (default: evenly).
 */
export function radialGeometry(
    outline: (angle: number) => number, rings: number, segments: number,
    ringRadius: (t: number) => number = (t) => t,
): GeometryBase {
    const count = 1 + rings * segments;
    const pos = new Float32Array(count * 3);
    const nor = new Float32Array(count * 3);
    const uv = new Float32Array(count * 2);
    nor[1] = 1;
    uv[0] = uv[1] = 0.5;
    for (let s = 0; s < segments; s++) {
        const a = (s / segments) * Math.PI * 2;
        const edge = outline(a);
        for (let r = 1; r <= rings; r++) {
            const i = 1 + (r - 1) * segments + s;
            const rr = edge * ringRadius(r / rings);
            pos[i * 3] = Math.cos(a) * rr;
            pos[i * 3 + 2] = Math.sin(a) * rr;
            nor[i * 3 + 1] = 1;
            uv[i * 2] = 0.5 + 0.5 * Math.cos(a) * r / rings;
            uv[i * 2 + 1] = 0.5 + 0.5 * Math.sin(a) * r / rings;
        }
    }
    const idx: number[] = [];
    for (let s = 0; s < segments; s++) idx.push(0, 1 + ((s + 1) % segments), 1 + s);
    for (let r = 1; r < rings; r++) {
        for (let s = 0; s < segments; s++) {
            const a = 1 + (r - 1) * segments + s;
            const b = 1 + (r - 1) * segments + ((s + 1) % segments);
            idx.push(a, b, a + segments, b, b + segments, a + segments);
        }
    }
    return indexedGeometry(pos, nor, uv, idx);
}

/** Square grid of `size` world units centered on the origin, raised by `height(x, z)`. */
export function heightfieldGeometry(size: number, segments: number, height: (x: number, z: number) => number): GeometryBase {
    const n = segments + 1;
    const pos = new Float32Array(n * n * 3);
    const nor = new Float32Array(n * n * 3);
    const uv = new Float32Array(n * n * 2);
    const step = size / segments;
    for (let j = 0; j < n; j++) {
        for (let i = 0; i < n; i++) {
            const k = j * n + i;
            const x = -size / 2 + i * step, z = -size / 2 + j * step;
            pos[k * 3] = x;
            pos[k * 3 + 1] = height(x, z);
            pos[k * 3 + 2] = z;
            // Normal from the slope.
            const e = step * 0.5;
            const dx = (height(x + e, z) - height(x - e, z)) / (2 * e);
            const dz = (height(x, z + e) - height(x, z - e)) / (2 * e);
            const len = Math.hypot(dx, 1, dz);
            nor[k * 3] = -dx / len;
            nor[k * 3 + 1] = 1 / len;
            nor[k * 3 + 2] = -dz / len;
            uv[k * 2] = i / segments;
            uv[k * 2 + 1] = j / segments;
        }
    }
    const idx: number[] = [];
    for (let j = 0; j < segments; j++) {
        for (let i = 0; i < segments; i++) {
            const a = j * n + i, b = a + 1, c = a + n, d = c + 1;
            idx.push(a, c, b, b, c, d);
        }
    }
    return indexedGeometry(pos, nor, uv, idx);
}

function indexedGeometry(pos: Float32Array, nor: Float32Array, uv: Float32Array, idx: number[]): GeometryBase {
    const g = new GeometryBase();
    g.setIndices(pos.length / 3 > 65535 ? new Uint32Array(idx) : new Uint16Array(idx));
    g.setAttribute(VertexAttributeName.position, pos);
    g.setAttribute(VertexAttributeName.normal, nor);
    g.setAttribute(VertexAttributeName.uv, uv);
    g.setAttribute(VertexAttributeName.TEXCOORD_1, uv);
    g.addSubGeometry({ indexStart: 0, indexCount: idx.length, vertexStart: 0, vertexCount: 0, firstStart: 0, index: 0, topology: 0 });
    return g;
}

export function solid(color: Color, roughness: number): LitMaterial {
    const m = new LitMaterial();
    m.baseColor = color;
    m.roughness = roughness;
    m.metallic = 0;
    return m;
}

export function mesh(geometry: GeometryBase, material: LitMaterial, x: number, y: number, z: number): Object3D {
    const obj = new Object3D();
    obj.x = x;
    obj.y = y;
    obj.z = z;
    const mr = obj.addComponent(MeshRenderer);
    mr.geometry = geometry;
    mr.material = material;
    mr.receiveShadow = true;
    return obj;
}

/**
 * A model floating on the water: scaled to `length` across, centered on a
 * holder so clicks and splashes are about its middle, with `draft` of its
 * height under water.
 */
export function floatingModel(scene: Scene3D, water: WaterRenderer, model: Object3D, length: number, x: number, z: number, draft = 0.18): Floater {
    const holder = new Object3D();
    holder.addChild(model);
    scene.addChild(holder);
    const raw = BoundUtil.genMeshBounds(model);
    const s = length / Math.max(raw.max.x - raw.min.x, raw.max.z - raw.min.z);
    model.scaleX *= s;
    model.scaleY *= s;
    model.scaleZ *= s;
    const b = BoundUtil.genMeshBounds(model);
    model.x = -(b.min.x + b.max.x) / 2;
    model.y = -(b.min.y + b.max.y) / 2;
    model.z = -(b.min.z + b.max.z) / 2;
    const height = b.max.y - b.min.y;
    const radius = Math.max(b.max.x - b.min.x, height, b.max.z - b.min.z) / 2;
    return holder.addComponent(Floater, { water, x, z, lift: height * (0.5 - draft), size: radius });
}

/** A ball floating on the water, a little under half submerged. */
export function floatingBall(scene: Scene3D, water: WaterRenderer, radius: number, x: number, z: number, color: Color): Floater {
    const ball = new Object3D();
    const mr = ball.addComponent(MeshRenderer);
    mr.geometry = new SphereGeometry(radius, 32, 32);
    mr.material = solid(color, 0.4);
    const floater = ball.addComponent(Floater, { water, x, z, lift: radius * 0.6, size: radius });
    scene.addChild(ball);
    return floater;
}
