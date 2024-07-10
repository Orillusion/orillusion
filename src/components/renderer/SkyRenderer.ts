
import { Engine3D } from '../../Engine3D';
import { View3D } from '../../core/View3D';
import { MeshRenderer } from './MeshRenderer';
import { BoundingBox } from '../../core/bound/BoundingBox';
import { Texture } from '../../gfx/graphics/webGpu/core/texture/Texture';
import { EntityCollect } from '../../gfx/renderJob/collect/EntityCollect';
import { ClusterLightingBuffer } from '../../gfx/renderJob/passRenderer/cluster/ClusterLightingBuffer';
import { RendererMask } from '../../gfx/renderJob/passRenderer/state/RendererMask';
import { RendererPassState } from '../../gfx/renderJob/passRenderer/state/RendererPassState';
import { PassType } from '../../gfx/renderJob/passRenderer/state/PassType';
import { SkyMaterial } from '../../materials/SkyMaterial';
import { Vector3 } from '../../math/Vector3';
import { SphereGeometry } from '../../shape/SphereGeometry';
import { Object3D } from '../../core/entities/Object3D';
import { SphereReflection } from './SphereReflection';

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

    public init(): void {
        super.init();
        this.castShadow = false;
        this.castGI = true;
        this.addRendererMask(RendererMask.Sky);
        this.alwaysRender = true;

        this.object3D.bound = new BoundingBox(Vector3.ZERO.clone(), Vector3.MAX);
        this.geometry = new SphereGeometry(Engine3D.setting.sky.defaultFar, 20, 20);
        this.skyMaterial ||= new SkyMaterial();
    }

    public onEnable(): void {
        if (!this._readyPipeline) {
            this.initPipeline();
        } else {
            this.castNeedPass();

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
        super.onDisable();
    }

    public nodeUpdate(view: View3D, passType: PassType, renderPassState: RendererPassState, clusterLightingBuffer?: ClusterLightingBuffer) {
        super.nodeUpdate(view, passType, renderPassState, clusterLightingBuffer);
    }

    public renderPass2(view: View3D, passType: PassType, rendererPassState: RendererPassState, clusterLightingBuffer: ClusterLightingBuffer, encoder: GPURenderPassEncoder, useBundle: boolean = false) {
        // this.transform.updateWorldMatrix();
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
        // this.useSkyReflection();
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

    public useSkyReflection() {
        let reflection = new Object3D();
        let ref = reflection.addComponent(SphereReflection);
        ref.autoUpdate = false;
        reflection.x = 0;
        reflection.y = 300;
        reflection.z = 0;
        this.object3D.addChild(reflection);
    }

}
