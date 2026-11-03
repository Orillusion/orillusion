import {
    AtmosphericComponent, CameraUtil, Color, DirectLight, Engine3D, HoverCameraController, KelvinUtil, Object3D, Scene3D,
    Vector2, Vector3, View3D, WaterRenderer, WaterSpectrum,
} from "@orillusion/core";
import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { addPointerRipples, addWaterGUI, floatingBall, radialGeometry } from "./WaterSampleUtil";

/** Radius of the ocean disc around the buoy. */
const OCEAN_RADIUS = 3000;

/**
 * Open ocean: long swells over deep water with no bottom in sight. The
 * surface is a disc of rings around the buoy the camera orbits, centimetres
 * apart near it and growing with distance. Each wave fades out where the
 * rings get too coarse for it (WaterRenderer.waveFadeDistance), so the
 * distance does not alias.
 *
 * Ripples are simulated in a 60 m square around the buoy
 * (WaterRenderer.rippleArea): click the water to splash, or the buoy to
 * push it under.
 *
 * The waves come from a wind spectrum simulated with FFTs
 * (WaterRenderer.spectrum); the Sea folder sets the wind, fetch, wave
 * height and how sharp the crests are. Whitecaps leave foam that trails
 * behind them.
 */
export class Sample_Ocean {
    async run() {
        const engine = await Engine3D.init({ setting: { render: { water: true } } });

        const scene = new Scene3D();
        scene.addComponent(AtmosphericComponent);

        const camera = CameraUtil.createCamera3DObject(scene);
        camera.perspective(60, engine.aspect, 0.1, 5000);
        // Low over the water, looking across toward the sun.
        camera.object3D.addComponent(HoverCameraController).setCamera(150, -8, 28, new Vector3(0, 0, 0));

        const view = new View3D();
        view.scene = scene;
        view.camera = camera;
        engine.startRenderView(view);

        const light = new Object3D();
        light.rotationX = 30;
        light.rotationY = 150;
        const dl = light.addComponent(DirectLight);
        dl.lightColor = KelvinUtil.color_temperature_to_rgb(5500);
        dl.intensity = 3;
        scene.addChild(light);

        const waterObj = new Object3D();
        const water = waterObj.addComponent(WaterRenderer);
        // 400 rings, 5 cm apart at the center; farther out the spacing is about 1.75% of
        // the distance, so a wave gets four vertices per wavelength out to 14 wavelengths.
        const growth = 0.0175 * 400;
        water.surfaceGeometry = radialGeometry(() => OCEAN_RADIUS, 400, 512,
            (t) => (Math.exp(growth * t) - 1) / (Math.exp(growth) - 1));
        // Fade each wave out before the rings get too coarse for it.
        water.waveFadeDistance = 14;
        // A rough sea from a 12 m/s wind over 100 km of open water, simulated with FFTs.
        const spectrum = new WaterSpectrum();
        spectrum.windSpeed = 12;
        spectrum.windDirection = new Vector2(1, 0.3);
        spectrum.fetch = 100000;
        water.spectrum = spectrum;
        water.waves = [];
        // Clear, deep blue water; nothing below to catch caustics.
        const m = water.waterMaterial;
        m.absorptionColor = new Color(0.1, 0.4, 0.6);
        m.underwaterColor = new Color(0.0, 0.07, 0.14);
        m.density = 0.08;
        // Wind-roughened: the sky reflection is soft.
        m.reflectionRoughness = 0.08;
        water.caustics = false;
        // Wind chop a few metres long, gentle at this scale.
        water.detailScale = 2.5;
        water.detailStrength = 0.4;
        // A grid over the whole ocean would be metres per cell; ripples need a smaller area.
        water.rippleArea = 60;
        scene.addChild(waterObj);

        const buoy = floatingBall(scene, water, 1.2, 0, 0, new Color(0.9, 0.2, 0.15));
        addPointerRipples(engine, camera, water, [buoy]);

        GUIHelp.init();
        GUIHelp.addFolder('Sea');
        GUIHelp.add(spectrum, 'windSpeed', 1, 25, 0.1);
        GUIHelp.add(spectrum, 'fetch', 1000, 500000, 1000);
        GUIHelp.add(spectrum, 'amplitude', 0, 3, 0.01);
        GUIHelp.add(spectrum, 'choppiness', 0, 2, 0.01);
        GUIHelp.open();
        GUIHelp.endFolder();
        addWaterGUI(water, { waves: false, caustics: false, foam: true });
    }
}
