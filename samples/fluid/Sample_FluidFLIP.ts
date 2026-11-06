import {
    AtmosphericComponent, CameraUtil, Color, ComponentBase, Context3D, DirectLight, Engine3D, FluidDebug, FluidDepthFilter, FluidThicknessMode,
    FluidRenderer, HoverCameraController, KelvinUtil, LitMaterial, MeshRenderer, Object3D, PlaneGeometry,
    PointerEvent3D, Scene3D, Vector3, View3D,
} from "@orillusion/core";
import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { FluidSimulatorConfig } from "../compute/fluid/FluidSimulatorConfig";
import { FluidSimulatorPipeline } from "../compute/fluid/FluidSimulatorPipeline";
import { createPool } from "./_PoolScene";

/**
 * Screen-space fluid rendering of a GPU FLIP simulation. The
 * simulation's particle position buffer is handed to FluidRenderer with
 * setDataBufferGPU, so positions never leave the GPU.
 *
 * Move the mouse over the water to stir it; drag to orbit the camera.
 */
export class Sample_FluidFLIP {
    async run() {
        const engine = await Engine3D.init({
            setting: { render: { fluid: true } },
        });

        const scene = new Scene3D();
        scene.addComponent(AtmosphericComponent);

        const camera = CameraUtil.createCamera3DObject(scene);
        camera.perspective(60, engine.aspect, 0.1, 1000);
        camera.object3D.addComponent(HoverCameraController).setCamera(-35, -30, 45, new Vector3(15, 4, 10));

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


        const fluidObj = new Object3D();
        const fluid = fluidObj.addComponent(FluidRenderer);
        fluid.particleSize = 0.4;
        const pool = this.createTank(scene, engine.context3D, fluid.particleSize / 2);
        fluid.particleThicknessAlpha = 0.02;
        // Particles are only a few pixels wide at this distance; blur over about one and a half
        // diameters so the spheres merge into a smooth surface.
        fluid.blurDepthFilterSize = 30;
        fluid.blurDepthNumIterations = 5;
        fluid.depthFilter = FluidDepthFilter.NarrowRange;
        fluid.useAnisotropy = true;
        // Absorb by the path length through the water (world units) instead of by particle count:
        // FLIP particles are unevenly spaced and accumulated thickness shows that as cloudy patches.
        fluid.thicknessMode = FluidThicknessMode.Geometric;
        fluid.density = 0.15;
        // Smooths the sphere bumps of the near and far side that the thickness is taken from.
        fluid.blurThicknessFilterSize = 20;
        fluid.blurThicknessNumIterations = 3;
        fluid.edgeSoftness = 5;
        const sim = fluidObj.addComponent(FLIPSimulation);
        sim.onReady = (positions, count) => fluid.setDataBufferGPU(positions, count);
        scene.addChild(fluidObj);

        // The fluid is drawn in screen space and not written to the G-buffer, so pixel picking
        // cannot hit it. The mouse ray is intersected with a plane at about the water surface
        // instead; the movement of that point drives the stirring force. Points outside the
        // tank, stale points (mouse left the canvas) and oversized steps are dropped: the
        // solver applies the velocity to most of the grid and diverges if it gets too large.
        const input = engine.inputSystem;
        const stirHeight = 5;
        const maxStirStep = 3;
        const lastPoint = new Vector3();
        const point = new Vector3();
        const velocity = new Vector3();
        let lastTime = -Infinity;
        input.addEventListener(PointerEvent3D.POINTER_MOVE, () => {
            const now = performance.now();
            const fresh = now - lastTime < 100;
            lastTime = -Infinity;
            if (input.isMouseDown || sim.paused) return;

            const ray = camera.screenPointToRay(input.mouseX, input.mouseY);
            const dir = ray.direction;
            const t = Math.abs(dir.y) > 1e-4 ? (stirHeight - ray.origin.y) / dir.y : -1;
            if (t <= 0) return;
            point.set(ray.origin.x + dir.x * t, stirHeight, ray.origin.z + dir.z * t);
            if (point.x < 0 || point.x > 30 || point.z < 0 || point.z > 20) return;

            if (fresh) {
                Vector3.sub(point, lastPoint, velocity);
                velocity.clampLength(0, maxStirStep);
                sim.stir(ray.origin, dir, velocity);
            }
            lastPoint.copy(point);
            lastTime = now;
        }, this);

        GUIHelp.init();
        GUIHelp.addFolder('Fluid');
        GUIHelp.add(fluid, 'enable');
        // Hide the pool to look at the fluid's free edges.
        GUIHelp.add({ showPool: true }, 'showPool').onChange((v: boolean) => pool.transform.enable = v);
        GUIHelp.add(fluid, 'particleSize', 0.05, 2, 0.01);
        GUIHelp.add(fluid, 'particleThicknessAlpha', 0, 0.2, 0.002);
        GUIHelp.addColor(fluid, 'fluidColor');
        GUIHelp.add(fluid, 'density', 0, 2, 0.01);
        GUIHelp.add(fluid, 'refractionStrength', 0, 3, 0.05);
        GUIHelp.add(fluid, 'fresnelClamp', 0, 1, 0.01);
        GUIHelp.add(fluid, 'specularPower', 1, 1000, 1);
        GUIHelp.add(fluid, 'edgeSoftness', 0, 20, 0.5);
        GUIHelp.add(fluid, 'blurDepthFilterSize', 0, 60, 1);
        GUIHelp.add(fluid, 'blurDepthNumIterations', 0, 10, 1);
        GUIHelp.add(fluid, 'blurDepthDepthScale', 0, 30, 0.5);
        GUIHelp.add(fluid, 'blurThicknessFilterSize', 0, 40, 1);
        GUIHelp.add(fluid, 'blurThicknessNumIterations', 0, 10, 1);
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
        GUIHelp.open();
        GUIHelp.endFolder();
    }

