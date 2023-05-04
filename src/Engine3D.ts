import { CanvasConfig } from './gfx/graphics/webGpu/CanvasConfig';
import { Color } from './math/Color';
import { EngineSetting } from './setting/EngineSetting';
import { Time } from './util/Time';
import { InputSystem } from './io/InputSystem';
import { View3D } from './core/View3D';
import { version } from '../package.json';
import { webGPUContext } from './gfx/graphics/webGpu/Context3D';
import { FXAAPost } from './gfx/renderJob/post/FXAAPost';
import { ForwardRenderJob } from './gfx/renderJob/jobs/ForwardRenderJob';
import { GlobalBindGroup } from './gfx/graphics/webGpu/core/bindGroups/GlobalBindGroup';
import { Interpolator } from './math/TimeInterpolator';
import { RTResourceMap } from './gfx/renderJob/frame/RTResourceMap';
import { RendererJob } from './gfx/renderJob/jobs/RendererJob';
import { Res } from './assets/Res';
import { ShaderLib } from './assets/shader/ShaderLib';
import { ShaderUtil } from './gfx/graphics/webGpu/shader/util/ShaderUtil';
import { ComponentCollect } from './gfx/renderJob/collect/ComponentCollect';

/** 
 * Orillusion 3D Engine
 * @notExported
 * @group engine3D
 */
export class Engine3D {
    /**
     * @internal
     */
    // [x: string]: any;
    /**
     * resource manager
     */
    public static res: Res;
    /**
     * input system
     */
    public static inputSystem: InputSystem;
    public static views: View3D[];

    private static _frameRateValue: number = 0;
    private static _frameRate: number = 360;
    private static _isRun: boolean = false;
    private static _frameTimeCount: number = 0;
    private static _deltaTime: number = 0;
    private static _time: number = 0;

    public static get frameRate(): number {
        return this._frameRate;
    }

    public static set frameRate(value: number) {
        this._frameRate = value;
        this._frameRateValue = 1.0 / value;
        if (value >= 360) {
            this._frameRateValue = 0;
        }
    }

    public static get size(): number[] {
        return webGPUContext.presentationSize;
    }

    public static get aspect(): number {
        return webGPUContext.aspect;
    }

    public static get width(): number {
        return webGPUContext.windowWidth;
    }

    public static get height(): number {
        return webGPUContext.windowHeight;
    }

    /**
     * engine setting
     */
    public static setting: EngineSetting = {
        occlusionQuery: {
            enable: true,
            debug: false,
        },
        pick: {
            enable: true,
            mode: `bound`,
            detail: `mesh`,
        },
        render: {
            debug: false,
            renderPassState: 4,
            renderState_left: 5,
            renderState_right: 5,
            renderState_split: 0.5,
            quadScale: 1,
            hdrExposure: 1.5,
            debugQuad: -1,
            maxPointLight: 1000,
            maxDirectLight: 4,
            maxSportLight: 1000,
            drawOpMin: 0,
            drawOpMax: Number.MAX_SAFE_INTEGER,
            drawTrMin: 0,
            drawTrMax: Number.MAX_SAFE_INTEGER,
            zPrePass: false,
            gi: false,
            postProcessing: {
                globalFog: {
                    debug: false,
                    enable: false,
                    fogType: 0.0,
                    height: 100,
                    start: 400,
                    end: 0,
                    density: 0.02,
                    ins: 1,
                    fogColor: new Color(84 / 255, 90 / 255, 239 / 255, 1),
                },
                ssao: {
                    enable: false,
                    radius: 0.15,
                    bias: -0.1,
                    aoPower: 2.0,
                    debug: true,
                },
                outline: {
                    enable: false,
                    strength: 1,
                    groupCount: 4,
                    outlinePixel: 2,
                    fadeOutlinePixel: 4,
                    useAddMode: false,
                    debug: true,
                },
                taa: {
                    enable: false,
                    jitterSeedCount: 8,
                    blendFactor: 0.1,
                    sharpFactor: 0.6,
                    sharpPreBlurFactor: 0.5,
                    temporalJitterScale: 0.13,
                    debug: true,
                },
                gtao: {
                    enable: false,
                    darkFactor: 1.0,
                    maxDistance: 5.0,
                    maxPixel: 50.0,
                    rayMarchSegment: 6,
                    multiBounce: false,
                    usePosFloat32: true,
                    blendColor: true,
                    debug: true,
                },
                ssr: {
                    enable: false,
                    pixelRatio: 1,
                    fadeEdgeRatio: 0.2,
                    rayMarchRatio: 0.5,
                    fadeDistanceMin: 600,
                    fadeDistanceMax: 2000,
                    roughnessThreshold: 0.5,
                    powDotRN: 0.2,
                    mixThreshold: 0.1,
                    debug: true,
                },
                bloom: {
                    enable: false,
                    blurX: 4,
                    blurY: 4,
                    intensity: 0.25,
                    brightness: 1.3,
                    debug: false,
                },
                fxaa: {
                    enable: false,
                },
                depthOfView: {
                    enable: false,
                    iterationCount: 3,
                    pixelOffset: 1.0,
                    near: 150,
                    far: 300,
                },
            },
        },
        shadow: {
            enable: true,
            type: 'HARD',
            shadowBias: 0.00204,
            pointShadowBias: 0.002,
            shadowQuality: 2.5,
            shadowBound: 50,
            shadowSize: 2048,
            pointShadowSize: 1024,
            shadowSoft: 0.005,
            shadowNear: 1,
            shadowFar: 2000,
            needUpdate: true,
            autoUpdate: true,
            updateFrameRate: 2,
            debug: false,
        },
        sky: {
            type: 'HDRSKY',
            sky: null,
            skyExposure: 1.0,
            defaultFar: 1000000,
            defaultNear: 1,
        },
        light: {
            maxLight: 1024,
        },
        material: {
            materialChannelDebug: false,
            materialDebug: false
        },
    };

