
export class PoolNode<T> {
  private _use: T[];
  private _unUse: T[];

  constructor() {
    this._use = [];
    this._unUse = [];
  }

  public pushBack(node: T) {
    let index = this._use.indexOf(node);
    if (index != -1) {
      this._use.splice(index, 1);
      this._unUse.push(node);
    }
  }

  public getOne(instance: { new (): T }): T {
    let node: T;
    if (this._unUse.length > 0) {
      node = this._unUse[0];
      this._unUse.splice(0, 1);
      this._use.push(node);
      return node;
    } else {
      node = new instance();
      this._use.push(node);
    }

    return node;
  }

  public hasFree(): boolean {
    return this._unUse.length > 0;
  }
}
