/**
 * Tiny in-memory glTF binary (GLB) writer, plus a procedurally generated
 * test asset that exercises KHR_mesh_quantization, KHR_materials_specular,
 * KHR_materials_sheen and KHR_materials_variants without shipping a file.
 */

/** Pack a glTF JSON object and its single binary buffer into a .glb Blob. */
export function buildGLB(json: any, bin: ArrayBuffer): Blob {
    const pad4 = (n: number) => (4 - (n % 4)) % 4;
    const jsonBytes = new TextEncoder().encode(JSON.stringify(json));
    const jsonPad = pad4(jsonBytes.length), binPad = pad4(bin.byteLength);
    const total = 12 + 8 + jsonBytes.length + jsonPad + 8 + bin.byteLength + binPad;
    const out = new ArrayBuffer(total);
    const dv = new DataView(out);
    const u8 = new Uint8Array(out);
    let o = 0;
    dv.setUint32(o, 0x46546c67, true); o += 4;          // 'glTF'
    dv.setUint32(o, 2, true); o += 4;
    dv.setUint32(o, total, true); o += 4;
    dv.setUint32(o, jsonBytes.length + jsonPad, true); o += 4;
    dv.setUint32(o, 0x4e4f534a, true); o += 4;          // 'JSON'
    u8.set(jsonBytes, o); o += jsonBytes.length;
    for (let i = 0; i < jsonPad; i++) u8[o++] = 0x20;   // space padding
    dv.setUint32(o, bin.byteLength + binPad, true); o += 4;
    dv.setUint32(o, 0x004e4942, true); o += 4;          // 'BIN\0'
    u8.set(new Uint8Array(bin), o);
    return new Blob([out], { type: 'model/gltf-binary' });
}

/** Append typed arrays into one buffer with 4-byte alignment; returns bufferViews. */
class BinWriter {
    private chunks: Uint8Array[] = [];
    private length = 0;
    public views: { buffer: number; byteOffset: number; byteLength: number }[] = [];
    add(data: ArrayBufferView): number {
        const pad = (4 - (this.length % 4)) % 4;
        if (pad) { this.chunks.push(new Uint8Array(pad)); this.length += pad; }
        this.views.push({ buffer: 0, byteOffset: this.length, byteLength: data.byteLength });
        this.chunks.push(new Uint8Array(data.buffer, data.byteOffset, data.byteLength));
        this.length += data.byteLength;
        return this.views.length - 1;
    }
    finish(): ArrayBuffer {
        const out = new Uint8Array(this.length);
        let o = 0;
        for (const c of this.chunks) { out.set(c, o); o += c.length; }
        return out.buffer;
    }
}

export interface VariantsDemoInfo {
    blob: Blob;
    /** Vertex count of the quantized sphere. */
    sphereVertices: number;
    /** Triangle count of the non-indexed ribbon (deliberately > 85). */
    ribbonTriangles: number;
    variantNames: string[];
}

/**
 * A quantized UV sphere (int16-normalized positions under a ×`radius` node
 * scale, int8-normalized normals, uint16-normalized UVs) with three material
 * variants, plus a NON-indexed float ribbon mesh that no variant mentions.
 */