    private static _beforeRender: Function;
    private static _renderLoop: Function;
    private static _lateRender: Function;
    /**
     * @internal
     */
    public static renderJobs: Map<View3D, RendererJob>;



    /**
     * create webgpu 3d engine
     * @param descriptor  {@link CanvasConfig}
     * @returns
     */
    public static async init(descriptor: { canvasConfig?: CanvasConfig; beforeRender?: Function; renderLoop?: Function; lateRender?: Function, engineSetting?: EngineSetting } = {}) {
        console.log('engine version', version);

        this.setting = { ...this.setting, ...descriptor.engineSetting }

        await webGPUContext.init(descriptor.canvasConfig);

        ComponentCollect.init();

        ShaderLib.init();

        ShaderUtil.init();

        GlobalBindGroup.init();

        RTResourceMap.init();

        this.res = new Res();

        this._beforeRender = descriptor.beforeRender;
        this._renderLoop = descriptor.renderLoop;
        this._lateRender = descriptor.lateRender;
        this.inputSystem = new InputSystem();
        this.inputSystem.initCanvas(webGPUContext.canvas);
        return;
    }

    public static startRenderView(view: View3D) {
        this.renderJobs ||= new Map<View3D, RendererJob>();
        this.views = [view];
        let renderJob = new ForwardRenderJob(view);
        this.renderJobs.set(view, renderJob);
        renderJob.addPost(new FXAAPost());
        renderJob.start();
        this.render(0);
        return renderJob;
    }

    public static startRenderViews(views: View3D[]) {
        this.renderJobs ||= new Map<View3D, RendererJob>();
        this.views = views;
        for (let i = 0; i < views.length; i++) {
            const view = views[i];
            let renderJob = new ForwardRenderJob(view);
            this.renderJobs.set(view, renderJob);
            renderJob.addPost(new FXAAPost());
            renderJob.start();
        }
        this.render(0);
    }

    public static getRenderJob(view: View3D): RendererJob {
        return this.renderJobs.get(view);
    }


    /**
     * @internal
     */
    public static render(time) {
        if (!this._isRun) {
            this._deltaTime = time - this._time;
            this._time = time;

            if (this._frameRateValue > 0) {
                this._frameTimeCount += this._deltaTime * 0.001;
                if (this._frameTimeCount >= this._frameRateValue * 0.95) {
                    this._frameTimeCount = 0;
                    this.updateFrame(time);
                }
            } else {
                this.updateFrame(time);
            }
        }
        requestAnimationFrame((t) => this.render(t));
    }

    public static updateFrame(time: number) {
        Time.delta = time - Time.time;
        Time.time = time;
        Time.frame += 1;
        // let camera = Camera3D.mainCamera;
        Interpolator.tick(Time.delta);
        if (this._beforeRender) this._beforeRender();

        this.renderJobs.forEach((v, k) => {
            v.render(this._renderLoop);
        });

        if (this._lateRender) this._lateRender();
    }
}

/**
 * Orillusion 3D
 * @group engine3D
 */
// export let Engine3D = new _Engine3D();
