import { ComputeGPUBuffer, Vector3 } from '@orillusion/core';
import { ClothSimulatorConfig } from "./ClothSimulatorConfig";

export class ClothSimulatorBuffer {
    protected mPositionBuffer: ComputeGPUBuffer;
    protected mNormalBuffer: ComputeGPUBuffer;
    protected mVertexPositionData: Float32Array;
    protected mVertexPositionBuffer: ComputeGPUBuffer;
    protected mNewPositionBuffer: ComputeGPUBuffer;
    protected mAtomicPositionBuffer: ComputeGPUBuffer;
    protected mAtomicNormalBuffer: ComputeGPUBuffer;
    protected mVelocityBuffer: ComputeGPUBuffer;
    protected mStretchInfosBuffer: ComputeGPUBuffer;
    protected mBendInfosBuffer: ComputeGPUBuffer;
    protected mSurfaceInfosBuffer: ComputeGPUBuffer;
    // protected mInputData: Float32Array;
    protected mInputBuffer: ComputeGPUBuffer;
    protected mOutput0Buffer: ComputeGPUBuffer;

    constructor(config: ClothSimulatorConfig) {
        this.initGPUBuffer(config);
    }

    protected initGPUBuffer(config: ClothSimulatorConfig) {

        const { NUMPARTICLES, clothVertex } = config;

        let position_v4 = new Float32Array(NUMPARTICLES * 4)
        for (let i = 0; i < NUMPARTICLES; i++) {
            position_v4[i * 4] = clothVertex[i * 3]
            position_v4[i * 4 + 1] = clothVertex[i * 3 + 1]
            position_v4[i * 4 + 2] = clothVertex[i * 3 + 2]
            position_v4[i * 4 + 3] = 1
        }
        this.mVertexPositionData = position_v4;
        this.mVertexPositionBuffer = new ComputeGPUBuffer(this.mVertexPositionData.length);
        this.mVertexPositionBuffer.setFloat32Array("", this.mVertexPositionData);
        this.mVertexPositionBuffer.apply();

        this.mNewPositionBuffer = new ComputeGPUBuffer(this.mVertexPositionData.length);
        this.mNewPositionBuffer.setFloat32Array("", this.mVertexPositionData);
        this.mNewPositionBuffer.apply();

        this.mAtomicPositionBuffer = new ComputeGPUBuffer(this.mVertexPositionData.length);

        this.mAtomicNormalBuffer = new ComputeGPUBuffer(NUMPARTICLES * 4);
        this.mNormalBuffer = new ComputeGPUBuffer(NUMPARTICLES * 4);

        const { NUMTSURFACES, clothFaceTriIds } = config;

        const invMass = new Float32Array(NUMPARTICLES)
        for (let i = 0; i < NUMTSURFACES; i++) {
            var A = this.getTriArea(clothVertex, clothFaceTriIds, i);
            var pInvMass = A > 0.0 ? 1.0 / A / 3.0 : 0.0;
            invMass[clothFaceTriIds[3 * i]] += pInvMass;
            invMass[clothFaceTriIds[3 * i + 1]] += pInvMass;
            invMass[clothFaceTriIds[3 * i + 2]] += pInvMass;
        }
        let minX = Number.MAX_VALUE;
        let maxX = -Number.MAX_VALUE;
        let minY = Number.MAX_VALUE;
        let maxY = -Number.MAX_VALUE;
        for (let i = 0; i < NUMPARTICLES; i++) {
            minX = Math.min(minX, clothVertex[3 * i]);
            maxX = Math.max(maxX, clothVertex[3 * i]);
            minY = Math.min(minY, clothVertex[3 * i + 1]);
            maxY = Math.max(maxY, clothVertex[3 * i + 1]);
        }
        console.log(minX, maxX, minY, maxY)
        var eps = 0.0001;
        for (let i = 0; i < NUMPARTICLES; i++) {
            var x = clothVertex[3 * i];
            var y = clothVertex[3 * i + 1];
            if ((y > maxY - eps) && (x < minX + eps || x > maxX - eps))
                invMass[i] = 0.0;
        }

        const velocity = new Float32Array(4 * NUMPARTICLES)
        for (let i = 0; i < NUMPARTICLES; ++i) {
            velocity[i * 4 + 3] = invMass[i]
        }
        this.mVelocityBuffer = new ComputeGPUBuffer(velocity.length);
        this.mVelocityBuffer.setFloat32Array("", velocity);
        this.mVelocityBuffer.apply();

        const neighbors = this.findTriNeighbors(clothFaceTriIds);
        var edgeIds = [];
        var triPairIds = [];
        for (var i = 0; i < NUMTSURFACES; i++) {
            for (var j = 0; j < 3; j++) {
                var id0 = clothFaceTriIds[3 * i + j];
                var id1 = clothFaceTriIds[3 * i + (j + 1) % 3];

                // each edge only once
                var n = neighbors[3 * i + j];
                if (n < 0 || id0 < id1) {
                    edgeIds.push(id0);
                    edgeIds.push(id1);
                }
                // tri pair
                if (n >= 0 && id0 > id1) {
                    // opposite ids
                    var ni = Math.floor(n / 3);
                    var nj = n % 3;
                    var id2 = clothFaceTriIds[3 * i + (j + 2) % 3];
                    var id3 = clothFaceTriIds[3 * ni + (nj + 2) % 3];
                    triPairIds.push(id0);
                    triPairIds.push(id1);
                    triPairIds.push(id2);
                    triPairIds.push(id3);
                }
            }
        }
        const NUMTEDGES = edgeIds.length / 2
        config.NUMTEDGES = NUMTEDGES
        const stretchInfos = new Float32Array(4 * NUMTEDGES)
        for (var i = 0; i < NUMTEDGES; i++) {
            stretchInfos[i * 4 + 0] = edgeIds[2 * i];
            stretchInfos[i * 4 + 1] = edgeIds[2 * i + 1];
            stretchInfos[i * 4 + 2] = Math.sqrt(this.distance(clothVertex, stretchInfos[i * 4], clothVertex, stretchInfos[i * 4 + 1]));
        }
        this.mStretchInfosBuffer = new ComputeGPUBuffer(stretchInfos.length);
        this.mStretchInfosBuffer.setFloat32Array("", stretchInfos);
        this.mStretchInfosBuffer.apply();

        const NUMTBENDS = triPairIds.length / 4
        config.NUMTBENDS = NUMTBENDS
        const bendInfos = new Float32Array(4 * NUMTBENDS)
        for (var i = 0; i < NUMTBENDS; i++) {
            bendInfos[i * 4 + 0] = triPairIds[4 * i + 2];
            bendInfos[i * 4 + 1] = triPairIds[4 * i + 3];
            bendInfos[i * 4 + 2] = Math.sqrt(this.distance(clothVertex, bendInfos[i * 4], clothVertex, bendInfos[i * 4 + 1]));
        }
        this.mBendInfosBuffer = new ComputeGPUBuffer(bendInfos.length);
        this.mBendInfosBuffer.setFloat32Array("", bendInfos);
        this.mBendInfosBuffer.apply();

        let surfaceInfos = new Float32Array(clothFaceTriIds.length / 3 * 4)
        for (let i = 0; i < clothFaceTriIds.length / 3; i++) {
            surfaceInfos[i * 4] = clothFaceTriIds[i * 3]
            surfaceInfos[i * 4 + 1] = clothFaceTriIds[i * 3 + 1]
            surfaceInfos[i * 4 + 2] = clothFaceTriIds[i * 3 + 2]
            surfaceInfos[i * 4 + 3] = 1
        }
        this.mSurfaceInfosBuffer = new ComputeGPUBuffer(surfaceInfos.length);
        this.mSurfaceInfosBuffer.setFloat32Array("", surfaceInfos);
        this.mSurfaceInfosBuffer.apply();

        const { GRAVITY, DELTATIME, NUMSUBSTEPS, STRETCHCOMPLIANCE, BENDCOMPLIANCE, SPHERERADIUS, SPHERECENTREX, SPHERECENTREY, SPHERECENTREZ } = config;
        this.mInputBuffer = new ComputeGPUBuffer(16);
        this.mInputBuffer.setFloat("NUMPARTICLES", NUMPARTICLES);
        this.mInputBuffer.setFloat("NUMTEDGES", NUMTEDGES);
        this.mInputBuffer.setFloat("NUMTBENDS", NUMTBENDS);
        this.mInputBuffer.setFloat("NUMTSURFACES", NUMTSURFACES);
        this.mInputBuffer.setFloat("GRAVITY", GRAVITY);
        this.mInputBuffer.setFloat("DELTATIME", DELTATIME / NUMSUBSTEPS);
        this.mInputBuffer.setFloat("STRETCHCOMPLIANCE", STRETCHCOMPLIANCE);
        this.mInputBuffer.setFloat("BENDCOMPLIANCE", BENDCOMPLIANCE);
        this.mInputBuffer.setFloat("SPHERERADIUS", SPHERERADIUS);
        this.mInputBuffer.setFloat("SPHERECENTREX", SPHERECENTREX);
        this.mInputBuffer.setFloat("SPHERECENTREY", SPHERECENTREY);
        this.mInputBuffer.setFloat("SPHERECENTREZ", SPHERECENTREZ);
        this.mInputBuffer.setFloat("ALPA", 0.0);
        this.mInputBuffer.apply();

        this.mOutput0Buffer = new ComputeGPUBuffer(NUMPARTICLES * 4);
    }

