import { Camera3D } from '../../core/Camera3D';
import { UUID } from '../../util/Global';
import { RegisterComponent } from '../../util/SerializeDecoration';
import { LightBase } from './LightBase';
import { LightType } from './LightData';
import { CameraUtil } from '../../util/CameraUtil';
import { Vector3 } from '../../math/Vector3';
import { FrustumCSM } from '../..';
import { EntityCollect } from '../../gfx/renderJob/collect/EntityCollect';
/**
 *
 *Directional light source.
 *The light of this light source is parallel, for example, sunlight. This light source can generate shadows.
 * @group Lights
 */
@RegisterComponent(DirectLight, 'DirectLight')
export class DirectLight extends LightBase {
    /** Orthographic camera used to render the (non-CSM) shadow map. */
    public shadowCamera: Camera3D;
    // Debug visualization toggles (wired from GUIUtil). Split so CSM cascade draw
    // and non-CSM orthographic shadow-bound draw can be toggled independently.
    /** Draw the CSM cascade frustums for debugging. */
    public debugCSM: boolean = false;
    /** Draw the non-CSM orthographic shadow bounds for debugging. */
    public debugShadowBound: boolean = false;
    /** Per-cascade shadow cameras when CSM is enabled. */
    public csmShadowCamera: Camera3D[] = [];
    /** Cascaded shadow map frustum splitter. */
    public frustumCSM: FrustumCSM;
    /** When true, the CSM cascades are recomputed every frame. */
    public csmAutoUpdate: boolean = true;
    /** Optional custom cascade split distribution function. */
    public csmSplitFunction: (near: number, far: number, index: number, max: number) => number;
    protected _enableCSM: boolean = false;
    /** Set once `enableCSM` is assigned, so start() keeps an explicit choice. */
    private _enableCSMExplicit: boolean = false;

    constructor() {
        super();
        this.shadowCamera = CameraUtil.createCamera3DObject(null, 'shadowCamera');
        this.shadowCamera.shadowLight = this;
        this.shadowCamera.isShadowCamera = true;
    }

    /** Initialize the shadow camera frustum to a usable default cube. */
    public start(): void {
        super.start();
        this.castGI = true;

        // Initialize the shadow camera frustum to a usable default cube
        // (covers a [-bound/2, bound/2] world-space box) so the GUI shows
        // meaningful numbers even before any sample tweaks them. Writes go
        // through the underlying camera/field directly to bypass the CSM
        // gate in the public setters — when CSM is on these are inert anyway.
        const bound = this.transform.view3D?.engine3D.setting.shadow.shadowBound;
        this._shadowBoundWidth = bound;
        this._shadowBoundHeight = bound;
        this.shadowCamera.left = -bound * 0.5;
        this.shadowCamera.right = bound * 0.5;
        this.shadowCamera.bottom = -bound * 0.5;
        this.shadowCamera.top = bound * 0.5;
        this.shadowCamera.near = 0.01;
        this.shadowCamera.far = bound;

        // The scene's first directional light (usually the sun) uses CSM by
        // default; an explicit `enableCSM` assignment is kept as is.
        if (!this._enableCSMExplicit && this.isFirstDirectLight()) {
            this.applyEnableCSM(true);
        }
    }

    /** True when this is the first enabled DirectLight registered in its scene. */
    private isFirstDirectLight(): boolean {
        const scene = this.transform.scene3D;
        const lights = scene ? EntityCollect.instance.getLights(scene) : null;
        return !!lights && lights.find((l) => l instanceof DirectLight) === this;
    }

