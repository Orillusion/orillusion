import { View3D } from "../../core/View3D";
import { Object3D } from "../../core/entities/Object3D";
import { MeshRenderer } from "./MeshRenderer";
import { RendererMask } from "../../gfx/renderJob/passRenderer/state/RendererMask";
import { StorageGPUBuffer } from "../../gfx/graphics/webGpu/core/buffer/StorageGPUBuffer";
import { RendererType } from "../../gfx/renderJob/passRenderer/state/RendererType";
import { ClusterLightingRender } from "../../gfx/renderJob/passRenderer/cluster/ClusterLightingRender";
import { RendererPassState } from "../../gfx/renderJob/passRenderer/state/RendererPassState";
import { SkeletonAnimationComponent } from "../SkeletonAnimationComponent";
import { ClusterLightingBuffer } from "../../gfx/renderJob/passRenderer/cluster/ClusterLightingBuffer";

/**
 * Skin Mesh Renderer Component
 * Renders a deformable mesh.
 * Deformable meshes include skin meshes (meshes with bones and bound poses),
 * meshes with mixed shapes, and meshes running cloth simulations.
 * @group Components
 */
export class SkinnedMeshRenderer extends MeshRenderer {
  public skinJointsName: Array<string>;
  protected mInverseBindMatrixData: Array<Float32Array>;
  protected mInverseBindMatrixBuffer: StorageGPUBuffer;
  protected mSkeletonAnimation: SkeletonAnimationComponent;
  protected mJointIndexTableBuffer: StorageGPUBuffer;

  constructor() {
    super();
    this.addRendererMask(RendererMask.SkinnedMesh);
  }

  public start() {
    super.start();
    this.skeletonAnimation = this.object3D.getComponent(SkeletonAnimationComponent);
    if (!this.skeletonAnimation) {
      let comps = this.object3D.parentObject.parentObject.getComponentsInChild(SkeletonAnimationComponent);
      if (comps.length > 0) {
        this.skeletonAnimation = comps[0];
      }
      if (!this.skeletonAnimation) {
        this.skeletonAnimation = this.object3D.getComponentFromParent(SkeletonAnimationComponent);
      }
    }
  }

  public onEnable(): void {
    super.onEnable();
  }

  public get skeletonAnimation(): SkeletonAnimationComponent {
    return this.mSkeletonAnimation;
  }

  public set skeletonAnimation(value: SkeletonAnimationComponent) {
    this.mSkeletonAnimation = value;
    if (!value) {
      return;
    }

    if (!this.mJointIndexTableBuffer) {
      let skinJointIndexData = this.mSkeletonAnimation.getJointIndexTable(this.skinJointsName);
      this.mJointIndexTableBuffer = new StorageGPUBuffer(skinJointIndexData.length * 4, 0, new Float32Array(skinJointIndexData));
      this.mJointIndexTableBuffer.visibility = GPUShaderStage.VERTEX | GPUShaderStage.COMPUTE;
    }
  }

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

  public get inverseBindMatrixBuffer(): StorageGPUBuffer {
    return this.mInverseBindMatrixBuffer;
  }

  public get jointIndexTableBuffer(): GPUBuffer {
    return this.mJointIndexTableBuffer.buffer;
  }

  public cloneTo(obj: Object3D) {
    let skinnedMesh = obj.addComponent(SkinnedMeshRenderer);
    skinnedMesh.geometry = this.geometry;
    skinnedMesh.material = this.material.clone();
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
  public nodeUpdate(view: View3D, passType: RendererType, renderPassState: RendererPassState, clusterLightingBuffer: ClusterLightingBuffer) {
    for (let i = 0; i < this.materials.length; i++) {
      const material = this.materials[i];
      let passes = material.renderPasses.get(passType);
      if (passes) for (let i = 0; i < passes.length; i++) {
        const renderShader = passes[i].renderShader;
        if (!renderShader.pipeline) {
          renderShader.setStorageBuffer('jointsMatrixIndexTable', this.mSkeletonAnimation.jointMatrixIndexTableBuffer);
          renderShader.setStorageBuffer('jointsInverseMatrix', this.mInverseBindMatrixBuffer);
          renderShader.setStorageBuffer('jointsIndexMapingTable', this.mJointIndexTableBuffer);
        }
      }
    }
    super.nodeUpdate(view, passType, renderPassState, clusterLightingBuffer);
  }

}
