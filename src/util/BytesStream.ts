/**
 * @internal
 * @group Util
 */
export class BytesStream extends DataView {
    public position: number = 0;
    constructor(buffer: ArrayBufferLike, byteOffset?: number, byteLength?: number) {
        super(buffer, byteOffset, byteLength);
    }

    //TODO Improve read/write byte
}
