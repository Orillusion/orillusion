import { CanvasConfig } from './gfx/graphics/webGpu/CanvasConfig';
import { Color } from './math/Color';
import { EngineSetting } from './setting/EngineSetting';
import { Time } from './util/Time';
import { InputSystem } from './io/InputSystem';
import { View3D } from './core/View3D';
import { version } from '../package.json';

import { GPUTextureFormat } from './gfx/graphics/webGpu/WebGPUConst';
import { webGPUContext } from './gfx/graphics/webGpu/Context3D';
import { RTResourceConfig } from './gfx/renderJob/config/RTResourceConfig';
import { RTResourceMap } from './gfx/renderJob/frame/RTResourceMap';

import { ForwardRenderJob } from './gfx/renderJob/jobs/ForwardRenderJob';
import { GlobalBindGroup } from './gfx/graphics/webGpu/core/bindGroups/GlobalBindGroup';
import { Interpolator } from './math/TimeInterpolator';
import { RendererJob } from './gfx/renderJob/jobs/RendererJob';
import { Res } from './assets/Res';
import { ShaderLib } from './assets/shader/ShaderLib';
import { ShaderUtil } from './gfx/graphics/webGpu/shader/util/ShaderUtil';
import { ComponentCollect } from './gfx/renderJob/collect/ComponentCollect';
import { ShadowLightsCollect } from './gfx/renderJob/collect/ShadowLightsCollect';
import { GUIConfig } from './components/gui/GUIConfig';
import { WasmMatrix } from '@orillusion/wasm-matrix/WasmMatrix';
import { Matrix4 } from './math/Matrix4';
import { FXAAPost } from './gfx/renderJob/post/FXAAPost';
import { PostProcessingComponent } from './components/post/PostProcessingComponent';

/** 
 * Orillusion 3D Engine
 * 
 * -- Engine3D.setting.*
 * 
 * -- await Engine3D.init();
 * @group engine3D
 */
export class Engine3D {

    /**
     * resource manager in engine3d
     */
    public static res: Res;

    /**
     * input system in engine3d
     */
    public static inputSystem: InputSystem;

    /**
     * more view in engine3d
     */
    public static views: View3D[];
    private static _frameRateValue: number = 0;
    private static _frameRate: number = 360;
    private static _frameTimeCount: number = 0;
    private static _deltaTime: number = 0;
    private static _time: number = 0;
    private static _beforeRender: Function;
    private static _renderLoop: Function;
    private static _lateRender: Function;
    private static _requestAnimationFrameID: number = 0;
    static Engine3D: any;
    static divB: HTMLDivElement;

    /**
     * set engine render frameRate 24/30/60/114/120/144/240/360 fps or other
     */
    public static get frameRate(): number {
        return this._frameRate;
    }

    /**
     * get engine render frameRate 
     */
    public static set frameRate(value: number) {
        this._frameRate = value;
        this._frameRateValue = 1.0 / value;
        if (value >= 360) {
            this._frameRateValue = 0;
        }
    }

    /**
     * get render window size width and height
     */
    public static get size(): number[] {
        return webGPUContext.presentationSize;
    }

    /**
     * get render window aspect
     */
    public static get aspect(): number {
        return webGPUContext.aspect;
    }

    /**
     * get render window size width 
     */
    public static get width(): number {
        return webGPUContext.windowWidth;
    }

