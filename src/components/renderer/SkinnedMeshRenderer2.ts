import { View3D } from "../../core/View3D";
import { Object3D } from "../../core/entities/Object3D";
import { MeshRenderer } from "./MeshRenderer";
import { RendererMask } from "../../gfx/renderJob/passRenderer/state/RendererMask";
import { StorageGPUBuffer } from "../../gfx/graphics/webGpu/core/buffer/StorageGPUBuffer";
import { PassType } from "../../gfx/renderJob/passRenderer/state/PassType";
import { RendererPassState } from "../../gfx/renderJob/passRenderer/state/RendererPassState";
import { ClusterLightingBuffer } from "../../gfx/renderJob/passRenderer/cluster/ClusterLightingBuffer";
import { AnimatorComponent, GeometryBase, LitMaterial, Material, Matrix4, RegisterComponent } from "../..";

/**
 * Skin Mesh Renderer Component
 * Renders a deformable mesh.
 * Deformable meshes include skin meshes (meshes with bones and bound poses),
 * meshes with mixed shapes, and meshes running cloth simulations.
 * @group Components
 */
@RegisterComponent(SkinnedMeshRenderer2, 'SkinnedMeshRenderer2')
export class SkinnedMeshRenderer2 extends MeshRenderer {
    /** Ordered names of the joints this skin is bound to. */
    public skinJointsName: Array<string>;
    protected mInverseBindMatrixData: Array<Float32Array>;
    protected mInverseBindMatrixBuffer: StorageGPUBuffer;
    protected mSkeletonAnimation: AnimatorComponent;
    protected mJointIndexTableBuffer: StorageGPUBuffer;

    constructor() {
        super();
        this.addRendererMask(RendererMask.SkinnedMesh);
    }

    /** The skinned geometry; setting it extracts skin joint names and bind poses. */
    public get geometry(): GeometryBase {
        return this._geometry;
    }

    public set geometry(value: GeometryBase) {
        this.skinJointsName = value.skinNames;
        let matrixList: Float32Array[] = [];
        for (let i = 0; i < value.bindPose.length; i++) {
            matrixList.push(new Float32Array(value.bindPose[i].rawData.slice(0, 16)));
        }
        this.skinInverseBindMatrices = matrixList;
        super.geometry = value;
        // Force USE_SKELETON on any materials that were already attached.
        // (Materials may have been set before geometry; covers both orders.)
        this._forceSkeletonDefine();
    }

    /** The materials applied to this skinned mesh. */
    public get materials(): Material[] {
        return super.materials;
    }

    /**
     * Override the materials setter so we can stamp `USE_SKELETON = true`
     * on every material's pass(es) AFTER `super.materials` has run
     * `initPipeline`. Why this is needed:
     *
     *   - glTF often shares one LitMaterial across multiple primitives
     *     (Kira: skin-driven `Kira_Hair_A.0020` and the static
     *     `Kira_Hair_A` reuse the same `matkey_<name>` cached material).
     *   - The first time the material is attached to a non-skinned
     *     MeshRenderer, `initPipeline` calls `preCompile`, which runs
     *     `preDefine(geometry-without-joints0)` and writes
     *     `USE_SKELETON = false` into the pass's defineValue map.
     *   - When the same material is later attached to a
     *     SkinnedMeshRenderer2, `initPipeline` sees the pass already has
     *     `shaderReflection` and SKIPS preCompile entirely → the stale
     *     `USE_SKELETON = false` sticks, the vertex shader's skinning
     *     branch is preprocessed out, and the mesh renders unskinned at
     *     the mesh node's worldMatrix (Kira's "head + jacket detached
     *     from bones" symptom).
     *
     * `setDefine` flips `_shaderChange` / `_valueChange`, so the next
     * `nodeUpdate` re-runs `preCompile` (this time WITH the skin's
     * geometry that has joints0) and rebuilds the pipeline with
     * USE_SKELETON correctly applied.
     */
    public set materials(value: Material[]) {
        super.materials = value;
        this._forceSkeletonDefine();
    }

