
import { Engine3D } from '../../Engine3D';
import { View3D } from '../../core/View3D';
import { MeshRenderer } from './MeshRenderer';
import { BoundingBox } from '../../core/bound/BoundingBox';
import { Texture } from '../../gfx/graphics/webGpu/core/texture/Texture';
import { EntityCollect } from '../../gfx/renderJob/collect/EntityCollect';
import { ClusterLightingBuffer } from '../../gfx/renderJob/passRenderer/cluster/ClusterLightingBuffer';
import { RendererMask } from '../../gfx/renderJob/passRenderer/state/RendererMask';
import { RendererPassState } from '../../gfx/renderJob/passRenderer/state/RendererPassState';
import { RendererType } from '../../gfx/renderJob/passRenderer/state/RendererType';
import { SkyMaterial } from '../../materials/SkyMaterial';
import { Vector3 } from '../../math/Vector3';
import { SphereGeometry } from '../../shape/SphereGeometry';

/**
 *
 * Sky Box Renderer Component
 * @group Components
 */
export class SkyRenderer extends MeshRenderer {
    /**
     * The material used in the Sky Box.
     */
    public skyMaterial: SkyMaterial;

    constructor() {
        super();
        this.castShadow = false;
        this.castGI = true;
        this.addRendererMask(RendererMask.Sky);
        this.alwaysRender = true;
    }

    public init(): void {
        super.init();
        this.object3D.bound = new BoundingBox(Vector3.ZERO.clone(), Vector3.MAX);
        this.geometry = new SphereGeometry(Engine3D.setting.sky.defaultFar, 20, 20);
        this.skyMaterial ||= new SkyMaterial();
    }

    public onEnable(): void {
        if (!this._readyPipeline) {
            this.initPipeline();
        } else {
            this.castNeedPass(this.materials[0].getShader());

            if (!this._inRenderer && this.transform.scene3D) {
                EntityCollect.instance.sky = this;
                this._inRenderer = true;
            }
        }
    }

    public onDisable(): void {
        if (this._inRenderer && this.transform.scene3D) {
            this._inRenderer = false;
            EntityCollect.instance.sky = null;
        }
    }

    public renderPass2(view: View3D, passType: RendererType, rendererPassState: RendererPassState, clusterLightingBuffer: ClusterLightingBuffer, encoder: GPURenderPassEncoder, useBundle: boolean = false) {
        this.transform.updateWorldMatrix();
        super.renderPass2(view, passType, rendererPassState, clusterLightingBuffer, encoder, useBundle);
        // this.transform.localPosition = Camera3D.mainCamera.transform.localPosition ;
    }

    /**
     * set environment texture
     */
    public set map(texture: Texture) {
        this.skyMaterial.baseMap = texture;
        if (this.skyMaterial.name == null) {
            this.skyMaterial.name = 'skyMaterial';
        }
        this.material = this.skyMaterial;
    }

    /**
     * get environment texture
     */
    public get map(): Texture {
        return this.skyMaterial.baseMap;
    }

    public get exposure() {
        return this.skyMaterial.exposure;
    }

    public set exposure(value) {
        if (this.skyMaterial)
            this.skyMaterial.exposure = value;
    }

    public get roughness() {
        return this.skyMaterial.roughness;
    }

    public set roughness(value) {
        if (this.skyMaterial)
            this.skyMaterial.roughness = value;
    }

}
