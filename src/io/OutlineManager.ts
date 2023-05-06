import { MeshRenderer } from "../components/renderer/MeshRenderer";
import { Object3D } from "../core/entities/Object3D";
import { Color } from "../math/Color";
import { outlinePostData } from "./OutlinePostData";

/**
 * manager of outline effect
 * @group IO
 */
export class OutlinePostManager {

    private _tempIndexArray: number[] = [];

    /**
     * config outline manager.
     * Specify specific 3D objects to use the specified color for display outline
     * @param objectList A set of 3D objects
     * @param color Specified color for outline
     */
    public setOutline(objectList: Object3D[], color?: Color) {
        this.setOutlineList([objectList], color ? [color] : null);
    }

    /**
     * config outline manager.
     * The first set of objects uses the first color to display outline, and so on
     * @param groupList A group of 3D objects set
     * @param colorList Specified color list for outline
     */
    public setOutlineList(groupList: Object3D[][], colorList?: Color[]) {
        groupList ||= [];
        let defaultColor = outlinePostData.defaultColor;
        let maxGroup = outlinePostData.SlotCount;
        for (let i = 0; i < maxGroup; i++) {
            this._tempIndexArray.length = 0;
            let group = groupList[i];
            let color = (colorList ? colorList[i] : null) || defaultColor;
            if (group) {
                for (const item of group) {
                    this.getEntityIdList(item, this._tempIndexArray);
                }
            }
            outlinePostData.fillDataAt(i, this._tempIndexArray, color);
        }
    }

    /**
     * clear outline effect
     */
    public clearOutline(): this {
        outlinePostData.clear();
        return this;
    }

    private _rendererList: MeshRenderer[] = [];

    private getEntityIdList(item: Object3D, target: number[]): void {
        this._rendererList.length = 0;
        let renderers = item.getComponents(MeshRenderer, this._rendererList);
        for (const render of renderers) {
            target.push(render.object3D.transform._worldMatrix.index);
        }
    }


}

/**
 * @internal
 */
export let outlinePostManager: OutlinePostManager = new OutlinePostManager();