export function buildVariantsDemoGLB(radius: number = 2, segments: number = 32): VariantsDemoInfo {
    const w = new BinWriter();

    // ---- quantized sphere ----
    const cols = segments + 1, rows = segments + 1;
    const n = cols * rows;
    const pos = new Int16Array(n * 3), nor = new Int8Array(n * 3), uv = new Uint16Array(n * 2);
    // glTF requires each vertex attribute stride to be a multiple of 4 bytes:
    // int8 vec3 → pad to 4 bytes per vertex via byteStride.
    const norPadded = new Int8Array(n * 4);
    // int16 vec3 = 6 bytes → stride 8.
    const posPadded = new Int16Array(n * 4);
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const i = y * cols + x;
            const theta = (x / segments) * Math.PI * 2, phi = (y / segments) * Math.PI;
            const px = Math.sin(phi) * Math.cos(theta), py = Math.cos(phi), pz = Math.sin(phi) * Math.sin(theta);
            pos[i * 3] = Math.round(px * 32767); pos[i * 3 + 1] = Math.round(py * 32767); pos[i * 3 + 2] = Math.round(pz * 32767);
            nor[i * 3] = Math.round(px * 127); nor[i * 3 + 1] = Math.round(py * 127); nor[i * 3 + 2] = Math.round(pz * 127);
            posPadded.set(pos.subarray(i * 3, i * 3 + 3), i * 4);
            norPadded.set(nor.subarray(i * 3, i * 3 + 3), i * 4);
            uv[i * 2] = Math.round((x / segments) * 65535); uv[i * 2 + 1] = Math.round((y / segments) * 65535);
        }
    }
    const idx: number[] = [];
    for (let y = 0; y < segments; y++) {
        for (let x = 0; x < segments; x++) {
            const a = y * cols + x, b = a + 1, c = a + cols, d = c + 1;
            idx.push(a, b, c, b, d, c);
        }
    }
    const indices = new Uint16Array(idx);
    const vPos = w.add(posPadded), vNor = w.add(norPadded), vUv = w.add(uv), vIdx = w.add(indices);

    // ---- non-indexed float ribbon: 100 triangles ----
    const tris = 100;
    const rp = new Float32Array(tris * 9), rn = new Float32Array(tris * 9);
    for (let t = 0; t < tris; t++) {
        const x0 = (t - tris / 2) * 0.12, x1 = x0 + 0.1;
        const up = t % 2 === 0;
        const y0 = -3.2, y1 = -2.9;
        // counter-clockwise when seen from +Z
        const v = up ? [x0, y0, 0, x1, y0, 0, x0, y1, 0] : [x0, y1, 0, x1, y0, 0, x1, y1, 0];
        rp.set(v, t * 9);
        for (let k = 0; k < 3; k++) rn.set([0, 0, 1], t * 9 + k * 3);
    }
    const vRp = w.add(rp), vRn = w.add(rn);

    const views: any[] = w.views.map(v => ({ ...v }));
    views[vPos].byteStride = 8;
    views[vNor].byteStride = 4;

    const variantNames = ['Crimson', 'Ocean', 'Velvet'];
    const json = {
        asset: { version: '2.0', generator: 'orillusion-samples GLBBuilder' },
        extensionsUsed: ['KHR_mesh_quantization', 'KHR_materials_variants', 'KHR_materials_specular', 'KHR_materials_sheen'],
        extensionsRequired: ['KHR_mesh_quantization'],
        extensions: { KHR_materials_variants: { variants: variantNames.map(name => ({ name })) } },
        scene: 0,
        scenes: [{ nodes: [0, 1] }],
        nodes: [
            { name: 'QuantizedSphere', mesh: 0, scale: [radius, radius, radius] },
            { name: 'Ribbon', mesh: 1 },
        ],
        meshes: [
            {
                name: 'SphereMesh',
                primitives: [{
                    attributes: { POSITION: 0, NORMAL: 1, TEXCOORD_0: 2 },
                    indices: 3,
                    material: 0,
                    extensions: {
                        KHR_materials_variants: {
                            mappings: [
                                { material: 1, variants: [0] },
                                { material: 2, variants: [1] },
                                { material: 3, variants: [2] },
                            ],
                        },
                    },
                }],
            },
            { name: 'RibbonMesh', primitives: [{ attributes: { POSITION: 4, NORMAL: 5 }, material: 4 }] },
        ],
        materials: [
            {
                name: 'Default_Steel',
                pbrMetallicRoughness: { baseColorFactor: [0.6, 0.6, 0.62, 1], metallicFactor: 0.0, roughnessFactor: 0.35 },
                extensions: { KHR_materials_specular: { specularFactor: 0.5, specularColorFactor: [1, 0.5, 0.25] } },
            },
            { name: 'Variant_Crimson', pbrMetallicRoughness: { baseColorFactor: [0.8, 0.05, 0.08, 1], metallicFactor: 0.0, roughnessFactor: 0.4 } },
            { name: 'Variant_Ocean', pbrMetallicRoughness: { baseColorFactor: [0.05, 0.25, 0.8, 1], metallicFactor: 0.6, roughnessFactor: 0.25 } },
            {
                name: 'Variant_Velvet',
                pbrMetallicRoughness: { baseColorFactor: [0.12, 0.03, 0.2, 1], metallicFactor: 0.0, roughnessFactor: 0.9 },
                extensions: { KHR_materials_sheen: { sheenColorFactor: [0.9, 0.6, 1.0], sheenRoughnessFactor: 0.45 } },
            },
            { name: 'Ribbon_Yellow', doubleSided: true, pbrMetallicRoughness: { baseColorFactor: [0.95, 0.8, 0.1, 1], metallicFactor: 0.0, roughnessFactor: 0.6 } },
        ],
        accessors: [
            { bufferView: vPos, componentType: 5122, normalized: true, count: n, type: 'VEC3', min: [-32767, -32767, -32767], max: [32767, 32767, 32767] },
            { bufferView: vNor, componentType: 5120, normalized: true, count: n, type: 'VEC3' },
            { bufferView: vUv, componentType: 5123, normalized: true, count: n, type: 'VEC2' },
            { bufferView: vIdx, componentType: 5123, count: indices.length, type: 'SCALAR' },
            { bufferView: vRp, componentType: 5126, count: tris * 3, type: 'VEC3', min: [-6, -3.2, 0], max: [6, -2.9, 0] },
            { bufferView: vRn, componentType: 5126, count: tris * 3, type: 'VEC3' },
        ],
        bufferViews: views,
        buffers: [{ byteLength: 0 }],
    };
    const bin = w.finish();
    json.buffers[0].byteLength = bin.byteLength;
    return { blob: buildGLB(json, bin), sphereVertices: n, ribbonTriangles: tris, variantNames };
}

