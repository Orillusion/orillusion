// https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_mesh_quantization

/**
 * @internal
 * @group Loader
 */
export class KHR_mesh_quantization {
    /** Attributes the extension allows to be stored as (normalized) integers. */
    public static isQuantizable(attribute: string): boolean {
        return attribute === 'POSITION' || attribute === 'NORMAL' || attribute === 'TANGENT' || attribute.startsWith('TEXCOORD_');
    }

    /**
     * Promote an integer vertex attribute to Float32, applying the glTF
     * normalization rule when the accessor is flagged `normalized`
     * (signed: max(c / MAX, -1), unsigned: c / MAX). The engine's geometry
     * and picking code assume float positions / normals / UVs, so
     * quantized assets are expanded at load time; the node transform the
     * exporter wrote undoes the quantization scale as usual.
     *
     * Idempotent: a Float32 accessor is returned untouched.
     */
    public static dequantize(accessor: { data: any; normalize?: boolean; numComponents?: number }): void {
        const src = accessor?.data;
        if (!src || src instanceof Float32Array) return;
        const dst = new Float32Array(src.length);
        if (accessor.normalize) {
            let max = 1, signed = false;
            if (src instanceof Int8Array) { max = 127; signed = true; }
            else if (src instanceof Uint8Array) max = 255;
            else if (src instanceof Int16Array) { max = 32767; signed = true; }
            else if (src instanceof Uint16Array) max = 65535;
            else if (src instanceof Uint32Array) max = 4294967295;
            for (let i = 0; i < src.length; i++) {
                const v = src[i] / max;
                dst[i] = signed && v < -1 ? -1 : v;
            }
        } else {
            for (let i = 0; i < src.length; i++) dst[i] = src[i];
        }
        accessor.data = dst;
        accessor.normalize = false;
    }
}
