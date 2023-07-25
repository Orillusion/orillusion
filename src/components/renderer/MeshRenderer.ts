import { Object3D } from '../../core/entities/Object3D';
import { View3D } from '../../core/View3D';
import { ClusterLightingBuffer } from '../../gfx/renderJob/passRenderer/cluster/ClusterLightingBuffer';
import { GeometryBase } from '../../core/geometry/GeometryBase';
import { RendererMask } from '../../gfx/renderJob/passRenderer/state/RendererMask';
import { RendererPassState } from '../../gfx/renderJob/passRenderer/state/RendererPassState';
import { RendererType } from '../../gfx/renderJob/passRenderer/state/RendererType';
import { MaterialBase } from '../../materials/MaterialBase';
import { MorphTargetData } from '../anim/morphAnim/MorphTargetData';
import { RenderNode } from './RenderNode';
import { EditorInspector } from '../../util/SerializeDecoration';

/**
 * The mesh renderer component is a component used to render the mesh
 * @group Components
 */
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
            this.onCompute = null;
        }

        this.object3D.bound = this._geometry.bounds.clone();
        if (this._readyPipeline) {
            this.initPipeline();
        }
    }

    /**
     * material
     */
    @EditorInspector
    public get material(): MaterialBase {
        return this._materials[0];
    }

    @EditorInspector
    public set material(value: MaterialBase) {
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
    public nodeUpdate(view: View3D, passType: RendererType, renderPassState: RendererPassState, clusterLightingBuffer: ClusterLightingBuffer) {
        if (this.morphData && this.morphData.enable) {
            for (let i = 0; i < this.materials.length; i++) {
                const material = this.materials[i];
                let passes = material.renderPasses.get(passType);
                if (passes) {
                    for (let j = 0; j < passes.length; j++) {
                        const renderShader = passes[j].renderShader;
                        this.morphData.applyRenderShader(renderShader);
                    }
                }
            }
        }
        super.nodeUpdate(view, passType, renderPassState, clusterLightingBuffer);
    }

    public destroy(force?: boolean): void {
        super.destroy(force);
    }

}
