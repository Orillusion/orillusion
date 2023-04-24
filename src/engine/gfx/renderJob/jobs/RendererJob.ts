import { ComponentBase } from '../../../components/ComponentBase';
import { Camera3D } from '../../../core/Camera3D';
import { Scene3D } from '../../../core/Scene3D';
import { Engine3D } from '../../../Engine3D';
import { VirtualTexture } from '../../../textures/VirtualTexture';
import { GlobalBindGroup } from '../../graphics/webGpu/core/bindGroups/GlobalBindGroup';
import { EntityCollect } from '../collect/EntityCollect';
import { GPUContext } from '../GPUContext';
import { OcclusionSystem } from '../occlusion/OcclusionSystem';
import { ClusterLightingRender } from '../passRenderer/cluster/ClusterLightingRender';
import { RendererBase } from '../passRenderer/RendererBase';
import { PostRenderer } from '../passRenderer/post/PostRenderer';
import { DDGIProbeRenderer } from '../passRenderer/ddgi/DDGIProbeRenderer';
import { ShadowMapPassRenderer } from '../passRenderer/shadow/ShadowMapPassRenderer';
import { PreDepthPassRenderer } from '../passRenderer/preDepth/PreDepthPassRenderer';
import { PostBase } from '../post/PostBase';
import { PointLightShadowRenderer } from '../passRenderer/shadow/PointLightShadowRenderer';
import { UICanvas } from '../../../components/gui/core/UICanvas';
import { View3D } from '../../../core/View3D';
import { PickFire } from '../../../io/PickFire';
import { ShadowLightsCollect } from '../collect/ShadowLightsCollect';
import { GBufferFrame } from '../frame/GBufferFrame';
import { RendererMap } from './RenderMap';
import { ColorPassRenderer } from '../passRenderer/color/ColorPassRenderer';
import { Graphic3D } from '../passRenderer/graphic/Graphic3DRender';
import { ReflectionProbeRenderer } from '../passRenderer/probe/ReflectionProbeRenderer';

/**
 * render jobs 
 * @internal
 * @group Post
 */
export class RendererJob {

    private _canvas: UICanvas;

    /**
     * @internal
     */
    public rendererMap: RendererMap;

    /**
     * @internal
     */
    public shadowMapPassRenderer: ShadowMapPassRenderer;

    /**
     * @internal
     */
    public pointLightShadowRenderer: PointLightShadowRenderer;

    /**
     * @internal
     */
    public ddgiProbeRenderer: DDGIProbeRenderer;

    /**
     * @internal
     */
    public postRenderer: PostRenderer;

    /**
     * @internal
     */
    public clusterLightingRender: ClusterLightingRender;

    /**
     * @internal
     */
    public occlusionSystem: OcclusionSystem;

    /**
     * @internal
     */
    public depthPassRenderer: PreDepthPassRenderer;

    /**
       * @internal
       */
    public colorPassRenderer: ColorPassRenderer;

    /**
       * @internal
       */
    public reflectionProbeRenderer: ReflectionProbeRenderer;

    /**
     * @internal
     */
    public pauseRender: boolean = false;
    public pickFire: PickFire;

    /**
     * Graphics renderers (lines, rectangles, etc.)
     */
    public graphic3D: Graphic3D;

    protected _view: View3D;

    /**
     * Create a renderer task class
     * @param scene Scene3D {@link Scene3D}
     */
    constructor(view: View3D) {
        this._view = view;

        ShadowLightsCollect.init();

        this.rendererMap = new RendererMap();

        this.occlusionSystem = new OcclusionSystem();

        this.clusterLightingRender = new ClusterLightingRender(view);
        this.rendererMap.addRenderer(this.clusterLightingRender);

        this.graphic3D = new Graphic3D();
        if (view && this.graphic3D)
            view.scene.addChild(this.graphic3D);

        if (Engine3D.setting.render.zPrePass) {
            this.depthPassRenderer = new PreDepthPassRenderer();
            this.rendererMap.addRenderer(this.depthPassRenderer);
        }


        this.shadowMapPassRenderer = new ShadowMapPassRenderer();
        this.pointLightShadowRenderer = new PointLightShadowRenderer();
        this.reflectionProbeRenderer = new ReflectionProbeRenderer();
        this.reflectionProbeRenderer.clusterLightingRender = this.clusterLightingRender;
    }


    /**
     * @internal
     */
    public get view(): View3D {
        return this._view;
    }

    public set view(view: View3D) {
        this._view = view;
    }

