
import { Graphic3DMeshRenderer } from '../../..';
import { Engine3D } from '../../../Engine3D';
import { ILight } from '../../../components/lights/ILight';
import { RenderNode } from '../../../components/renderer/RenderNode';
import { Camera3D } from '../../../core/Camera3D';
import { Scene3D } from '../../../core/Scene3D';
import { View3D } from '../../../core/View3D';
import { BoundingBox } from '../../../core/bound/BoundingBox';
import { GeometryBase } from '../../../core/geometry/GeometryBase';
import { Octree } from '../../../core/tree/octree/Octree';
import { Vector3 } from '../../../math/Vector3';
import { zSorterUtil } from '../../../util/ZSorterUtil';
import { RenderLayerUtil, RenderLayer } from '../config/RenderLayer';
import { Probe } from '../passRenderer/ddgi/Probe';
import { Graphic3DBatchRenderer } from '../passRenderer/graphic/Graphic3DBatchRenderer';
import { RendererMask } from '../passRenderer/state/RendererMask';
import { CollectInfo } from './CollectInfo';
import { EntityBatchCollect } from './EntityBatchCollect';
import { RenderShaderCollect } from './RenderShaderCollect';

/**
 * @internal
 * @group Post
 */
export class EntityCollect {
    private static _instance: EntityCollect;

    // private static  _sceneRenderList: Map<Scene3D, RenderNode[]>;
    private _sceneLights: Map<Scene3D, ILight[]>;
    private _sceneGIProbes: Map<Scene3D, Probe[]>;

    private _op_RenderNodes: Map<Scene3D, RenderNode[]>;
    private _tr_RenderNodes: Map<Scene3D, RenderNode[]>;
    private _octreeRenderNodes: Map<Scene3D, Octree>;

    private _graphics: Graphic3DBatchRenderer[];

    private _op_renderGroup: Map<Scene3D, EntityBatchCollect>;
    private _tr_renderGroup: Map<Scene3D, EntityBatchCollect>;

    private _renderShaderCollect: RenderShaderCollect;

    public state: {
        /**
         * gi effect lighting change
         */
        giLightingChange: boolean
    } = {
            giLightingChange: true
        }

    public sky: RenderNode;

    private _collectInfo: CollectInfo;

    private rendererOctree: Octree;
    public static get instance() {
        if (!this._instance) {
            this._instance = new EntityCollect();
        }
        return this._instance;
    }

    constructor() {
        // this._sceneRenderList = new Map<Scene3D, RenderNode[]>();
        this._sceneLights = new Map<Scene3D, ILight[]>();
        this._sceneGIProbes = new Map<Scene3D, Probe[]>();

        this._op_RenderNodes = new Map<Scene3D, RenderNode[]>();
        this._tr_RenderNodes = new Map<Scene3D, RenderNode[]>();

        this._graphics = [];

        this._op_renderGroup = new Map<Scene3D, EntityBatchCollect>();
        this._tr_renderGroup = new Map<Scene3D, EntityBatchCollect>();

        this._collectInfo = new CollectInfo();
        this._renderShaderCollect = new RenderShaderCollect();
        this._octreeRenderNodes = new Map<Scene3D, Octree>();
    }

    private getPashList(root: Scene3D, renderNode: RenderNode) {
        if (renderNode.renderOrder < 3000) {
            return this._op_RenderNodes.get(root);
        } else if (renderNode.renderOrder >= 3000) {
            return this._tr_RenderNodes.get(root);
        }
    }

    private sortRenderNode(list: RenderNode[], renderNode: RenderNode) {
        for (let i = list.length - 1; i > 0; i--) {
            const element = list[i];
            if (element.renderOrder < renderNode.renderOrder) {
                list.push(renderNode);
                return;
            }
        }
        list.push(renderNode);
    }

    public addRenderNode(root: Scene3D, renderNode: RenderNode) {
        if (!root) return;
        let isTransparent: boolean = renderNode.renderOrder >= 3000;
        if (renderNode.hasMask(RendererMask.Sky)) {
            this.sky = renderNode;
        } else if (renderNode instanceof Graphic3DBatchRenderer) {
            if (this._graphics.indexOf(renderNode) == -1) {
                this._graphics.push(renderNode);
            }
        } else if (!RenderLayerUtil.hasMask(renderNode.renderLayer, RenderLayer.None)) {
            this.removeRenderNode(root, renderNode);
            let group = isTransparent ? this._tr_renderGroup : this._op_renderGroup;
            if (!group.has(root)) {
                group.set(root, new EntityBatchCollect());
            }
            group.get(root).collect_add(renderNode);
        } else {
            this.removeRenderNode(root, renderNode);
            let map = isTransparent ? this._tr_RenderNodes : this._op_RenderNodes;
            if (!map.has(root)) {
                map.set(root, []);
            }
            map.get(root).push(renderNode);

            if (Engine3D.setting.occlusionQuery.octree) {
                renderNode.attachSceneOctree(this.getOctree(root));
            }

            let list = this.getPashList(root, renderNode);
            let index = list.indexOf(renderNode);
            if (index == -1) {
                this.sortRenderNode(list, renderNode);
            }
        }
        renderNode.object3D.renderNode = renderNode;

        this._renderShaderCollect.collect_add(renderNode);
    }

