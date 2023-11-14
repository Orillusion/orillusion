export class OrderMap<K, V> extends Map<K, V>{
    public readonly valueList: V[];
    public readonly keyList: K[];
    public isChange: boolean = true;
    constructor(iterable?: Iterable<readonly [K, V]> | null, recordKey?: boolean, recordValue?: boolean) {
        super(iterable);
        if (recordKey) this.keyList = [];
        if (recordValue) this.valueList = [];

        if (iterable) {
            for (let item of iterable) {
                this.valueList?.push(item[1]);
                this.keyList?.push(item[0]);
            }
        }
    }

    delete(key: K): boolean {
        if (this.has(key)) {
            let value = this.get(key);
            this.valueList && this.deleteValue(value);

            this.keyList && this.deleteKey(key);

            this.isChange = true;
            return super.delete(key);
        }
        return false;
    }

    private deleteValue(value: V): this {
        let index = this.valueList.indexOf(value);
        if (index >= 0) {
            this.valueList.splice(index, 1);
        }
        return this;
    }

    private deleteKey(key: K): this {
        let index = this.keyList.indexOf(key);
        if (index >= 0) {
            this.keyList.splice(index, 1);
        }
        return this;
    }

    set(key: K, value: V): this {
        this.delete(key);
        this.keyList?.push(key);
        this.valueList?.push(value);
        super.set(key, value);
        this.isChange = true;
        return this;
    }

    clear(): void {
        if (this.valueList) this.valueList.length = 0;
        if (this.keyList) this.keyList.length = 0;
        this.isChange = true;
        super.clear();
    }

}