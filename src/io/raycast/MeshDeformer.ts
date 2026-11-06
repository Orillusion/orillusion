import { GeometryBase } from '../../core/geometry/GeometryBase';
import { VertexAttributeData } from '../../core/geometry/VertexAttributeData';
import { VertexAttributeName } from '../../core/geometry/VertexAttributeName';
import { MeshAttributeView, MeshBVH } from '../../core/tree/bvh/MeshBVH';
import { MeshRenderer } from '../../components/renderer/MeshRenderer';
import { Matrix4 } from '../../math/Matrix4';

/**
 * How ray queries treat meshes the GPU deforms (skinning, morph targets):
 * - `cpu`: deform the vertices on the CPU the way the vertex shader does,
 *   then intersect the result (default)
 * - `bindPose`: intersect the undeformed geometry
 * - `skip`: ignore deformed meshes
 * @group IO
 */
export type RaycastDeformation = 'cpu' | 'bindPose' | 'skip';

/** Result of `MeshDeformer.deform`. */
export interface DeformedMesh {
    /**
     * CPU-only geometry holding the deformed positions/normals (shares the
     * source indices, uvs and sub-geometries). Reused across calls.
     */
    geometry: GeometryBase;
    /** True when positions are already in world space (skinned); false → mesh local space (morph only). */
    worldSpace: boolean;
}

/**
 * A geometry that only lives on the CPU: attributes are kept in a plain
 * map, so no GPU index/vertex buffers are ever created for it.
 */
class CpuGeometry extends GeometryBase {
    private _cpuAttributes = new Map<string, VertexAttributeData>();
    private _cpuVersion = 0;

    public setCpuAttribute(name: string, data: ArrayLike<number>) {
        this._cpuAttributes.set(name, { attribute: name, data: data as any });
    }

    public getAttribute(attribute: string): VertexAttributeData {
        return this._cpuAttributes.get(attribute);
    }

    public hasAttribute(attribute: string): boolean {
        return this._cpuAttributes.has(attribute);
    }

    public get version(): number {
        return this._cpuVersion;
    }

    public touch() {
        this._cpuVersion++;
    }
}

/** Skin data gathered from a skinned renderer and its skeleton/animator component. */
interface SkinSource {
    /** Per skin joint: inverse bind matrix (column-major). */
    inverseBind: ArrayLike<number>[];
    /** Per skin joint: bone ID in the skeleton (-1 when unmapped). */
    jointToBone: number[];
    /** Per bone ID: global `Matrix4.index` of the bone's world matrix. */
    boneMatrixIndex: ArrayLike<number>;
    joints0: MeshAttributeView;
    weights0: MeshAttributeView;
    joints1: MeshAttributeView | null;
    weights1: MeshAttributeView | null;
}

/** Morph data gathered from a renderer's `MorphTargetData`. */
interface MorphSource {
    influences: Float32Array;
    base: number;
    positions: ArrayLike<number>[];
    normals: ArrayLike<number>[] | null;
    vIndex: MeshAttributeView | null;
}

interface DeformState {
    source: GeometryBase;
    geometry: CpuGeometry;
    positions: Float32Array;
    normals: Float32Array | null;
    /** Skinning matrices + morph weights the current positions were computed with. */
    signature: Float64Array;
    sourceVersion: number;
    jointToBone: number[];
    jointMapOwner: any;
}

/**
 * CPU replica of the vertex-shader deformation (morph targets, then
 * skinning) used by ray queries, so picks match what is drawn.
 *
 * Skinning reads each bone's current world matrix from the same global
 * matrix slot the shader reads (`models.matrix[...]`), multiplies by the
 * skin's inverse bind matrix and blends with `joints0/weights0` (and
 * `joints1/weights1`), producing world-space positions exactly as the
 * shader's `getSkeletonWorldMatrix_*`. Morphing applies
 * `position * baseInfluence + Σ influence_i * a_morphPositions_i`.
 *
 * Results are cached per renderer and recomputed only when the skinning
 * matrices or morph weights changed; the cost is O(vertices) per change.
 * Normals are deformed with the blended matrix (exact for rotation and
 * uniform scale).
 * @group IO
 */