    /**
     * get render window size height 
     */
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
            useLogDepth: false,
            gi: false,
            postProcessing: {
                bloom: {
                    downSampleStep: 5,
                    downSampleBlurSize: 5,
                    downSampleBlurSigma: 1.0,
                    upSampleBlurSize: 5,
                    upSampleBlurSigma: 1.0,
                    luminanceThreshole: 1.0,
                    bloomIntensity: 1.0,
                },
                globalFog: {
                    debug: false,
                    enable: false,
                    fogType: 0.0,
                    fogHeightScale: 0.1,
                    start: 400,
                    end: 10,
                    density: 0.02,
                    ins: 0.5,
                    skyFactor: 0.5,
                    skyRoughness: 0.4,
                    overrideSkyFactor: 0.8,
                    fogColor: new Color(96 / 255, 117 / 255, 133 / 255, 1),
                    falloff: 0.7,
                    rayLength: 200.0,
                    scatteringExponent: 2.7,
                    dirHeightLine: 10.0,
                },
                godRay: {
                    blendColor: true,
                    rayMarchCount: 16,
                    scatteringExponent: 5,
                    intensity: 0.5
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
                    textureScale: 0.7,
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
            pointShadowBias: 0.002,
            shadowSize: 1024,
            pointShadowSize: 1024,
            shadowSoft: 0.005,
            shadowBias: 0.0001,
            needUpdate: true,
            autoUpdate: true,
            updateFrameRate: 2,
            csmMargin: 0.1,
            csmScatteringExp: 0.7,
            csmAreaScale: 0.4,
            debug: false,
        },
        gi: {
            enable: false,
            offsetX: 0,
            offsetY: 0,
            offsetZ: 0,
            probeSpace: 64,
            probeXCount: 4,
            probeYCount: 2,
            probeZCount: 4,
            probeSize: 32,
            probeSourceTextureSize: 2048,
            octRTMaxSize: 2048,
            octRTSideSize: 16,
            maxDistance: 64 * 1.73,
            normalBias: 0.25,
            depthSharpness: 1,
            hysteresis: 0.98,
            lerpHysteresis: 0.01,//The smaller the value, the slower the reaction, which can counteract flickering
            irradianceChebyshevBias: 0.01,
            rayNumber: 144,
            irradianceDistanceBias: 32,
            indirectIntensity: 1.0,
            ddgiGamma: 2.2,
            bounceIntensity: 0.025,
            probeRoughness: 1,
            realTimeGI: false,
            debug: false,
            autoRenderProbe: false,
        },
        sky: {
            type: 'HDRSKY',
            sky: null,
            skyExposure: 1.0,
            defaultFar: 65536,//can't be too big
            defaultNear: 1,
        },
        light: {
            maxLight: 4096,
        },
        material: {
            materialChannelDebug: false,
            materialDebug: false
        },
        loader: {
            numConcurrent: 20,
        }
    };


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
        console.log('Engine Version', version);

        // for dev debug
        if (import.meta.env.DEV) {
            this.divB = document.createElement("div");
            this.divB.style.position = 'absolute'
            this.divB.style.zIndex = '999'
            this.divB.style.color = '#FFFFFF'
            this.divB.style.top = '150px'
            document.body.appendChild(this.divB);
        }

        this.setting = { ...this.setting, ...descriptor.engineSetting }

        await WasmMatrix.init(Matrix4.allocCount);

        await webGPUContext.init(descriptor.canvasConfig);

        ShaderLib.init();

        ShaderUtil.init();

        GlobalBindGroup.init();

        RTResourceMap.init();

        ShadowLightsCollect.init();

        this.res = new Res();

        this.res.initDefault();

