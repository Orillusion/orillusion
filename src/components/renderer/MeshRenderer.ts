import { Object3D } from '../../core/entities/Object3D';
import { View3D } from '../../core/View3D';
import { ClusterLightingBuffer } from '../../gfx/renderJob/passRenderer/cluster/ClusterLightingBuffer';
import { GeometryBase } from '../../core/geometry/GeometryBase';
import { RendererMask } from '../../gfx/renderJob/passRenderer/state/RendererMask';
import { RendererPassState } from '../../gfx/renderJob/passRenderer/state/RendererPassState';
import { PassType } from '../../gfx/renderJob/passRenderer/state/RendererType';
import { MorphTargetData } from '../anim/morphAnim/MorphTargetData';
import { RenderNode } from './RenderNode';
import { EditorInspector, RegisterComponent } from '../../util/SerializeDecoration';
import { Color, Material, mergeFunctions } from '../..';

/**
 * The mesh renderer component is a component used to render the mesh
 * @group Components
 */
@RegisterComponent(MeshRenderer, 'MeshRenderer')
export class MeshRenderer extends RenderNode {
    /**
     * Enabling this option allows the grid to display any shadows cast on the grid.
     */
    public receiveShadow: boolean;
    protected morphData: MorphTargetData;

    constructor() {
        super();
    }

    public onEnable(): void {
        super.onEnable();
    }

    public onDisable(): void {
        super.onDisable();
    }

    public cloneTo(obj: Object3D): void {
        let component = obj.addComponent(MeshRenderer);
        component.copyComponent(this);
    }

    public copyComponent(from: this): this {
        super.copyComponent(from);
        this.receiveShadow = from.receiveShadow;
        return this;
    }

    /**
     * The geometry of the mesh determines its shape
     */
    @EditorInspector
    public get geometry(): GeometryBase {
        return this._geometry;
    }

    @EditorInspector
    public set geometry(value: GeometryBase) {
        //this must use super geometry has reference in super
        super.geometry = value;
        let isMorphTarget = value.morphTargetDictionary != null;
        if (isMorphTarget) {
            this.morphData ||= new MorphTargetData();
            this.morphData.morphTargetsRelative = value.morphTargetsRelative;
            this.morphData.initMorphTarget(value);
        }
        this.morphData && (this.morphData.enable = isMorphTarget);
        if (this.morphData && this.morphData.enable) {
            this.addRendererMask(RendererMask.MorphTarget);
        } else {
            this.removeRendererMask(RendererMask.MorphTarget);
            // this.onCompute = null;
        }

        this.object3D.bound = this._geometry.bounds.clone();
        if (!this._readyPipeline) {
            this.initPipeline();

            if (this._computes && this._computes) {
                this.onCompute = mergeFunctions(this.onCompute, () => {
                    for (let i = 0; i < this._computes.length; i++) {
                        const compute = this._computes[i];
                        compute.onUpdate();
                    }
                });
            }
        }
    }

    /**
     * material
     */
    @EditorInspector
    public get material(): Material {
        return this._materials[0];
    }

    @EditorInspector
    public set material(value: Material) {
        this.materials = [value];
    }

    /**
     * Set deformation animation parameters
     */
    public setMorphInfluence(key: string, value: number) {
        if (this.morphData && this.morphData.enable) {
            let index = this._geometry.morphTargetDictionary[key];
            if (index >= 0) {
                this.morphData.updateInfluence(index, value);
            }
        }
    }

    public setMorphInfluenceIndex(index: number, value: number) {
        if (this.morphData && this.morphData.enable) {
            if (index >= 0) {
                this.morphData.updateInfluence(index, value);
            }
        }
    }


    public onCompute(view: View3D, command: GPUCommandEncoder): void {
        if (this.morphData && this.morphData.enable) {
            this.morphData.computeMorphTarget(command);
        }
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
        if (this.morphData && this.morphData.enable) {
            for (let i = 0; i < this.materials.length; i++) {
                const material = this.materials[i];
                let passes = material.getPass(passType);
                if (passes) {
                    for (let j = 0; j < passes.length; j++) {
                        this.morphData.applyRenderShader(passes[j]);
                    }
                }
            }
        }
        super.nodeUpdate(view, passType, renderPassState, clusterLightingBuffer);
    }

    public destroy(force?: boolean): void {
        super.destroy(force);
    }

    // public onGraphic(view?: View3D) {
    //     if (this._geometry)
    //         view.graphic3D.drawMeshWireframe(this._geometry.instanceID, this._geometry, this.transform, Color.COLOR_RED);
    // }
}