    private _forceSkeletonDefine() {
        const list = this._materials;
        if (!list || list.length === 0) return;
        const passTypes = [PassType.COLOR, PassType.SHADOW, PassType.DEPTH, PassType.POINT_SHADOW, PassType.VELOCITY];
        for (const mat of list) {
            const ps = (mat as any)?.shader?.passShader;
            if (!ps) continue;
            for (const pt of passTypes) {
                const passes = ps.get?.(pt);
                if (!passes) continue;
                for (const pass of passes) pass.setDefine('USE_SKELETON', true);
            }
        }
    }

    /** Resolve the driving AnimatorComponent from the hierarchy if not already set. */
    public start() {
        super.start();
        // If GLTFSubParserConverter has already wired our skeletonAnimation
        // (the common case — it does so via either direct assignment when
        // the skin's root node was already converted, or via the
        // `_pendingSkinned` queue once that node IS processed), keep it.
        //
        // Without this guard the unconditional reassignment below picks up
        // the WRONG animator in scenes with multiple skinned characters:
        // start() fires asynchronously, and by then the top-ancestor walk
        // climbs all the way to scene3D root and getComponentsInChild()
        // returns animators from EVERY loaded GLB. The first match wins —
        // so a Soldier SMR loaded after Michelle was binding its mesh to
        // Michelle's animator (verified via Sample_AnimationRetargeting).
        if (this.skeletonAnimation) return;

        this.skeletonAnimation = this.object3D.getComponent(AnimatorComponent);
        if (this.skeletonAnimation) return;

        // Last-resort fallback: the AnimatorComponent often lives on a
        // SIBLING node of this mesh — for glTFs like Kira's, the skin's
        // joint root (e.g. spine_03) and the mesh node (e.g. Kira_Hair_A)
        // are cousins under the gltf loader root, not parent-child.
        // Walking only UP the parent chain misses such layouts.
        //
        // Walk up ONE ancestor at a time, and at each level search that
        // ancestor's subtree for an animator. Stop at the closest
        // enclosing animator. This is critical for scenes with multiple
        // skinned characters (e.g. Sample_Skeleton2 cloning Soldier, or
        // Sample_AnimationRetargeting with two GLBs side-by-side):
        // walking all the way to scene root and taking found[0] would
        // bind every cloned mesh to whichever character was loaded first
        // — making clones appear to share one skeleton.
        let cursor: Object3D = this.object3D;
        while (cursor) {
            const found = cursor.getComponentsInChild(AnimatorComponent);
            if (found.length > 0) {
                this.skeletonAnimation = found[0];
                return;
            }
            const parent = cursor.parent && (cursor.parent.object3D as Object3D);
            if (!parent) break;
            cursor = parent;
        }
    }

    /** Blend-shape (morph) data, mapping target name to influence value. */
    public get blendShape() {
        // key: string, value: number
        return this.morphData
    }

    /** Register the renderer when enabled. */
    public onEnable(): void {
        super.onEnable();
    }

    /** The AnimatorComponent driving this skin. */
    public get skeletonAnimation(): AnimatorComponent {
        return this.mSkeletonAnimation;
    }

    public set skeletonAnimation(value: AnimatorComponent) {
        this.mSkeletonAnimation = value;
        if (!value) {
            return;
        }

        if (!this.mJointIndexTableBuffer) {
            let skinJointIndexData = this.mSkeletonAnimation.getJointIndexTable(this.skinJointsName);
            this.mJointIndexTableBuffer = new StorageGPUBuffer(skinJointIndexData.length, 0, new Float32Array(skinJointIndexData));
            this.mJointIndexTableBuffer.visibility = GPUShaderStage.VERTEX | GPUShaderStage.COMPUTE;
        }
    }

    /** Per-joint inverse bind matrices used to skin the mesh. */
    public get skinInverseBindMatrices(): Array<Float32Array> {
        return this.mInverseBindMatrixData;
    }