export class MeshDeformer {
    private static _states: WeakMap<MeshRenderer, DeformState> = new WeakMap();

    /** Whether the GPU currently deforms this renderer's geometry (bound skin, or non-trivial morph weights). */
    public static isDeformed(renderer: MeshRenderer): boolean {
        return !!MeshDeformer._skin(renderer, MeshDeformer._states.get(renderer)) || !!MeshDeformer._morph(renderer);
    }

    /**
     * Deform the renderer's geometry as the vertex shader does and return the
     * cached CPU geometry, or null when nothing deforms it.
     */
    public static deform(renderer: MeshRenderer): DeformedMesh | null {
        const source = renderer.geometry;
        if (!source) return null;
        let state = MeshDeformer._states.get(renderer);
        if (state && state.source !== source) state = null;
        const skin = MeshDeformer._skin(renderer, state);
        const morph = MeshDeformer._morph(renderer);
        if (!skin && !morph) return null;

        const pos = MeshBVH.getAttributeView(source, VertexAttributeName.position);
        if (!pos) return null;
        const vertexCount = ((pos.data.length - pos.offset) / pos.stride) | 0;
        if (!state || state.positions.length !== vertexCount * 3) {
            state = MeshDeformer._createState(source, vertexCount);
            MeshDeformer._states.set(renderer, state);
        }
        if (skin) { state.jointToBone = skin.jointToBone; state.jointMapOwner = (renderer as any).skeletonAnimation; }

        // Skinning matrices for every skin joint, then the change signature.
        const jointCount = skin ? skin.inverseBind.length : 0;
        const skinMats = new Float64Array(jointCount * 16);
        if (skin) MeshDeformer._skinMatrices(skin, skinMats);
        const morphCount = morph ? morph.positions.length : 0;
        const sigLength = skinMats.length + morphCount + 2;
        let changed = state.sourceVersion !== source.version || state.signature.length !== sigLength;
        const sig = changed ? new Float64Array(sigLength) : state.signature;
        let k = 0;
        for (let i = 0; i < skinMats.length; i++, k++) { if (sig[k] !== skinMats[i]) { sig[k] = skinMats[i]; changed = true; } }
        for (let i = 0; i < morphCount; i++, k++) { const w = morph.influences[i]; if (sig[k] !== w) { sig[k] = w; changed = true; } }
        const flags = [skin ? 1 : 0, morph ? morph.base : NaN];
        for (let i = 0; i < 2; i++, k++) { if (!Object.is(sig[k], flags[i])) { sig[k] = flags[i]; changed = true; } }

        if (changed) {
            state.signature = sig;
            state.sourceVersion = source.version;
            MeshDeformer._compute(state, source, pos, vertexCount, skin, skinMats, morph);
            state.geometry.touch();
        }
        return { geometry: state.geometry, worldSpace: !!skin };
    }

    private static _createState(source: GeometryBase, vertexCount: number): DeformState {
        const geometry = new CpuGeometry();
        geometry.name = (source.name || '') + '#deformed';
        geometry.subGeometries = source.subGeometries;
        const positions = new Float32Array(vertexCount * 3);
        geometry.setCpuAttribute(VertexAttributeName.position, positions);
        const idx = source.getAttribute(VertexAttributeName.indices);
        if (idx && idx.data && idx.data.length > 0) geometry.setCpuAttribute(VertexAttributeName.indices, idx.data as ArrayLike<number>);
        let normals: Float32Array = null;
        if (MeshBVH.getAttributeView(source, VertexAttributeName.normal)) {
            normals = new Float32Array(vertexCount * 3);
            geometry.setCpuAttribute(VertexAttributeName.normal, normals);
        }
        // UVs do not deform: copy them once into plain arrays (they may be interleaved).
        for (const name of [VertexAttributeName.uv, VertexAttributeName.TEXCOORD_1]) {
            const view = MeshBVH.getAttributeView(source, name);
            if (!view) continue;
            const out = new Float32Array(vertexCount * 2);
            for (let i = 0; i < vertexCount; i++) {
                out[i * 2] = view.data[i * view.stride + view.offset];
                out[i * 2 + 1] = view.data[i * view.stride + view.offset + 1];
            }
            geometry.setCpuAttribute(name, out);
        }
        return { source, geometry, positions, normals, signature: new Float64Array(0), sourceVersion: -1, jointToBone: null, jointMapOwner: null };
    }

