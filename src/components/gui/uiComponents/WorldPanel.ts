import { Object3D } from "../../../core/entities/Object3D";
import { GUISpace } from "../GUIConfig";
import { UIPanel } from "./UIPanel";

// UI component container for world space
export class WorldPanel extends UIPanel {
  public depthTest: boolean = false;

  constructor() {
    super();
    this.space = GUISpace.World;
  }

  public cloneTo(obj: Object3D) {
    let component: WorldPanel = obj.getOrAddComponent(WorldPanel);
    component.order = this.order;
    component.depthTest = this.depthTest;
    component.panelOrder = this.panelOrder;
    component.needSortOnCameraZ = this.needSortOnCameraZ;
  }
}
