import {
    AtmosphericComponent, BoxGeometry, CameraUtil, Color, ComponentBase, DirectLight, Engine3D,
    FluidDebug, FluidDepthFilter, FluidRenderer, FluidThicknessMode, HoverCameraController, KelvinUtil, LitMaterial, MeshRenderer, Object3D,
    PlaneGeometry, Scene3D, View3D,
} from "@orillusion/core";
import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { createPool } from "./_PoolScene";

/**
 * Screen-space fluid rendering of CPU-simulated particles: a block of
 * particles drops into a box and sloshes around. A pillar in the box
 * checks that opaque geometry clips the fluid.
 */
export class Sample_FluidRenderer {
    async run() {
        const engine = await Engine3D.init({
            setting: { render: { fluid: true } },
        });

        const scene = new Scene3D();
        scene.addComponent(AtmosphericComponent);

        const camera = CameraUtil.createCamera3DObject(scene);
        camera.perspective(60, engine.aspect, 0.1, 500);
        camera.object3D.addComponent(HoverCameraController).setCamera(30, -35, 7);

        const view = new View3D();
        view.scene = scene;
        view.camera = camera;
        engine.startRenderView(view);

        const light = new Object3D();
        light.rotationX = 50;
        light.rotationY = 30;
        const dl = light.addComponent(DirectLight);
        dl.lightColor = KelvinUtil.color_temperature_to_rgb(5500);
        dl.intensity = 3;
        dl.castShadow = true;
        scene.addChild(light);

        // Particles rest at y >= 0.05 with radius 0.08: the floor sits below their lowest point,
        // and the ground below the floor slab.
        const floorY = -0.05;
        const slab = 0.12;
        scene.addChild(this.createMesh(new PlaneGeometry(20, 20), new Color(0.15, 0.15, 0.17), 0, floorY - slab - 0.01, 0));
        scene.addChild(this.createMesh(new BoxGeometry(0.6, 2.5, 0.6), new Color(0.92, 0.92, 0.9), 0.8, floorY + 1.25, 0.4));
        const pool = createPool(scene, engine.context3D, {
            width: 3.2, depth: 3.2, wallHeight: 0.6, wallThickness: slab, tileSize: 0.1, lanes: 2, x: -1.6, y: floorY, z: -1.6,
        });

        const fluidObj = new Object3D();
        const fluid = fluidObj.addComponent(FluidRenderer);
        fluid.particleSize = 0.16;
        // Blur over about one particle diameter so the spheres merge into a smooth surface.
        fluid.blurDepthFilterSize = 15;
        fluid.blurDepthNumIterations = 6;
        fluid.depthFilter = FluidDepthFilter.NarrowRange;
        fluid.useAnisotropy = true;
        fluid.edgeSoftness = 5;
        fluid.blurThicknessFilterSize = 10;
        fluid.blurThicknessNumIterations = 2;
        const sim = fluidObj.addComponent(BoxSloshSimulation, { fluid, count: 6000 });
        scene.addChild(fluidObj);

        GUIHelp.init();
        GUIHelp.addFolder('Fluid');
        GUIHelp.add(fluid, 'enable');
        // Hide the pool to look at the fluid's free edges.
        GUIHelp.add({ showPool: true }, 'showPool').onChange((v: boolean) => pool.transform.enable = v);
        GUIHelp.add(fluid, 'particleSize', 0.02, 0.5, 0.01);
        GUIHelp.add(fluid, 'particleThicknessAlpha', 0, 0.3, 0.005);
        GUIHelp.addColor(fluid, 'fluidColor');
        GUIHelp.add(fluid, 'density', 0, 10, 0.1);
        GUIHelp.add(fluid, 'refractionStrength', 0, 3, 0.05);
        GUIHelp.add(fluid, 'fresnelClamp', 0, 1, 0.01);
        GUIHelp.add(fluid, 'specularPower', 1, 1000, 1);
        GUIHelp.add(fluid, 'edgeSoftness', 0, 20, 0.5);
        GUIHelp.add(fluid, 'minimumThickness', 0, 1, 0.01);
        GUIHelp.add(fluid, 'useFixedThickness');
        GUIHelp.add(fluid, 'depthFilter', { Bilateral: FluidDepthFilter.Bilateral, NarrowRange: FluidDepthFilter.NarrowRange });
        GUIHelp.add(fluid, 'thicknessMode', { Accumulated: FluidThicknessMode.Accumulated, Geometric: FluidThicknessMode.Geometric });
        GUIHelp.add(fluid, 'useAnisotropy');
        GUIHelp.add(fluid, 'anisotropyMaxRatio', 1, 8, 0.1);
        GUIHelp.add(fluid, 'anisotropyMinNeighbors', 0, 40, 1);
        GUIHelp.add(fluid, 'anisotropySmoothing', 0, 1, 0.01);
        GUIHelp.add(fluid, 'debug');
        GUIHelp.add(fluid, 'debugFeature', {
            Depth: FluidDebug.DepthTexture,
            DepthBlurred: FluidDebug.DepthBlurredTexture,
            Thickness: FluidDebug.ThicknessTexture,
            ThicknessBlurred: FluidDebug.ThicknessBlurredTexture,
            Normals: FluidDebug.Normals,
        });
        GUIHelp.add(sim, 'paused');
        GUIHelp.addButton('Reset', () => sim.reset());
        GUIHelp.open();
        GUIHelp.endFolder();

        GUIHelp.addFolder('Depth blur');
        GUIHelp.add(fluid, 'enableBlurDepth');
        GUIHelp.add(fluid, 'blurDepthSizeDivisor', 1, 4, 1);
        GUIHelp.add(fluid, 'blurDepthFilterSize', 0, 60, 1);
        GUIHelp.add(fluid, 'blurDepthNumIterations', 0, 10, 1);
        GUIHelp.add(fluid, 'blurDepthMaxFilterSize', 1, 100, 1);
        GUIHelp.add(fluid, 'blurDepthDepthScale', 0, 30, 0.5);
        GUIHelp.endFolder();

        GUIHelp.addFolder('Thickness blur');
        GUIHelp.add(fluid, 'enableBlurThickness');
        GUIHelp.add(fluid, 'blurThicknessSizeDivisor', 1, 4, 1);
        GUIHelp.add(fluid, 'blurThicknessFilterSize', 0, 30, 1);
        GUIHelp.add(fluid, 'blurThicknessNumIterations', 0, 10, 1);
        GUIHelp.endFolder();
    }