    private static _skin(renderer: MeshRenderer, state: DeformState | null): SkinSource | null {
        const r = renderer as any;
        const anim = r.skeletonAnimation;
        const inverseBind: ArrayLike<number>[] = r.skinInverseBindMatrices;
        const names: string[] = r.skinJointsName;
        if (!anim || !inverseBind || !names || inverseBind.length === 0) return null;
        // AnimatorComponent (glTF) keeps the table directly; SkeletonAnimationComponent (prefab) on its pose.
        const boneMatrixIndex: ArrayLike<number> = anim.jointMatrixIndexTable ?? anim.finalSkeletonPose?.jointMatrixIndexTable;
        if (!boneMatrixIndex) return null;
        const geometry = renderer.geometry;
        const joints0 = MeshBVH.getAttributeView(geometry, VertexAttributeName.joints0);
        const weights0 = MeshBVH.getAttributeView(geometry, VertexAttributeName.weights0);
        if (!joints0 || !weights0) return null;
        const jointToBone = state && state.jointMapOwner === anim && state.jointToBone ? state.jointToBone : anim.getJointIndexTable(names);
        return {
            inverseBind, jointToBone, boneMatrixIndex, joints0, weights0,
            joints1: MeshBVH.getAttributeView(geometry, VertexAttributeName.joints1),
            weights1: MeshBVH.getAttributeView(geometry, VertexAttributeName.weights1),
        };
    }

    private static _morph(renderer: MeshRenderer): MorphSource | null {
        const md = renderer.morphData;
        if (!md || !md.enable || !md.morphTargetCount) return null;
        const influences = md.influences;
        const base = md.baseInfluence;
        let active = base !== 1;
        for (let i = 0; i < md.morphTargetCount && !active; i++) active = influences[i] !== 0;
        if (!active) return null;
        const geometry = renderer.geometry;
        const positions: ArrayLike<number>[] = [];
        const normals: ArrayLike<number>[] = [];
        for (let i = 0; i < md.morphTargetCount; i++) {
            const p = geometry.getAttribute('a_morphPositions_' + i);
            if (!p) return null;
            positions.push(p.data as ArrayLike<number>);
            const n = geometry.getAttribute('a_morphNormals_' + i);
            if (n) normals.push(n.data as ArrayLike<number>);
        }
        return {
            influences, base, positions,
            normals: normals.length === positions.length ? normals : null,
            vIndex: MeshBVH.getAttributeView(geometry, VertexAttributeName.vIndex),
        };
    }

    /** skinMats[j] = boneWorld[jointToBone[j]] × inverseBind[j] (column-major), zero for unmapped joints. */
    private static _skinMatrices(skin: SkinSource, out: Float64Array): void {
        const refs = Matrix4.dynamicGlobalMatrixRef;
        for (let j = 0; j < skin.inverseBind.length; j++) {
            const bone = skin.jointToBone[j];
            const mi = bone >= 0 ? skin.boneMatrixIndex[bone] : -1;
            const A = mi >= 0 && refs ? refs[mi]?.rawData : null;
            const B = skin.inverseBind[j];
            const o = j * 16;
            if (!A || !B) { for (let i = 0; i < 16; i++) out[o + i] = 0; continue; }
            for (let c = 0; c < 4; c++) {
                for (let r = 0; r < 4; r++) {
                    out[o + c * 4 + r] = A[r] * B[c * 4] + A[4 + r] * B[c * 4 + 1] + A[8 + r] * B[c * 4 + 2] + A[12 + r] * B[c * 4 + 3];
                }
            }
        }
    }

