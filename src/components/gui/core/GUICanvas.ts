import { Object3D } from "../../../core/entities/Object3D";
import { ComponentBase } from "../../ComponentBase";

/**
 * GUI Root Container
 * @group GPU GUI
 */
export class GUICanvas extends ComponentBase {

    public index: number = 0;

    /**
     *
     * Add an Object3D
     * @param child Object3D
     * @returns
     */
    public addChild(child: Object3D): this {
        this.object3D.addChild(child);
        return this;
    }

    /**
    *
    * Remove the child
    * @param child Removed Object3D
    */
    public removeChild(child: Object3D): this {
        this.object3D.removeChild(child);
        return this;
    }


    public cloneTo(obj: Object3D) {
        console.error('UICanvas Can not be Clone!');
    }
}
