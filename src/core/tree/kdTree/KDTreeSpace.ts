/**
 * @internal
 * @group Core
 */
export class KDTreeRange {
    public min: number = 0;
    public max: number = 0;

    public set(min: number, max: number): this {
        this.max = max;
        this.min = min;
        return this;
    }

    public copy(src: KDTreeRange): this {
        this.max = src.max;
        this.min = src.min;
        return this;
    }

    public isInterestRange(src: KDTreeRange): boolean {
        let fail = this.max > src.min || src.max < this.min;
        return !fail;
    }
}

/**
 * @internal
 * @group Core
 */
export class KDTreeSpace {
    protected _spaceDesc: { [key: string]: KDTreeRange };

    public getRange(dimension: string): KDTreeRange {
        return this._spaceDesc[dimension];
    }

    public initSpace(dimensions: string[]): this {
        this._spaceDesc = {};
        for (let dimension of dimensions) {
            let range = (this._spaceDesc[dimension] = new KDTreeRange());
            range.set(-Number.MAX_VALUE, Number.MAX_VALUE);
        }
        return this;
    }

    public isContain(dimension: string, value: number): boolean {
        let range = this._spaceDesc[dimension];
        return value >= range.min && value < range.max;
    }

    public isInterestRange(dimension: string, range1: KDTreeRange): boolean {
        let range2 = this._spaceDesc[dimension];
        if (range2) return range1.isInterestRange(range2);
        return false;
    }

    public splitSpace(dimension: string, less: boolean, value: number): this {
        let range = this._spaceDesc[dimension];
        if (less) range.max = value;
        else range.min = value;
        return this;
    }

    public copySpace(space: KDTreeSpace): this {
        for (let key in space._spaceDesc) {
            let d = space._spaceDesc[key];
            this._spaceDesc[key].copy(d);
        }
        return this;
    }
}