    /**
     * Recompute the per-cascade shadow cameras from the render camera's
     * frustum, using a rotation-invariant sphere fit plus texel snapping
     * to keep cascade shadows stable as the camera moves.
     * @param renderCamera the main rendering camera
     */
    public updateShadowCameraCSM(renderCamera: Camera3D) {
        if (!this.csmAutoUpdate) return;

        this.frustumCSM.update(renderCamera.projectionMatrix, renderCamera.pvMatrixInv, renderCamera.near, renderCamera.far, this.transform.view3D!.engine3D.setting.shadow, this.csmSplitFunction);

        // CSM stabilize: sphere-fit + texel-snap.
        //
        // Previous AABB-based extent (bound.extents.length) is sensitive to
        // camera rotation — as the view rotates, the AABB bounding the 8
        // corners changes size, shrinking and growing the shadow frustum
        // every frame. This causes shadows to visibly shimmer.
        //
        // Sphere fit (centroid + max distance to any corner) is rotation
        // invariant. Texel-snap then aligns the sphere centre to shadow
        // texel boundaries so the ortho projection grid never slides
        // sub-texel — eliminating the remaining edge flicker when the
        // camera translates.
        const mapSize = this.shadowMapWidth || 1;
        const forward = Vector3.negate(this.direction, Vector3.HELP_3).normalize();
        // Pick a 'up' axis not parallel to the light forward.
        const refUp = (Math.abs(forward.y) < 0.99) ? Vector3.UP : Vector3.FORWARD;
        const right = Vector3.cross(refUp, forward, Vector3.HELP_4).normalize();
        const realUp = Vector3.cross(forward, right, Vector3.HELP_5).normalize();

        const sphereCenter = Vector3.HELP_0;
        const snappedCenter = Vector3.HELP_2;
        const shadowPos = Vector3.HELP_6;
        const shadowCameraTarget = Vector3.HELP_1;

        // Coverage safety factor. Sphere fit of the frustum gives a
        // tighter ortho extent than the old AABB half-diagonal, which is
        // great for resolution but leaves tall near-camera casters
        // outside FAR cascades' horizontal bounds. Those casters still
        // throw shadows INTO the far cascade (long slanted light) but
        // since they aren't rasterised into that cascade's shadow map,
        // the shadow is missing — a "cascade boundary leak". Padding the
        // sphere by a fixed ratio recovers the lost coverage at modest
        // resolution cost (~20% more ortho extent → ~17% bigger texels).
        const coverageSafetyFactor = 1.25;

        for (let i = 0; i < this.cascadeNum; i++) {
            const corners = this.frustumCSM.children[i].getWorldCorners();
            // Centroid of the 8 frustum corners.
            sphereCenter.set(0, 0, 0);
            for (let c = 0; c < 8; c++) Vector3.add(sphereCenter, corners[c], sphereCenter);
            sphereCenter.multiplyScalar(1 / 8);
            // Sphere radius = farthest corner to centroid, padded by the
            // safety factor for caster-coverage headroom.
            let radius = 0;
            for (let c = 0; c < 8; c++) {
                const d = Vector3.distance(sphereCenter, corners[c]);
                if (d > radius) radius = d;
            }
            radius = Math.ceil(radius * coverageSafetyFactor);

            // Project centre onto the light's tangent plane (right, realUp)
            // and snap to texel boundaries. Forward component kept as-is so
            // the shadow camera still stays in front of the frustum.
            const texelSize = (2 * radius) / mapSize;
            const cx = Vector3.dot(sphereCenter, right);
            const cy = Vector3.dot(sphereCenter, realUp);
            const cz = Vector3.dot(sphereCenter, forward);
            const snapX = Math.round(cx / texelSize) * texelSize;
            const snapY = Math.round(cy / texelSize) * texelSize;
            snappedCenter.set(0, 0, 0);
            Vector3.addScaledVector(snappedCenter, right, snapX, snappedCenter);
            Vector3.addScaledVector(snappedCenter, realUp, snapY, snappedCenter);
            Vector3.addScaledVector(snappedCenter, forward, cz, snappedCenter);

            // Place shadow camera at snappedCenter - direction*renderCam.far,
            // looking at snappedCenter + direction*renderCam.far.
            shadowPos.copy(this.direction).normalize(renderCamera.far);
            Vector3.add(snappedCenter, shadowPos, shadowCameraTarget);
            Vector3.sub(snappedCenter, shadowPos, shadowPos);

            // Push the near plane backward (toward the light) by the ortho
            // extent so tall casters sitting "above" the cascade along the
            // light axis still rasterise into this cascade's shadow map.
            // Without this, a 100-unit-tall box near the camera casts no
            // shadow into far cascades because its bounds are clipped by
            // this cascade's original near = renderCamera.near.
            const castPullback = renderCamera.far; // generous; same scale as shadowPos offset
            this.csmShadowCamera[i].near = -castPullback;
            this.csmShadowCamera[i].far = renderCamera.far * 2;
            this.csmShadowCamera[i].transform.lookAt(shadowPos, shadowCameraTarget);
            this.csmShadowCamera[i].orthoOffCenter(-radius, radius, -radius, radius, -castPullback, renderCamera.far * 2);
        }
    }

