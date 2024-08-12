import { ParserBase } from "@orillusion/core";
import * as opentype from "../opentype.module.js";

export class TTFParser extends ParserBase {
    public async parseBuffer(buffer: ArrayBuffer) {
        console.log(opentype);
        const font = opentype.parse(buffer);
        this.data = font;
    }

    public verification(): boolean {
        if (this.data) {
            return true;
        }
        throw new Error('Method not implemented.');
    }
}
