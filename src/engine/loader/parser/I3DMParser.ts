import { ParserBase } from './ParserBase';
import { I3DMLoader } from "./i3dm/I3DMLoader";

export class I3DMParser extends ParserBase {
    static format: string = 'bin';

    async parseBuffer(buffer: ArrayBuffer) {
        let loader = new I3DMLoader();
        loader.adjustmentTransform = this.userData;
        this.data = await loader.parse(buffer);
    }

    /**
     * Verify parsing validity
     * @param ret
     * @returns
     */
    public verification(): boolean {
        if (this.data) {
            return true;
        }
        throw new Error('Method not implemented.');
    }
}