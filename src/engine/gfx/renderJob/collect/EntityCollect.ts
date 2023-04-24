import { Graphic3DBatchRenderer, Graphic3DFillRenderer, Graphic3DLineBatchRenderer, ReflectionProbeComponent, RendererMaskUtil, RenderLayer, RenderLayerUtil } from '../../../..';
import { LightBase } from '../../../components/lights/LightBase';
import { RenderNode } from '../../../components/renderer/RenderNode';
import { SkyRenderer } from '../../../components/renderer/SkyRenderer';
import { Scene3D } from '../../../core/Scene3D';
import { Probe } from '../passRenderer/ddgi/Probe';
import { CollectInfo } from './CollectInfo';
import { EntityBatchCollect } from './EntityBatchCollect';
import { RenderGroup } from './RenderGroup';
/**
 * @internal
 * @group Post
 */
export class EntityCollect {
    // private static  _sceneRenderList: Map<Scene3D, RenderNode[]>;
    private _sceneLights: Map<Scene3D, LightBase[]>;
    private _sceneGIProbes: Map<Scene3D, Probe[]>;
    private _sceneReflectionProbes: Map<Scene3D, ReflectionProbeComponent[]>;

    private _source_opaqueRenderNodes: Map<Scene3D, RenderNode[]>;
    private _source_transparentRenderNodes: Map<Scene3D, RenderNode[]>;

    private _graphics: Graphic3DBatchRenderer[];

    private _op_renderGroup: Map<Scene3D, EntityBatchCollect>;
    private _tr_renderGroup: Map<Scene3D, EntityBatchCollect>;

    public state: {
        /**
         * gi effect lighting change
         */
        giLightingChange: boolean
    } = {
            giLightingChange: true
        }

    public sky: SkyRenderer;

    private _collectInfo: CollectInfo;

    private static _instance: EntityCollect;
    public static get instance() {
        if (!this._instance) {
            this._instance = new EntityCollect();
        }
        return this._instance;
    }

    constructor() {
        // this._sceneRenderList = new Map<Scene3D, RenderNode[]>();
        this._sceneLights = new Map<Scene3D, LightBase[]>();
        this._sceneGIProbes = new Map<Scene3D, Probe[]>();
        this._sceneReflectionProbes = new Map<Scene3D, ReflectionProbeComponent[]>();

        this._source_opaqueRenderNodes = new Map<Scene3D, RenderNode[]>();
        this._source_transparentRenderNodes = new Map<Scene3D, RenderNode[]>();

        this._graphics = [];

        this._op_renderGroup = new Map<Scene3D, EntityBatchCollect>();
        this._tr_renderGroup = new Map<Scene3D, EntityBatchCollect>();

        this._collectInfo = new CollectInfo();
    }

    private getPashList(root: Scene3D, renderNode: RenderNode) {
        if (renderNode[`renderOrder`] < 3000) {
            return this._source_opaqueRenderNodes.get(root);
        } else if (renderNode[`renderOrder`] >= 3000) {
            return this._source_transparentRenderNodes.get(root);
        }
    }

    private sortRenderNode(list: RenderNode[], renderNode: RenderNode) {
        for (let i = list.length - 1; i > 0; i--) {
            const element = list[i];
            if (element[`renderOrder`] < renderNode[`renderOrder`]) {
                list.push(renderNode);
                return;
            }
        }
        list.push(renderNode);
    }

    public addRenderNode(root: Scene3D, renderNode: RenderNode) {
        if (!root) return;
        if (renderNode instanceof SkyRenderer) {
            this.sky = renderNode;
        } else if (renderNode instanceof Graphic3DBatchRenderer) {
            if (this._graphics.indexOf(renderNode) == -1) {
                this._graphics.push(renderNode);
            }
        } else if (!RenderLayerUtil.hasMask(renderNode.object3D.renderLayer, RenderLayer.None)) {
            this.removeRenderNode(root, renderNode);
            if (renderNode[`renderOrder`] < 3000) {
                if (!this._op_renderGroup.has(root)) {
                    this._op_renderGroup.set(root, new EntityBatchCollect());
                }
                this._op_renderGroup.get(root).collect_add(renderNode);
            } else if (renderNode[`renderOrder`] >= 3000) {
                if (!this._tr_renderGroup.has(root)) {
                    this._tr_renderGroup.set(root, new EntityBatchCollect());
                }
                this._tr_renderGroup.get(root).collect_add(renderNode);
            }
        } else {
            this.removeRenderNode(root, renderNode);
            if (renderNode[`renderOrder`] < 3000) {
                if (!this._source_opaqueRenderNodes.has(root)) {
                    this._source_opaqueRenderNodes.set(root, []);
                }
                this._source_opaqueRenderNodes.get(root).push(renderNode);
            } else if (renderNode[`renderOrder`] >= 3000) {
                if (!this._source_transparentRenderNodes.has(root)) {
                    this._source_transparentRenderNodes.set(root, []);
                }
                this._source_transparentRenderNodes.get(root).push(renderNode);
            }

            let list = this.getPashList(root, renderNode);
            let index = list.indexOf(renderNode);
            if (index == -1) {
                this.sortRenderNode(list, renderNode);
            }
        }
        renderNode.object3D.renderNode = renderNode;
    }