    /**
     * start render task
     */
    public start() {
    }

    // public get guiCanvas(): UICanvas {
    //     return this._canvas;
    // }

    /**
     * stop render task
     */
    public stop() { }

    /**
     * pause render task
     */
    public pause() {
        this.pauseRender = true;
    }

    /**
     * back render task
     */
    public resume() {
        this.pauseRender = false;
    }

    /** 
     * @internal
     */
    public enablePost(gbufferFrame: GBufferFrame) {
        this.postRenderer = new PostRenderer();
        this.postRenderer.setRenderStates(gbufferFrame);
        this.rendererMap.addRenderer(this.postRenderer);
    }

    /**
     * Add a post processing special effects task
     * @param post
     */
    public addPost(post: PostBase): PostBase | PostBase[] {
        if (!this.postRenderer) this.enablePost(GBufferFrame.getGBufferFrame('ColorPassGBuffer'));

        if (post instanceof PostBase) {
            this.postRenderer.attachPost(this.view, post);
        }
        return post;
    }

    /**
     * Remove specified post-processing effects
     * @param post
     */
    public removePost(post: PostBase | PostBase[]) {
        if (post instanceof PostBase) {
            this.postRenderer.detachPost(this.view, post);
        } else {
            for (let i = 0; i < post.length; i++) {
                this.postRenderer.detachPost(this.view, post[i]);
            }
        }
    }

    /**
     * @internal
     */
    public render(renderLoop: Function) {
        let view = this._view;
        // let camera = this._view.camera;
        // let scene = this._view.scene;

        this.view.scene.waitUpdate();

        /******
         * auto update component list
         *****/
        ComponentBase.componentsBeforeUpdateList.forEach((v, k) => {
            if (k.enable) v();
        });

        GlobalBindGroup.getLightEntries(view.scene).update(view);

        let globalMatrixBindGroup = GlobalBindGroup.modelMatrixBindGroup;
        globalMatrixBindGroup.writeBuffer();

        if (renderLoop) {
            renderLoop();
        }

        ComponentBase.componentsUpdateList.forEach((v, k) => {
            if (k.enable) v();
        });

        let command = GPUContext.beginCommandEncoder();
        ComponentBase.componentsComputeList.forEach((v, k) => {
            if (k.enable) v(view, command);
        });
        GPUContext.endCommandEncoder(command);

        this.occlusionSystem.update(view.camera, view.scene);
        this.renderFrame(view);
        if (this.postRenderer && this.postRenderer.postList.length > 0) {
            this.postRenderer.render(view);
        }

        view.scene.envMapChange = false;

        ComponentBase.componentsLateUpdateList.forEach((v, k) => {
            if (k.enable) v();
        });

    }

    /**
     * To render a frame of the scene 
     */
    protected renderFrame(view: View3D) {
        this.clusterLightingRender.render(view, this.occlusionSystem);
        if (this.shadowMapPassRenderer && Engine3D.setting.shadow.enable) {
            this.shadowMapPassRenderer.render(view, this.occlusionSystem);
        }

        if (this.pointLightShadowRenderer) {
            this.pointLightShadowRenderer.render(view, this.occlusionSystem);
        }

        if (this.depthPassRenderer) {
            this.depthPassRenderer.beforeCompute(view, this.occlusionSystem);
            this.depthPassRenderer.render(view, this.occlusionSystem);
            this.depthPassRenderer.lateCompute(view, this.occlusionSystem);
        }

        if (Engine3D.setting.gi.enable && this.ddgiProbeRenderer) {
            this.ddgiProbeRenderer.beforeCompute(view, this.occlusionSystem);
            this.ddgiProbeRenderer.render(view, this.occlusionSystem);
            this.ddgiProbeRenderer.lateCompute(view, this.occlusionSystem);
        }

        if (this.reflectionProbeRenderer) {
            this.reflectionProbeRenderer.beforeCompute(view, this.occlusionSystem);
            this.reflectionProbeRenderer.render(view, this.occlusionSystem);
            this.reflectionProbeRenderer.lateCompute(view, this.occlusionSystem);
        }

        let passList = this.rendererMap.getAllPassRenderer();
        for (let i = 0; i < passList.length; i++) {
            const renderer = passList[i];
            renderer.clusterLightingRender = this.clusterLightingRender;
            renderer.beforeCompute(view, this.occlusionSystem);
            renderer.render(view, this.occlusionSystem);
            renderer.lateCompute(view, this.occlusionSystem);
        }
    }

    public debug() {

    }
}
