import { ParserBase } from "@orillusion/core";
import { parse } from "../lib/opentype";

export class FontParser extends ParserBase {
    public async parseBuffer(buffer: ArrayBuffer) {
        const font = parse(buffer);
        this.data = font;
    }

    public verification(): boolean {
        if (this.data) {
            return true;
        }
        throw new Error('Method not implemented.');
    }
}