        this._beforeRender = descriptor.beforeRender;
        this._renderLoop = descriptor.renderLoop;
        this._lateRender = descriptor.lateRender;
        this.inputSystem = new InputSystem();
        this.inputSystem.initCanvas(webGPUContext.canvas);
        return;
    }

    /**
     * set render view and start renderer
     * @param view 
     * @returns 
     */
    public static startRenderView(view: View3D) {
        this.renderJobs ||= new Map<View3D, RendererJob>();
        this.views = [view];
        let renderJob = new ForwardRenderJob(view);
        this.renderJobs.set(view, renderJob);
        let presentationSize = webGPUContext.presentationSize;
        // RTResourceMap.createRTTexture(RTResourceConfig.colorBufferTex_NAME, presentationSize[0], presentationSize[1], GPUTextureFormat.rgba16float, false);

        if (this.setting.pick.mode == `pixel`) {
            let postProcessing = view.scene.getOrAddComponent(PostProcessingComponent);
            postProcessing.addPost(FXAAPost);

        } else {
        }

        if (this.setting.pick.mode == `pixel` || this.setting.pick.mode == `bound`) {
            view.enablePick = true;
        }

        this.resume();
        return renderJob;
    }


    /**
     * set render views and start renderer
     * @param view 
     * @returns 
     */
    public static startRenderViews(views: View3D[]) {
        this.renderJobs ||= new Map<View3D, RendererJob>();
        this.views = views;
        for (let i = 0; i < views.length; i++) {
            const view = views[i];
            let renderJob = new ForwardRenderJob(view);
            this.renderJobs.set(view, renderJob);
            let presentationSize = webGPUContext.presentationSize;

            if (this.setting.pick.mode == `pixel`) {
                let postProcessing = view.scene.addComponent(PostProcessingComponent);
                postProcessing.addPost(FXAAPost);
            } else {
                RTResourceMap.createRTTexture(RTResourceConfig.colorBufferTex_NAME, presentationSize[0], presentationSize[1], GPUTextureFormat.rgba16float, false);
            }

            if (this.setting.pick.mode == `pixel` || this.setting.pick.mode == `bound`) {
                view.enablePick = true;
            }
        }
        this.resume();
    }

    /**
     * get view render job instance
     * @param view 
     * @returns 
     */
    public static getRenderJob(view: View3D): RendererJob {
        return this.renderJobs.get(view);
    }

    /**
     * Pause the engine render
     */
    public static pause() {
        if (this._requestAnimationFrameID != 0) {
            cancelAnimationFrame(this._requestAnimationFrameID);
            this._requestAnimationFrameID = 0;
        }
    }

    /**
     * Resume the engine render
     */
    public static resume() {
        this._requestAnimationFrameID = requestAnimationFrame((t) => this.render(t));
    }

    /**
     * start engine render
     * @internal
     */
    private static render(time) {
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
        this.resume();
    }

    private static updateGUIPixelRatio(screenWidth: number, screenHeight: number) {
        let xyRatioSolution = GUIConfig.solution.x / GUIConfig.solution.y;
        let xyRatioCurrent = screenWidth / screenHeight;
        if (xyRatioSolution < xyRatioCurrent) {
            GUIConfig.pixelRatio = screenHeight / GUIConfig.solution.y;
        } else {
            GUIConfig.pixelRatio = screenWidth / GUIConfig.solution.x;
        }
    }

    private static updateFrame(time: number) {
        Time.delta = time - Time.time;
        Time.time = time;
        Time.frame += 1;
        Interpolator.tick(Time.delta);

        /* update all transform */
        let views = this.views;
        let i = 0;
        for (i = 0; i < views.length; i++) {
            const view = views[i];
            view.scene.waitUpdate();
            view.camera.resetPerspective(webGPUContext.aspect);
        }

        this.updateGUIPixelRatio(webGPUContext.canvas.clientWidth, webGPUContext.canvas.clientHeight);

        if (this._beforeRender) this._beforeRender();

        /****** auto start with component list *****/
        // ComponentCollect.startComponents();

        /****** auto before update with component list *****/
        for (const iterator of ComponentCollect.componentsBeforeUpdateList) {
            let k = iterator[0];
            let v = iterator[1];
            for (const iterator2 of v) {
                let f = iterator2[0];
                let c = iterator2[1];
                if (f.enable) {
                    c(k);
                };
            }
        }

        let command = webGPUContext.device.createCommandEncoder();;
        for (const iterator of ComponentCollect.componentsComputeList) {
            let k = iterator[0];
            let v = iterator[1];
            for (const iterator2 of v) {
                let f = iterator2[0];
                let c = iterator2[1];
                if (f.enable) {
                    c(k, command);
                };
            }
        }

        webGPUContext.device.queue.submit([command.finish()]);

        /****** auto update with component list *****/
        for (const iterator of ComponentCollect.componentsUpdateList) {
            let k = iterator[0];
            let v = iterator[1];
            for (const iterator2 of v) {
                let f = iterator2[0];
                let c = iterator2[1];
                if (f.enable) {
                    c(k);
                };
            }
        }

        for (const iterator of ComponentCollect.graphicComponent) {
            let k = iterator[0];
            let v = iterator[1];
            for (const iterator2 of v) {
                let f = iterator2[0];
                let c = iterator2[1];
                if (k && f.enable) {
                    c(k);
                };
            }
        }

        if (this._renderLoop) {
            this._renderLoop();
        }

        // console.log("useCount", Matrix4.useCount);
        // let t = performance.now();
        WasmMatrix.updateAllContinueTransform(0, Matrix4.useCount, 16);
        // this.divB.innerText = "wasm:" + (performance.now() - t).toFixed(2);

        /****** auto update global matrix share buffer write to gpu *****/
        let globalMatrixBindGroup = GlobalBindGroup.modelMatrixBindGroup;
        globalMatrixBindGroup.writeBuffer(Matrix4.useCount * 16);

        this.renderJobs.forEach((v, k) => {
            if (!v.renderState) {
                v.start();
            }
            v.renderFrame();
        });

        /****** auto late update with component list *****/
        for (const iterator of ComponentCollect.componentsLateUpdateList) {
            let k = iterator[0];
            let v = iterator[1];
            for (const iterator2 of v) {
                let f = iterator2[0];
                let c = iterator2[1];
                if (f.enable) {
                    c(k);
                };
            }
        }

        if (this._lateRender) this._lateRender();
    }


}