    private createMesh(geometry: PlaneGeometry | BoxGeometry, color: Color, x: number, y: number, z: number): Object3D {
        const obj = new Object3D();
        obj.x = x;
        obj.y = y;
        obj.z = z;
        const mr = obj.addComponent(MeshRenderer);
        mr.geometry = geometry;
        const mat = new LitMaterial();
        mat.baseColor = color;
        mat.roughness = 0.8;
        mat.metallic = 0;
        mr.material = mat;
        mr.castShadow = true;
        mr.receiveShadow = true;
        return obj;
    }
}

/**
 * Minimal particle motion (gravity, damping, box walls, a pillar and
 * soft particle spreading on a hash grid). Not a physical fluid
 * solver; it only produces liquid-like particle motion to render.
 */
class BoxSloshSimulation extends ComponentBase {
    public paused = false;

    private fluid!: FluidRenderer;
    private count = 0;
    private pos!: Float32Array; // xyzw per particle, the layout FluidRenderer expects by default
    private vel!: Float32Array;
    private readonly half = 1.6;
    private readonly spacing = 0.1;

    public init(param?: { fluid: FluidRenderer; count: number }): void {
        if (!param) return;
        this.fluid = param.fluid;
        this.count = param.count;
        this.pos = new Float32Array(this.count * 4);
        this.vel = new Float32Array(this.count * 3);
        this.reset();
    }

