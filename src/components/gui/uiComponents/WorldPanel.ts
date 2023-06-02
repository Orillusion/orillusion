import { Object3D } from "../../../core/entities/Object3D";
import { GUISpace } from "../GUIConfig";
import { UIPanel } from "./UIPanel";

/**
 * UI component container for world space
 * @group GPU GUI
 */
export class WorldPanel extends UIPanel {
  public depthTest: boolean = false;
  public readonly isWorldPanel = true;
  public readonly space: GUISpace = GUISpace.World;
  constructor() {
    super();
  }

  public cloneTo(obj: Object3D) {
    let component: WorldPanel = obj.getOrAddComponent(WorldPanel);
    component.copyComponent(this);
    component.depthTest = this.depthTest;
  }
}