    public removeRenderNode(root: Scene3D, renderNode: RenderNode) {
        if (renderNode instanceof SkyRenderer) {
            this.sky = null;
        } else if (!RenderLayerUtil.hasMask(renderNode.object3D.renderLayer, RenderLayer.None)) {

        } else {
            let list = this.getPashList(root, renderNode);
            if (list) {
                let index = list.indexOf(renderNode);
                if (index != -1) {
                    list.splice(index, 1);
                }
            }
        }
    }

    public addLight(root: Scene3D, light: LightBase) {
        if (!this._sceneLights.has(root)) {
            this._sceneLights.set(root, [light]);
        } else {
            let hasLight = this._sceneLights.get(root).indexOf(light) != -1;
            if (!hasLight)
                this._sceneLights.get(root).push(light);
        }
    }

    public removeLight(root: Scene3D, light: LightBase) {
        if (this._sceneLights.has(root)) {
            let list = this._sceneLights.get(root);
            let index = list.indexOf(light);
            if (index != -1) {
                list.splice(index, 1);
            }
        }
    }

    public addGIProbe(root: Scene3D, probe: Probe) {
        if (!this._sceneGIProbes.has(root)) {
            this._sceneGIProbes.set(root, [probe]);
        } else {
            this._sceneGIProbes.get(root).push(probe);
        }
    }

    public removeGIProbe(root: Scene3D, probe: Probe) {
        if (this._sceneGIProbes.has(root)) {
            let list = this._sceneGIProbes.get(root);
            let index = list.indexOf(probe);
            if (index != -1) {
                list.splice(index, 1);
            }
        }
    }


    public addReflectionProbe(root: Scene3D, probe: ReflectionProbeComponent) {
        if (!this._sceneReflectionProbes.has(root)) {
            this._sceneReflectionProbes.set(root, [probe]);
        } else {
            this._sceneReflectionProbes.get(root).push(probe);
        }
    }

    public removeReflectionProbe(root: Scene3D, probe: ReflectionProbeComponent) {
        if (this._sceneReflectionProbes.has(root)) {
            let list = this._sceneReflectionProbes.get(root);
            let index = list.indexOf(probe);
            if (index != -1) {
                list.splice(index, 1);
            }
        }
    }

    public getLights(root: Scene3D): LightBase[] {
        let list = this._sceneLights.get(root);
        return list ? list : [];
    }

    public getProbes(root: Scene3D) {
        let list = this._sceneGIProbes.get(root);
        return list ? list : [];
    }

    public getReflectionProbes(root: Scene3D) {
        let list = this._sceneReflectionProbes.get(root);
        return list ? list : [];
    }


    public getRenderNodes(scene: Scene3D): CollectInfo {
        this._collectInfo.clean();
        this._collectInfo.sky = this.sky;

        let list2 = this._source_opaqueRenderNodes.get(scene);
        if (list2) {
            this._collectInfo.opaqueList = list2.concat();
            this._collectInfo.offset = list2.length;
        }
        let list5 = this._source_transparentRenderNodes.get(scene);
        if (list5) {
            this._collectInfo.transparentList = list5.concat();
        }
        return this._collectInfo;
    }

    public getOpRenderGroup(scene: Scene3D): EntityBatchCollect {
        return this._op_renderGroup.get(scene);
    }

    public getTrRenderGroup(scene: Scene3D): EntityBatchCollect {
        return this._tr_renderGroup.get(scene);
    }

    public getGraphicList(): Graphic3DBatchRenderer[] {
        return this._graphics;
    }
}
