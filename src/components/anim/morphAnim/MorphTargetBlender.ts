import { MorphTargetMapper } from "./MorphTargetKey";
import { Object3D } from "../../../core/entities/Object3D";
import { Matrix4 } from "../../../math/Matrix4";
import { Quaternion } from "../../../math/Quaternion";
import { Vector3 } from "../../../math/Vector3";
import { ComponentBase } from "../../ComponentBase";
import { MorphTargetFrame } from "./MorphTargetFrame";
import { SkinnedMeshRenderer2 } from "../../renderer/SkinnedMeshRenderer2";
import { RendererMask, RendererMaskUtil } from "../../../gfx/renderJob/passRenderer/state/RendererMask";
import { Ctor } from "../../../util/Global";
import { MeshRenderer } from "../../renderer/MeshRenderer";

export class MorphTargetBlender extends ComponentBase {
    private _targetRenderers: { [key: string]: SkinnedMeshRenderer2[] } = {};
    private _vec3 = new Vector3();
    private _matrix4: Matrix4 = new Matrix4();
    private _quaternion: Quaternion = new Quaternion();

    public init(param?: any): void {
        let meshRenders: SkinnedMeshRenderer2[] = this.fetchMorphRenderers(this.object3D, SkinnedMeshRenderer2);
        let meshRenders2: MeshRenderer[] = this.fetchMorphRenderers(this.object3D, MeshRenderer);
        meshRenders.push(...meshRenders2 as any);

        for (const renderer of meshRenders) {
            let hasMorphTarget = RendererMaskUtil.hasMask(renderer.rendererMask, RendererMask.MorphTarget);
            if (hasMorphTarget) {
                renderer.selfCloneMaterials('MORPH_TARGET_UUID');
            }
            for (const key in renderer.geometry.morphTargetDictionary) {
                let renderList = this._targetRenderers[key] || [];
                renderList.push(renderer);
                this._targetRenderers[key] = renderList;
            }
        }

    }

    public getMorphRenderersByKey(key: string): SkinnedMeshRenderer2[] {
        return this._targetRenderers[key];
    }

    public cloneMorphRenderers(): { [key: string]: SkinnedMeshRenderer2[] } {
        let dst = {} as any;
        for (let key in this._targetRenderers) {
            dst[key] = this._targetRenderers[key];
        }
        return dst;
    }


    /**
     * Inject arkit data into the model and let all meshRender below the node accept morph animation
     * @param frame: BlendShape data output from ARKit.
     * @param keyMapper: Table mapping the relationship between the model's modelKey and ARKit's output arkitKey: {modelKey: arkitKey}.
     * @param multiplier: Scaling factor for movement data.
     * @returns
     */
    public applyBlendShape(frame: MorphTargetFrame, keyMapper: MorphTargetMapper, multiplier: number = 1): void {
        if (!frame) {
            console.warn('blendShape is null');
            return;
        }
        //transform
        this._vec3.setFromArray(frame.transform.transform[3]);
        this._vec3.multiplyScalar(multiplier);
        this.object3D.transform.localPosition = this._vec3;
        //rotation
        this._vec3.setFromArray(frame.transform.transform[2]);
        this._matrix4.copyColFrom(2, this._vec3);
        this._vec3.setFromArray(frame.transform.transform[1]);
        this._matrix4.copyColFrom(1, this._vec3);
        this._vec3.setFromArray(frame.transform.transform[0]);
        this._matrix4.copyColFrom(0, this._vec3);

        this._matrix4.transpose();
        this._quaternion.fromMatrix(this._matrix4);
        this.object3D.localQuaternion = this._quaternion;
        //morph
        for (let keyInModel in keyMapper) {
            let renderList = this._targetRenderers[keyInModel];
            let stdKey = keyMapper[keyInModel];
            let influence = frame.texture[stdKey];
            this.applyMorphTargetInfluence(keyInModel, influence, renderList);
        }
    }

    private applyMorphTargetInfluence(key: string, influence: number, rendererList: SkinnedMeshRenderer2[]): void {
        for (let renderer of rendererList) {
            renderer.setMorphInfluence(key, influence);
        }
    }

    private fetchMorphRenderers<T extends MeshRenderer>(obj: Object3D, c: Ctor<T>): T[] {
        let sourceRenders: T[] = obj.getComponentsInChild(c);
        let result: T[] = [];
        for (let renderer of sourceRenders) {
            if (renderer.hasMask(RendererMask.MorphTarget)) {
                result.push(renderer);
            }
        }
        return result;
    }
}