    public reset(): void {
        const n = Math.ceil(Math.cbrt(this.count));
        for (let i = 0; i < this.count; i++) {
            const x = i % n, y = Math.floor(i / (n * n)), z = Math.floor(i / n) % n;
            this.pos[i * 4 + 0] = -this.half + 0.2 + x * this.spacing + Math.random() * 0.01;
            this.pos[i * 4 + 1] = 1.0 + y * this.spacing;
            this.pos[i * 4 + 2] = -this.half + 0.2 + z * this.spacing + Math.random() * 0.01;
            this.pos[i * 4 + 3] = 1;
            this.vel[i * 3 + 0] = 2.0;
            this.vel[i * 3 + 1] = 0;
            this.vel[i * 3 + 2] = 1.0;
        }
        this.fluid.setDataBuffer(this.pos);
    }

    public onUpdate(): void {
        if (this.paused || !this.fluid) return;
        const dt = 1 / 60;
        for (let s = 0; s < 2; s++) this.step(dt / 2);
        this.fluid.setDataBuffer(this.pos);
    }

    private step(dt: number): void {
        const { pos, vel, count, half } = this;
        const h = this.spacing;
        const cell = new Map<number, number[]>();
        const key = (x: number, y: number, z: number) => ((x + 512) * 1024 + (y + 512)) * 1024 + (z + 512);
        for (let i = 0; i < count; i++) {
            const k = key(Math.floor(pos[i * 4] / h), Math.floor(pos[i * 4 + 1] / h), Math.floor(pos[i * 4 + 2] / h));
            let list = cell.get(k);
            if (!list) cell.set(k, list = []);
            list.push(i);
        }

        for (let i = 0; i < count; i++) {
            const px = pos[i * 4], py = pos[i * 4 + 1], pz = pos[i * 4 + 2];
            const cx = Math.floor(px / h), cy = Math.floor(py / h), cz = Math.floor(pz / h);
            let fx = 0, fy = 0, fz = 0;
            for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) {
                const list = cell.get(key(cx + dx, cy + dy, cz + dz));
                if (!list) continue;
                for (const j of list) {
                    if (j === i) continue;
                    const rx = px - pos[j * 4], ry = py - pos[j * 4 + 1], rz = pz - pos[j * 4 + 2];
                    const d2 = rx * rx + ry * ry + rz * rz;
                    if (d2 >= h * h || d2 < 1e-10) continue;
                    const d = Math.sqrt(d2);
                    const push = (h - d) / h * 60;
                    fx += rx / d * push; fy += ry / d * push; fz += rz / d * push;
                }
            }
            vel[i * 3] = (vel[i * 3] + fx * dt) * 0.995;
            vel[i * 3 + 1] = (vel[i * 3 + 1] + (fy - 9.8) * dt) * 0.995;
            vel[i * 3 + 2] = (vel[i * 3 + 2] + fz * dt) * 0.995;
        }

        const r = h * 0.5;
        for (let i = 0; i < count; i++) {
            let x = pos[i * 4] + vel[i * 3] * dt;
            let y = pos[i * 4 + 1] + vel[i * 3 + 1] * dt;
            let z = pos[i * 4 + 2] + vel[i * 3 + 2] * dt;
            if (y < r) { y = r; vel[i * 3 + 1] *= -0.3; }
            if (x < -half + r) { x = -half + r; vel[i * 3] *= -0.3; }
            if (x > half - r) { x = half - r; vel[i * 3] *= -0.3; }
            if (z < -half + r) { z = -half + r; vel[i * 3 + 2] *= -0.3; }
            if (z > half - r) { z = half - r; vel[i * 3 + 2] *= -0.3; }
            // pillar at (0.8, 0.4), half extent 0.3
            const ox = x - 0.8, oz = z - 0.4, e = 0.3 + r;
            if (Math.abs(ox) < e && Math.abs(oz) < e && y < 2.5) {
                if (e - Math.abs(ox) < e - Math.abs(oz)) { x = 0.8 + Math.sign(ox) * e; vel[i * 3] *= -0.3; }
                else { z = 0.4 + Math.sign(oz) * e; vel[i * 3 + 2] *= -0.3; }
            }
            pos[i * 4] = x; pos[i * 4 + 1] = y; pos[i * 4 + 2] = z;
        }
    }
}