/** Encode a canvas-drawn image as PNG bytes (left half `left`, right half `right`, CSS colours). */
export async function encodeHalfPNG(size: number, left: string, right: string): Promise<ArrayBuffer> {
    const canvas = new OffscreenCanvas(size, size);
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = left; ctx.fillRect(0, 0, size / 2, size);
    ctx.fillStyle = right; ctx.fillRect(size / 2, 0, size / 2, size);
    return (await canvas.convertToBlob({ type: 'image/png' })).arrayBuffer();
}

/**
 * A single textured quad whose material carries every KHR material-extension
 * texture (sheen colour / roughness, iridescence + thickness, specular +
 * specular colour, anisotropy), all pointing at the one embedded PNG. Used to
 * prove the glTF loader resolves and binds those textures.
 */
export function buildExtensionTexturesGLB(png: ArrayBuffer, size = 2): Blob {
    const w = new BinWriter();
    const h = size / 2;
    const vPos = w.add(new Float32Array([-h, -h, 0, h, -h, 0, h, h, 0, -h, h, 0]));
    const vNor = w.add(new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1]));
    const vUv = w.add(new Float32Array([0, 1, 1, 1, 1, 0, 0, 0]));
    const vIdx = w.add(new Uint16Array([0, 1, 2, 0, 2, 3]));
    const vImg = w.add(new Uint8Array(png));
    const tex = { index: 0 };
    const json = {
        asset: { version: '2.0', generator: 'orillusion-samples GLBBuilder' },
        extensionsUsed: ['KHR_materials_sheen', 'KHR_materials_iridescence', 'KHR_materials_specular', 'KHR_materials_anisotropy'],
        scene: 0,
        scenes: [{ nodes: [0] }],
        nodes: [{ name: 'ExtensionQuad', mesh: 0 }],
        meshes: [{ name: 'Quad', primitives: [{ attributes: { POSITION: 0, NORMAL: 1, TEXCOORD_0: 2 }, indices: 3, material: 0 }] }],
        materials: [{
            name: 'AllExtensionTextures',
            pbrMetallicRoughness: { baseColorFactor: [0.6, 0.6, 0.6, 1], metallicFactor: 0, roughnessFactor: 0.5 },
            extensions: {
                KHR_materials_sheen: { sheenColorFactor: [1, 1, 1], sheenRoughnessFactor: 0.6, sheenColorTexture: tex, sheenRoughnessTexture: tex },
                KHR_materials_iridescence: { iridescenceFactor: 1, iridescenceThicknessMinimum: 200, iridescenceThicknessMaximum: 600, iridescenceTexture: tex, iridescenceThicknessTexture: tex },
                KHR_materials_specular: { specularFactor: 1, specularColorFactor: [1, 1, 1], specularTexture: tex, specularColorTexture: tex },
                KHR_materials_anisotropy: { anisotropyStrength: 1, anisotropyRotation: 0, anisotropyTexture: tex },
            },
        }],
        textures: [{ source: 0, sampler: 0 }],
        samplers: [{ magFilter: 9729, minFilter: 9729, wrapS: 33071, wrapT: 33071 }],
        images: [{ mimeType: 'image/png', bufferView: vImg }],
        accessors: [
            { bufferView: vPos, componentType: 5126, count: 4, type: 'VEC3', min: [-h, -h, 0], max: [h, h, 0] },
            { bufferView: vNor, componentType: 5126, count: 4, type: 'VEC3' },
            { bufferView: vUv, componentType: 5126, count: 4, type: 'VEC2' },
            { bufferView: vIdx, componentType: 5123, count: 6, type: 'SCALAR' },
        ],
        bufferViews: w.views.map(v => ({ ...v })),
        buffers: [{ byteLength: 0 }],
    };
    const bin = w.finish();
    json.buffers[0].byteLength = bin.byteLength;
    return buildGLB(json, bin);
}