    // RFC-003 Layer C: 'auto' lets ShadowBiasCalculator derive a texelSize-based
    // value from the cascade frustum + shadow map size. Setting a number overrides
    // it (NDC depth units for shadowBias, world units for normalBias).
    private _shadowBias: 'auto' | number = 'auto';
    private _normalBias: 'auto' | number = 'auto';

    /**
     * Whether cascaded shadow maps (CSM) are enabled for this light.
     * Defaults to true for the scene's first directional light, false otherwise.
     */
    public get enableCSM(): boolean{
        return this._enableCSM;
    }

    /** Enable or disable cascaded shadow maps (defaults to 4 cascades). */
    public set enableCSM(value: boolean) {
        this._enableCSMExplicit = true;
        this.applyEnableCSM(value);
    }

    private applyEnableCSM(value: boolean) {
        if (this._enableCSM != value) {
            if (value) {
                if (this.cascadeNum == 0){
                    this.cascadeNum = 4;
                }
            } else if (this.lightData.csmShadowMapIndex != -1) {
                this.lightData.csmShadowMapIndex = -1;
            }
            this._enableCSM = value;
            this.onChange();
        }
    }

    /** Number of CSM cascades. */
    public get cascadeNum(): number{
        return this.lightData.csmShadowMapNum;
    }

    /** Set the number of CSM cascades (min 1), rebuilding the cascade cameras. */
    public set cascadeNum(value: number){
        value = Math.max(value, 1);
        if (this.lightData.csmShadowMapNum != value) {
            this.csmShadowCamera = [];
            this.frustumCSM = new FrustumCSM(value);
            for (let i = 0; i < value; i++) {
                const csmCamera = CameraUtil.createCamera3DObject(null, `csmShadowCamera_${i}`);
                csmCamera.shadowLight = this;
                csmCamera.isShadowCamera = true;
                this.csmShadowCamera.push(csmCamera);
            }
            this.lightData.csmShadowMapNum = value;
        }
    }

    /** Shadow depth bias; 'auto' derives a texel-size-based value. */
    public get shadowBias(): 'auto' | number {
        return this._shadowBias;
    }

    /** Set the shadow depth bias (NDC depth units), or 'auto'. */
    public set shadowBias(value: 'auto' | number) {
        if (this._shadowBias != value) {
            this._shadowBias = value;
            this.onChange();
        }
    }

    /** Shadow normal bias; 'auto' derives a texel-size-based value. */
    public get normalBias(): 'auto' | number {
        return this._normalBias;
    }

    /** Set the shadow normal bias (world units), or 'auto'. */
    public set normalBias(value: 'auto' | number) {
        if (this._normalBias != value) {
            this._normalBias = value;
            this.onChange();
        }
    }

    /** Width of the orthographic shadow bound (ignored when CSM is on). */
    public get shadowBoundWidth(): number {
        return this._shadowBoundWidth;
    }

    /** Set the orthographic shadow bound width (ignored when CSM is on). */
    public set shadowBoundWidth(value: number) {
        if (this._shadowBoundWidth != value && !this.enableCSM) {
            this._shadowBoundWidth = value;
            const halfValue = value * 0.5;
            this.shadowCamera.left = -halfValue;
            this.shadowCamera.right = halfValue;
            this.onChange();
        }
    }

