/**
 * https://en.wikipedia.org/wiki/Halton_sequence
 * https://baike.baidu.com/item/Halton%20sequence/16697800
 * Class for generating the Halton low-discrepancy series for Quasi Monte Carlo integration.
 */
export class HaltonSeq {
    private value = 0;
    private inv_base = 0;

    public static get(index: number, radix: number): number {
        let result = 0;
        let fraction = 1 / radix;

        while (index > 0) {
            result += (index % radix) * fraction;

            index /= radix;
            fraction /= radix;
        }

        return result;
    }

    public getBase(index: number, base: number) {
        let f = (this.inv_base = 1.0 / base);

        while (index > 0) {
            this.value += f * (index % base);
            index /= base;
            f *= this.inv_base;
        }
    }

    public next() {
        let r = 1.0 - this.value - 0.0000001;
        if (this.inv_base < r) this.value += this.inv_base;
        else {
            let h = this.inv_base,
                hh;
            do {
                hh = h;
                h *= this.inv_base;
            } while (h >= r);
            this.value += hh + h - 1.0;
        }
    }

    public get() {
        return this.value;
    }
}