    private getOctree(root: Scene3D) {
        let octree: Octree;
        let setting = Engine3D.setting.occlusionQuery.octree;
        if (setting) {
            octree = this._octreeRenderNodes.get(root);
            if (!octree) {
                let center = new Vector3(setting.x, setting.y, setting.z);
                let size = new Vector3(setting.width, setting.height, setting.depth);
                let bound = new BoundingBox(center, size);
                octree = new Octree(bound);
                this._octreeRenderNodes.set(root, octree);
            }
        }
        return octree;
    }

    public removeRenderNode(root: Scene3D, renderNode: RenderNode) {
        renderNode.detachSceneOctree();
        if (renderNode.hasMask(RendererMask.Sky)) {
            this.sky = null;
        } else if (!RenderLayerUtil.hasMask(renderNode.renderLayer, RenderLayer.None)) {

        } else {
            let list = this.getPashList(root, renderNode);
            if (list) {
                let index = list.indexOf(renderNode);
                if (index != -1) {
                    list.splice(index, 1);
                }
            }
        }

        this._renderShaderCollect.collect_remove(renderNode);
    }

    public addLight(root: Scene3D, light: ILight) {
        if (!this._sceneLights.has(root)) {
            this._sceneLights.set(root, [light]);
        } else {
            let lights = this._sceneLights.get(root)
            if (lights.length >= Engine3D.setting.light.maxLight) {
                console.warn('Alreay meet maxmium light number:', Engine3D.setting.light.maxLight)
                return
            }
            let hasLight = lights.indexOf(light) != -1;
            if (!hasLight) {
                lights.push(light);
            }
        }
    }

    public removeLight(root: Scene3D, light: ILight) {
        if (this._sceneLights.has(root)) {
            let list = this._sceneLights.get(root);
            let index = list.indexOf(light);
            if (index != -1) {
                list.splice(index, 1);
            }
        }
    }
    public getLights(root: Scene3D): ILight[] {
        let list = this._sceneLights.get(root);
        return list ? list : [];
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

    public getProbes(root: Scene3D) {
        let list = this._sceneGIProbes.get(root);
        return list ? list : [];
    }

    // sort renderers by renderOrder and camera depth
    public autoSortRenderNodes(scene: Scene3D): this {
        let renderList: RenderNode[] = this._tr_RenderNodes.get(scene);
        if (!renderList)
            return;

        let needSort = false;
        for (const renderNode of renderList) {
            if (renderNode.isRenderOrderChange || renderNode.needSortOnCameraZ) {
                needSort = true;
                break;
            }
        }

        if (needSort) {
            for (const renderNode of renderList) {
                let __renderOrder = renderNode.renderOrder;
                if (renderNode.needSortOnCameraZ) {
                    let cameraDepth = zSorterUtil.worldToCameraDepth(renderNode.object3D);
                    cameraDepth = 1 - Math.max(0, Math.min(1, cameraDepth));//clamp to [0, 1]
                    __renderOrder += cameraDepth;
                }
                renderNode['__renderOrder'] = __renderOrder;
                //resume unchange status
                renderNode.isRenderOrderChange = false;
            }
            renderList.sort((a: RenderNode, b: RenderNode) => {
                return a['__renderOrder'] > b['__renderOrder'] ? 1 : -1;
            });
        }
        return this;
    }


    public getRenderNodes(scene: Scene3D, camera: Camera3D): CollectInfo {
        this.autoSortRenderNodes(scene);
        this._collectInfo.clean();
        this._collectInfo.sky = this.sky;

        if (Engine3D.setting.occlusionQuery.octree) {
            this.rendererOctree = this.getOctree(scene);
            this.rendererOctree.getRenderNode(camera.frustum, this._collectInfo);
        } else {
            let list2 = this._op_RenderNodes.get(scene);
            if (list2) {
                this._collectInfo.opaqueList = list2.concat();
            }
            let list5 = this._tr_RenderNodes.get(scene);
            if (list5) {
                this._collectInfo.transparentList = list5.concat();
            }
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

    public getRenderShaderCollect(view: View3D) {
        let viewList = this._renderShaderCollect.renderShaderUpdateList.get(view);
        return viewList;
    }
}