    /** Height of the orthographic shadow bound (ignored when CSM is on). */
    public get shadowBoundHeight(): number {
        return this._shadowBoundHeight;
    }

    /** Set the orthographic shadow bound height (ignored when CSM is on). */
    public set shadowBoundHeight(value: number) {
        if (this._shadowBoundHeight != value && !this.enableCSM) {
            this._shadowBoundHeight = value;
            const halfValue = value * 0.5;
            this.shadowCamera.bottom = -halfValue;
            this.shadowCamera.top = halfValue;
            this.onChange();
        }
    }

    /** Near plane of the orthographic shadow bound (ignored when CSM is on). */
    public get shadowBoundNear(): number {
        return this.shadowCamera.near;
    }

    /** Set the orthographic shadow bound near plane (ignored when CSM is on). */
    public set shadowBoundNear(value: number) {
        if (this.shadowCamera.near != value && !this.enableCSM) {
            this.shadowCamera.near = value;
            this.onChange();
        }
    }

    /** Far plane of the orthographic shadow bound (ignored when CSM is on). */
    public get shadowBoundFar(): number {
        return this.shadowCamera.far;
    }

    /** Set the orthographic shadow bound far plane (ignored when CSM is on). */
    public set shadowBoundFar(value: number) {
        if (this.shadowCamera.far != value && !this.enableCSM) {
            this.shadowCamera.far = value;
            this.onChange();
        }
    }

    /** Initialize as a directional light and assign a default name. */
    public init(): void {
        super.init();
        if (this.object3D.name == "") {
            this.object3D.name = "DirectionLight_" + UUID();
        }
        this.radius = Number.MAX_SAFE_INTEGER;
        this.lightData.lightType = LightType.DirectionLight;
        this.lightData.linear = 0;
        this.lightData.quadratic = 0.3;
    }

    /**
     *
     * Get the radius of a directional light source
     */
    public get radius(): number {
        return this.lightData.range as number;
    }

    /**
     * Set the radius of a directional light source
     */
    public set radius(value: number) {
        this.lightData.range = value;
        this.onChange();
    }

    /**
     * Get the indirect (global illumination) contribution factor of this
     * directional light.
     */
    public get indirect(): number {
        return this.lightData.quadratic as number;
    }

    /**
     * Set the indirect (global illumination) contribution factor of this
     * directional light.
     */
    public set indirect(value: number) {
        this.lightData.quadratic = value;
        this.onChange();
    }

    // /**
    //  * Set cast shadow
    //  * @param value
    //  **/
    // public set castShadow(value: boolean) {
    //     if (value != this._castShadow) {
    //         this.onChange();
    //     }
    //     this._castShadow = value;
    // }

    // /**
    //  * get cast shadow
    //  * @return boolean
    //  * */
    // public get castShadow(): boolean {
    //     return this.lightData.castShadowIndex as number >= 0;
    // }

    protected onChange() {
        super.onChange();
        // Bias arrays are recomputed each frame in GlobalUniformGroup.setCamera()
        // via ShadowBiasCalculator; no per-light cache needed here.
    }

    /** Destroy the light and its (parentless) shadow/CSM cameras. */
    public destroy(force?: boolean): void {
        // super.destroy() flips `enable=false`, which fires onDisable → onChange,
        // and onChange reads shadowBoundFar (i.e. shadowCamera.far). Let the base
        // chain finish before we null out shadowCamera, otherwise that read throws.
        super.destroy(force);
        // Shadow cameras are created via `CameraUtil.createCamera3DObject(null, ...)`
        // with no parent, so they are NOT in the scene tree — scene.destroy() walks
        // entityChildren and would miss them. Destroy explicitly here.
        this.shadowCamera?.object3D?.destroy(force);
        this.shadowCamera = null;
        if (this.csmShadowCamera) {
            for (const cam of this.csmShadowCamera) cam?.object3D?.destroy(force);
            this.csmShadowCamera.length = 0;
        }
    }
}
