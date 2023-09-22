import { BytesArray } from "../../../../util/BytesArray";
import { ValueParser } from "./ValueParser";



export class KV {

    public key: string;
    private _data: any;

    public getValue<T>(): T {
        return this._data as T;
    }

    formBytes(matBytes: BytesArray) {
        this.key = matBytes.readUTF();
        this._data = ValueParser.parser(matBytes).v;
    }
}

