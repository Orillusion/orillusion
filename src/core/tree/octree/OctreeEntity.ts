import { RenderNode } from "../../../components/renderer/RenderNode";
import { Octree } from "./Octree";

export class OctreeEntity {
  public readonly renderer: RenderNode;
  public owner: Octree;
  public readonly uuid: string;
  constructor(renderer: RenderNode) {
    this.renderer = renderer;
    this.uuid = renderer.object3D.instanceID;
  }

  public leaveNode() {
    if (this.owner) {
      this.owner.entities.delete(this.uuid);
      this.owner = null;
    }
  }

  public enterNode(node: Octree) {
    this.owner && this.leaveNode();
    this.owner = node;
    node.entities.set(this.uuid, this);
  }

  public update(root: Octree): Octree {
    let stayWithOwner = this.owner?.tryInsertEntity(this);
    if (!stayWithOwner) {
      this.leaveNode();
      root.tryInsertEntity(this);
    }
    return this.owner;
  }
}