    /**
     * Pool around the simulation domain (x 0..30, z 0..20). Particles rest at y >= 0.01, so the
     * floor sits one particle radius lower to keep the spheres from poking through it.
     */
    private createTank(scene: Scene3D, ctx: Context3D, particleRadius: number): Object3D {
        const floorY = -particleRadius - 0.05;
        const slab = 0.8;
        scene.addChild(this.createMesh(new PlaneGeometry(80, 80), new Color(0.15, 0.15, 0.17), 15, floorY - slab - 0.01, 10));
        return createPool(scene, ctx, { width: 30, depth: 20, wallHeight: 6, wallThickness: slab, tileSize: 0.5, lanes: 4, y: floorY });
    }

    private createMesh(geometry: PlaneGeometry, color: Color, x: number, y: number, z: number): Object3D {
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
        mr.receiveShadow = true;
        // Lies just under the pool floor; as a caster it shadows the floor through depth bias.
        mr.castShadow = false;
        return obj;
    }
}

/**
 * Runs the FLIP solver from samples/compute/fluid every frame without
 * drawing anything itself.
 */
class FLIPSimulation extends ComponentBase {
    public paused = false;
    public onReady: (positions: FluidSimulatorPipeline['positionBuffer'], count: number) => void = () => { };

    private pipeline!: FluidSimulatorPipeline;

    public start(): void {
        const config: FluidSimulatorConfig = {
            GROUP_SIZE: 128,
            XMIN: 0, XMAX: 15,
            YMIN: 10, YMAX: 20,
            ZMIN: 0, ZMAX: 20,
            scaleV: 3, scale: 0,
            gridSizeX: 30, gridSizeY: 20, gridSizeZ: 20,
            gridResolutionX: 30, gridResolutionY: 20, gridResolutionZ: 20,
            initDensity: 20,
            NUM: 0, dispatchNUM: 0,
            GRIDNUM: 0, dispatchGRID: 0,
            CELLNUM: 0, dispatchCELL: 0,
            maxDensity: 0,
            timeStep: 1.0 / 60.0,
            PRESSURE_JACOBI_ITERATIONS: 100,
            flipness: 0.95,
        };
        const { initDensity, XMIN, XMAX, YMIN, YMAX, ZMIN, ZMAX, scaleV, GROUP_SIZE } = config;
        const gx = config.gridResolutionX, gy = config.gridResolutionY, gz = config.gridResolutionZ;
        config.scale = Math.pow(scaleV, 1.0 / 3.0);
        config.NUM = Math.ceil(initDensity * (XMAX - XMIN) * (YMAX - YMIN) * (ZMAX - ZMIN) * scaleV);
        config.dispatchNUM = Math.ceil(config.NUM / GROUP_SIZE);
        config.GRIDNUM = (gx + 1) * (gy + 1) * (gz + 1);
        config.dispatchGRID = Math.ceil(config.GRIDNUM / GROUP_SIZE);
        config.CELLNUM = gx * gy * gz;
        config.dispatchCELL = Math.ceil(config.CELLNUM / GROUP_SIZE);
        config.maxDensity = config.NUM / (XMAX - XMIN) / (YMAX - YMIN) / (ZMAX - ZMIN);

        this.pipeline = new FluidSimulatorPipeline(config);
        this.onReady(this.pipeline.positionBuffer, config.NUM);
    }

    /** Push the fluid near a ray with the given velocity. */
    public stir(origin: Vector3, direction: Vector3, velocity: Vector3): void {
        this.pipeline?.updateInput(origin, direction, velocity);
    }

    public onCompute(_view?: View3D, command?: GPUCommandEncoder): void {
        if (this.paused || !this.pipeline || !command) return;
        this.pipeline.updateInputData();
        this.pipeline.compute(command);
    }
}
