import { RenderNode } from "../../../components/renderer/RenderNode";
import { View3D } from "../../../core/View3D";


export type RenderShaderList = Map<string, Map<string, RenderNode>>;

export class RenderShaderCollect {
    public renderShaderUpdateList: Map<View3D, RenderShaderList> = new Map<View3D, RenderShaderList>();
    public renderNodeList: Map<View3D, Map<string, RenderNode>> = new Map<View3D, Map<string, RenderNode>>();

    public collect_add(node: RenderNode) {
        let view = node.transform.view3D;
        if (view && node.materials) {
            node.materials.forEach((mat) => {
                let rDic = this.renderShaderUpdateList.get(view);
                if (!rDic) {
                    rDic = new Map<string, Map<string, RenderNode>>();
                    this.renderShaderUpdateList.set(view, rDic);
                }

                let renderGlobalMap = this.renderNodeList.get(view);
                if (!renderGlobalMap) {
                    renderGlobalMap = new Map<string, RenderNode>();
                    this.renderNodeList.set(view, renderGlobalMap);
                }
                renderGlobalMap.set(node.instanceID, node);

                let colorPassList = mat.getAllPass();
                for (let i = 0; i < colorPassList.length; i++) {
                    const pass = colorPassList[i];
                    let key = `${node.geometry.instanceID + pass.instanceID}`
                    let nodeMap = rDic.get(key);
                    if (!nodeMap) {
                        nodeMap = new Map<string, RenderNode>();
                        rDic.set(key, nodeMap);
                    }
                    nodeMap.set(node.instanceID, node);
                }
            });
        }
    }

    public collect_remove(node: RenderNode) {
        let view = node.transform.view3D;
        if (view && node.materials) {
            let rDic = this.renderShaderUpdateList.get(view);
            if (rDic) {
                node.materials.forEach((mat) => {
                    let colorPassList = mat.getAllPass();
                    for (let i = 0; i < colorPassList.length; i++) {
                        const pass = colorPassList[i];
                        let key = `${node.geometry.instanceID + pass.instanceID}`
                        rDic.delete(key);
                    }
                });
            }
        }
    }
}