    public set skinInverseBindMatrices(inverseBindMatrices: Array<Float32Array>) {
        this.mInverseBindMatrixData = inverseBindMatrices;
        var inverseBindMatricesData = new Float32Array(inverseBindMatrices.length * 16);
        for (let i = 0; i < inverseBindMatrices.length; i++) {
            let index = i * 16;
            let mat4x4 = inverseBindMatrices[i];
            inverseBindMatricesData.set(mat4x4, index);
        }
        this.mInverseBindMatrixBuffer = new StorageGPUBuffer(inverseBindMatricesData.byteLength, 0, inverseBindMatricesData);
        this.mInverseBindMatrixBuffer.visibility = GPUShaderStage.VERTEX | GPUShaderStage.COMPUTE;
    }

    /** GPU buffer holding the inverse bind matrices. */
    public get inverseBindMatrixBuffer(): StorageGPUBuffer {
        return this.mInverseBindMatrixBuffer;
    }

    /** GPU buffer mapping skin joints to skeleton joint indices. */
    public get jointIndexTableBuffer(): GPUBuffer {
        return this.mJointIndexTableBuffer.buffer;
    }

    /** Clone this skinned mesh renderer (with cloned materials) onto another object. */
    public cloneTo(obj: Object3D) {
        let skinnedMesh = obj.addComponent(SkinnedMeshRenderer2);
        let newMats = [];
        for (const mat of this.materials) {
            newMats.push(mat.clone());
        }
        skinnedMesh.materials = newMats;
        skinnedMesh.geometry = this.geometry;
        skinnedMesh.castShadow = this.castShadow;
        skinnedMesh.castGI = this.castGI;
        skinnedMesh.receiveShadow = this.receiveShadow;
        skinnedMesh.rendererMask = this.rendererMask;
        skinnedMesh.skinJointsName = this.skinJointsName;
        skinnedMesh.skinInverseBindMatrices = this.skinInverseBindMatrices;
        skinnedMesh.mJointIndexTableBuffer = this.mJointIndexTableBuffer;
    }

    /**
     * @internal
     * @param passType
     * @param renderPassState
     * @param scene3D
     * @param clusterLightingRender
     * @param probes
     */
    public nodeUpdate(view: View3D, passType: PassType, renderPassState: RendererPassState, clusterLightingBuffer: ClusterLightingBuffer) {
        for (let i = 0; i < this.materials.length; i++) {
            const material = this.materials[i];
            let passes = material.getPass(passType);
            if (passes) for (let i = 0; i < passes.length; i++) {
                const renderShader = passes[i];
                // Bind the skin storage buffers ONCE when the renderShader
                // first sees an Animator linked to this renderer. The old
                // gate `!renderShader.pipeline && mSkeletonAnimation`
                // missed Kira-style rigs where the Animator lives on a
                // sibling node — `start()` fires too late, the pipeline is
                // built without skeleton bindings, and the gate never fires
                // again. We instead track per-pass which renderShader has
                // already been bound and bind on the first frame
                // mSkeletonAnimation is non-null. The pipeline gets
                // (re)created on the next pipeline build with proper
                // bindings.
                if (this.mSkeletonAnimation && !this._skinBoundShaders.has(renderShader)) {
                    const hadPipeline = !!(renderShader as any).pipeline;
                    renderShader.setStorageBuffer('jointsMatrixIndexTable', this.mSkeletonAnimation.jointMatrixIndexTableBuffer);
                    renderShader.setStorageBuffer('jointsInverseMatrix', this.mInverseBindMatrixBuffer);
                    renderShader.setStorageBuffer('jointsIndexMapingTable', this.mJointIndexTableBuffer);
                    if (hadPipeline) {
                        // Pipeline was built before skin storage buffers
                        // were bound (typical for glTFs whose Animator
                        // lives on a sibling of the mesh node). Force a
                        // rebuild so the new bind group includes the
                        // skin entries — without this, frame 0 renders
                        // skinned meshes at degenerate positions.
                        (renderShader as any).pipeline = null;
                        (renderShader as any)._valueChange = true;
                    }
                    this._skinBoundShaders.add(renderShader);
                }
            }
        }
        super.nodeUpdate(view, passType, renderPassState, clusterLightingBuffer);
    }

    /** Per-renderShader memoization for skin-buffer binding (see nodeUpdate). */
    private _skinBoundShaders: WeakSet<any> = new WeakSet();
}