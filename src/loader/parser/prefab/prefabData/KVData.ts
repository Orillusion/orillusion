import { BytesArray } from "../../../../util/BytesArray";
import { ValueParser } from "./ValueParser";
import { ValueEnumType } from "./ValueType";



export class KV {

    public key: string;
    public type: ValueEnumType;
    private _data: any;

    public getValue<T>(): T {
        return this._data as T;
    }

    formBytes(matBytes: BytesArray) {
        this.key = matBytes.readUTF();
        let { t, v } = ValueParser.parser(matBytes);
        this.type = t;
        this._data = v;
    }
}

