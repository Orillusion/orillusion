import { Matrix4 } from '../../../math/Matrix4';

export class JointPose {
  public index: number;
  public worldMatrix: Matrix4;
  constructor(index: number, useGlobalMatrix: boolean = false) {
    this.index = index;
    this.worldMatrix = new Matrix4(!useGlobalMatrix);
  }
}