    public updateInputData(pos: Vector3) {
        this.mInputBuffer.setFloat("SPHERECENTREX", pos.x);
        this.mInputBuffer.setFloat("SPHERECENTREY", pos.y);
        this.mInputBuffer.setFloat("SPHERECENTREZ", pos.z);
        this.mInputBuffer.apply();
    }

    protected getTriArea(position: Float32Array | Uint16Array | Uint32Array, triIds: Float32Array | Uint16Array | Uint32Array, i: number) {
        let id0 = triIds[3 * i];
        let id1 = triIds[3 * i + 1];
        let id2 = triIds[3 * i + 2];

        let temp = [0, 0, 0, 0, 0, 0, 0, 0, 0];
        temp[0] = position[id1 * 3] - position[id0 * 3];
        temp[1] = position[id1 * 3 + 1] - position[id0 * 3 + 1];
        temp[2] = position[id1 * 3 + 2] - position[id0 * 3 + 2];
        temp[3] = position[id2 * 3] - position[id0 * 3];
        temp[4] = position[id2 * 3 + 1] - position[id0 * 3 + 1];
        temp[5] = position[id2 * 3 + 2] - position[id0 * 3 + 2];

        this.cross(temp, 2, temp, 0, temp, 1);
        return this.dot(temp, 2, temp, 2) / 2.0;
    }

