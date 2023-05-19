import { Object3D } from '../../../core/entities/Object3D';
import { GUISpace } from '../GUIConfig';
import { UIPanel } from './UIPanel';

// UI component container for view/screen space
export class ViewPanel extends UIPanel {
  constructor() {
    super();
    this.space = GUISpace.View;
  }

  public cloneTo(obj: Object3D) {
    let component: ViewPanel = obj.getOrAddComponent(ViewPanel);
    component.copyComponent(this);
  }
}