    private static _compute(state: DeformState, source: GeometryBase, pos: MeshAttributeView, n: number,
        skin: SkinSource | null, S: Float64Array, morph: MorphSource | null): void {
        const P = pos.data, ps = pos.stride, po = pos.offset;
        const nrm = state.normals ? MeshBVH.getAttributeView(source, VertexAttributeName.normal) : null;
        const outP = state.positions, outN = state.normals;
        const m = new Float64Array(12);
        const jointCount = skin ? skin.inverseBind.length : 0;
        const activeTargets: number[] = [];
        if (morph) for (let t = 0; t < morph.positions.length; t++) if (morph.influences[t] !== 0) activeTargets.push(t);

        for (let i = 0; i < n; i++) {
            let x = P[i * ps + po], y = P[i * ps + po + 1], z = P[i * ps + po + 2];
            let nx = 0, ny = 0, nz = 0;
            if (nrm) { const b = i * nrm.stride + nrm.offset; nx = nrm.data[b]; ny = nrm.data[b + 1]; nz = nrm.data[b + 2]; }

            if (morph) {
                const vi = morph.vIndex ? morph.vIndex.data[i * morph.vIndex.stride + morph.vIndex.offset] : i;
                const b = morph.base;
                x *= b; y *= b; z *= b;
                if (nrm) { nx *= b; ny *= b; nz *= b; }
                for (const t of activeTargets) {
                    const w = morph.influences[t], D = morph.positions[t], o = vi * 3;
                    x += w * D[o]; y += w * D[o + 1]; z += w * D[o + 2];
                    if (nrm && morph.normals) { const N = morph.normals[t]; nx += w * N[o]; ny += w * N[o + 1]; nz += w * N[o + 2]; }
                }
            }

            if (skin) {
                m.fill(0);
                MeshDeformer._blend(m, S, skin.joints0, skin.weights0, i, jointCount);
                if (skin.joints1 && skin.weights1) MeshDeformer._blend(m, S, skin.joints1, skin.weights1, i, jointCount);
                // m holds the upper 3×4 of the blended column-major matrix: [c0.xyz, c1.xyz, c2.xyz, c3.xyz].
                const sx = m[0] * x + m[3] * y + m[6] * z + m[9];
                const sy = m[1] * x + m[4] * y + m[7] * z + m[10];
                const sz = m[2] * x + m[5] * y + m[8] * z + m[11];
                x = sx; y = sy; z = sz;
                if (nrm) {
                    const tx = m[0] * nx + m[3] * ny + m[6] * nz;
                    const ty = m[1] * nx + m[4] * ny + m[7] * nz;
                    const tz = m[2] * nx + m[5] * ny + m[8] * nz;
                    nx = tx; ny = ty; nz = tz;
                }
            }

            outP[i * 3] = x; outP[i * 3 + 1] = y; outP[i * 3 + 2] = z;
            if (outN) {
                const l = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
                outN[i * 3] = nx / l; outN[i * 3 + 1] = ny / l; outN[i * 3 + 2] = nz / l;
            }
        }
    }

    /** m += Σ_k weight_k × S[joint_k] (upper 3×4) for one vertex's 4 joint slots. */
    private static _blend(m: Float64Array, S: Float64Array, joints: MeshAttributeView, weights: MeshAttributeView, i: number, jointCount: number): void {
        const jb = i * joints.stride + joints.offset, wb = i * weights.stride + weights.offset;
        for (let k = 0; k < 4; k++) {
            const w = weights.data[wb + k];
            if (w === 0) continue;
            const j = joints.data[jb + k] | 0;
            if (j < 0 || j >= jointCount) continue;
            const o = j * 16;
            m[0] += w * S[o]; m[1] += w * S[o + 1]; m[2] += w * S[o + 2];
            m[3] += w * S[o + 4]; m[4] += w * S[o + 5]; m[5] += w * S[o + 6];
            m[6] += w * S[o + 8]; m[7] += w * S[o + 9]; m[8] += w * S[o + 10];
            m[9] += w * S[o + 12]; m[10] += w * S[o + 13]; m[11] += w * S[o + 14];
        }
    }
}