    protected cross(a: number[], indexa: number, b: number[], indexb: number, c: number[], indexc: number) {
        a[indexa * 3] = b[indexb * 3 + 1] * c[indexc * 3 + 2] - b[indexb * 3 + 2] * c[indexc * 3 + 1];
        a[indexa * 3 + 1] = b[indexb * 3 + 2] * c[indexc * 3 + 0] - b[indexb * 3 + 0] * c[indexc * 3 + 2];
        a[indexa * 3 + 2] = b[indexb * 3 + 0] * c[indexc * 3 + 1] - b[indexb * 3 + 1] * c[indexc * 3 + 0];
    }

    protected dot(a: number[], indexa: number, b: number[], indexb: number) {
        return a[indexa * 3] * b[indexb * 3] + a[indexa * 3 + 1] * b[indexb * 3 + 1] + a[indexa * 3 + 2] * b[indexb * 3 + 2];
    }

    protected findTriNeighbors(triIds: Float32Array | Uint16Array | Uint32Array) {
        // create common edges
        var edges = [];
        var numTris = triIds.length / 3;

        for (var i = 0; i < numTris; i++) {
            for (var j = 0; j < 3; j++) {
                var id0 = triIds[3 * i + j];
                var id1 = triIds[3 * i + (j + 1) % 3];
                edges.push({
                    id0: Math.min(id0, id1),
                    id1: Math.max(id0, id1),
                    edgeNr: 3 * i + j
                });
            }
        }

        // sort so common edges are next to each other
        edges.sort((a, b) => ((a.id0 < b.id0) || (a.id0 == b.id0 && a.id1 < b.id1)) ? -1 : 1);

        // find matchign edges
        const neighbors = new Float32Array(3 * numTris);
        neighbors.fill(-1);        // open edge

        var nr = 0;
        while (nr < edges.length) {
            var e0 = edges[nr];
            nr++;
            if (nr < edges.length) {
                var e1 = edges[nr];
                if (e0.id0 == e1.id0 && e0.id1 == e1.id1) {
                    neighbors[e0.edgeNr] = e1.edgeNr;
                    neighbors[e1.edgeNr] = e0.edgeNr;
                }
                // nr++;
            }
        }

        return neighbors;
    }

    protected distance(a: Float32Array | Uint16Array | Uint32Array, indexa: number, b: Float32Array | Uint16Array | Uint32Array, indexb: number) {
        let a0 = a[indexa * 3] - b[indexb * 3], a1 = a[indexa * 3 + 1] - b[indexb * 3 + 1], a2 = a[indexa * 3 + 2] - b[indexb * 3 + 2];
        return a0 * a0 + a1 * a1 + a2 * a2;
    }
}
