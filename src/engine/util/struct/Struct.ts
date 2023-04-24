/**
 * @internal
 * @auth sirxu
 * Basic data structure class
 * Reasonable arrangement of data structure can accelerate computing performance
 * @group Util
 */
import { Ctor } from "../Global";

export class Struct {
    private __refection: {
        name: string;
        type: string;
    }[];

    private __size: number = 0;

    /**
     * get reflection name
     * @returns
     */
    public getValueType() {
        if (!this.__refection) {
            let self = this;
            this.__refection = [];
            for (const key in self) {
                if (!key.includes(`__`)) {
                    const element = self[key];
                    let att = {
                        name: key,
                        type: element.constructor.name,
                    };
                    this.__refection.push(att);
                }
            }
        }
        return this.__refection;
    }

    /**
     * get any type value memory size
     * @param value any type value
     * @returns
     */
    public static getValueSize(value: any) {
        let type = value.constructor.name;
        switch (type) {
            case `Boolean`:
                return 1 * 4;

            case `Number`:
                return 1 * 4;

            case `f32`:
                return 1 * 4;

            case `i32`:
                return 1 * 4;

            case `u32`:
                return 1 * 4;

            case `Float32Array`:
                return value.byteLength * 4;

            case `Vector2`:
                return 2 * 4;

            case `Vector3`:
                return 4 * 4;

            case `Vector4`:
                return 4 * 4;

            case `Color`:
                return 4 * 4;

            case `Array`:
                let singleSize = 0;
                for (let i = 0, c = value.length; i < c; i++) {
                    singleSize += Struct.getValueSize(value[i]);
                }
                return singleSize;
        }
        return 0;
    }

    private static __cacheStruct: Map<any, Struct> = new Map<any, Struct>();

    public static Ref<T extends Struct>(c: Ctor<T>) {
        let struct = this.Get(c);
        let ref = struct.getValueType();
        return ref;
    }

    public static Get<T extends Struct>(c: Ctor<T>) {
        let struct = Struct.__cacheStruct.get(c.prototype);
        if (!struct) {
            struct = new c();
            Struct.__cacheStruct.set(c.prototype, struct);
        }
        return struct;
    }

    /**
     * get any struct memory size
     * @returns
     */
    public static GetSize<T extends Struct>(c: Ctor<T>) {
        let struct = this.Get(c);
        if (struct.__size == 0) {
            for (const key in struct) {
                if (key.indexOf(`__`) == -1) {
                    const element = struct[key];
                    struct.__size += Struct.getValueSize(element);
                }
            }
            if (struct.__size > 4) {
                struct.__size = Math.ceil(struct.__size / 4) * 4;
            }
        }
        return struct.__size;
    }
}
