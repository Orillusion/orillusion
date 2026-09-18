import {
    Engine3D,
    View3D,
    MeshRenderer,
    BoundingBox,
    Texture,
    EntityCollect,
    ClusterLightingBuffer,
    RendererMask,
    RendererPassState,
    PassType,
    SkyMaterial,
    Vector3,
    SphereGeometry
} from "@orillusion/core";

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
