
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

  public getUseList(): T[] {
    return this._use;
  }

  public getOne(instance: { new(arg?): T }, param?): T {
    let node: T;
    if (this._unUse.length > 0) {
      node = this._unUse[0];
      this._unUse.splice(0, 1);
      this._use.push(node);
      return node;
    } else {
      node = new instance(param);
      this._use.push(node);
    }

    return node;
  }

  public hasFree(): boolean {
    return this._unUse.length > 0;
  }
}
