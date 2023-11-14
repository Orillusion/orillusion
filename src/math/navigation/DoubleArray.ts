export class DoubleArray {

    private _keys: Array<any> = new Array<any>();

    private _values: Array<any> = new Array<any>();

    public getIndexByKey(key: any): number {
        return this._keys.indexOf(key);
    }

    public getValueByKey(key: any): any {
        var index: number = this.getIndexByKey(key);
        if (index > -1) {
            return this._values[index];
        }
        return null;
    }

    public put(key: any, value: any): any {
        if (key == null)
            return null;
        var old: any = this.remove(key);
        this._keys.push(key);
        this._values.push(value);
        return old;
    }

    public remove(key: any): any {
        var index: number = this._keys.indexOf(key)
        var item: any;
        if (index > -1) {
            item = this._values[index];
            this._keys.splice(index, 1);
            this._values.splice(index, 1);
        }
        return item;
    }

    public getValues(): Array<any> {
        return this._values;
    }

    public getKeys(): Array<any> {
        return this._keys;
    }

    public clear(): void {
        this._values.length = 0;
        this._keys.length = 0;
    }

}