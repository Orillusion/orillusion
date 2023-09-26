//双向map
export class BiMap<K, V> extends Map<K, V>{
    private readonly negtive: Map<V, K>;
    constructor(iterable?: Iterable<readonly [K, V]> | null,) {
        super(iterable);
        this.negtive = new Map<V, K>();
        if (iterable) {
            for (let item of iterable) {
                this.negtive.set(item[1], item[0]);
            }
        }
    }
    delete(key: K): boolean {
        if (this.has(key)) {
            let value = this.get(key);
            this.negtive.delete(value);
            return super.delete(key);
        }
        return false;
    }

    getKey(value: V): K {
        return this.negtive.get(value);
    }

    deleteValue(value: V) {
        let k = this.negtive.get(value);
        k && this.delete(k);
        return this.negtive.delete(value);
    }

    set(key: K, value: V): this {
        super.set(key, value);
        this.negtive.set(value, key);
        return this;
    }

    clear(): void {
        this.negtive.clear();
        super.clear();
    }

}