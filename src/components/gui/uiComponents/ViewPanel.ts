import { Object3D } from '../../../core/entities/Object3D';
import { GUISpace } from '../GUIConfig';
import { UIPanel } from './UIPanel';

/**
 *
 * UI component container for view/screen space
 * @group GPU GUI
 */
export class ViewPanel extends UIPanel {
  public readonly isViewPanel = true;
  public readonly space: GUISpace = GUISpace.View;
  constructor() {
    super();
  }

  public cloneTo(obj: Object3D) {
    let component: ViewPanel = obj.getOrAddComponent(ViewPanel);
    component.copyComponent(this);
  }

}
