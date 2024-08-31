import { ParserBase } from "@orillusion/core";
import { parse, Font } from "../lib/opentype";

export class FontParser extends ParserBase {
    declare public data: Font;
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
