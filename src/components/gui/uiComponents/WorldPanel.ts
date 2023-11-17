import { GPUCompareFunction, View3D } from "../../..";
import { Object3D } from "../../../core/entities/Object3D";
import { GUISpace } from "../GUIConfig";
import { UIPanel } from "./UIPanel";

/**
 * UI component container for world space
 * @group GPU GUI
 */
export class WorldPanel extends UIPanel {
  public readonly isWorldPanel = true;
  public readonly space: GUISpace = GUISpace.World;
  private _depthTest: boolean = true;

  constructor() {
    super();
  }

  public cloneTo(obj: Object3D) {
    let component: WorldPanel = obj.getOrAddComponent(WorldPanel);
    component.copyComponent(this);
  }

  public copyComponent(from: this): this {
    super.copyComponent(from);
    this.depthTest = from.depthTest;
    return this;
  }

  public get depthTest() {
    return this._depthTest;
  }

  public set depthTest(value: boolean) {
    if (this._depthTest != value) {
      this._depthTest = value;
      let compare = this.depthTest ? GPUCompareFunction.less_equal : GPUCompareFunction.always;
      for (let item of this._uiRenderer.materials) {
        item.depthCompare = compare;
      }

    }
  }

}
