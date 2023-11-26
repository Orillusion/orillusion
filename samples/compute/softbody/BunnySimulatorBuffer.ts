import { ComputeGPUBuffer, Vector3, webGPUContext } from '@orillusion/core';
import { BunnySimulatorConfig } from "./BunnySimulatorConfig";

export class BunnySimulatorBuffer {
    protected mPositionBuffer: ComputeGPUBuffer;
    protected mNormalBuffer: ComputeGPUBuffer;
    protected mVertexPositionData: Float32Array;
    protected mVertexPositionBuffer: ComputeGPUBuffer;
    protected mNewPositionBuffer: ComputeGPUBuffer;
    protected mAtomicPositionBuffer: ComputeGPUBuffer;
    protected mAtomicNormalBuffer: ComputeGPUBuffer;
    protected mVelocityBuffer: ComputeGPUBuffer;
    protected mEdgeInfosBuffer: ComputeGPUBuffer;
    protected mTetIdsBuffer: ComputeGPUBuffer;
    protected mRestVolBuffer: ComputeGPUBuffer;
    protected mSurfaceInfosBuffer: ComputeGPUBuffer;
    // protected mInputData: Float32Array;
    protected mInputBuffer: ComputeGPUBuffer;
    protected mOutput0Buffer: ComputeGPUBuffer;

    constructor(config: BunnySimulatorConfig) {
        this.initGPUBuffer(config);
    }

    protected initGPUBuffer(config: BunnySimulatorConfig) {
        const { NUMPARTICLES, bunnyVertex } = config;

        let vertex = new Float32Array(NUMPARTICLES * 4)
        for (let i = 0; i < NUMPARTICLES; i++) {
            vertex[i * 4] = bunnyVertex[i * 3]
            vertex[i * 4 + 1] = bunnyVertex[i * 3 + 1]
            vertex[i * 4 + 2] = bunnyVertex[i * 3 + 2]
            vertex[i * 4 + 3] = 1
        }
        this.mVertexPositionData = vertex;
        this.mVertexPositionBuffer = new ComputeGPUBuffer(this.mVertexPositionData.length);
        this.mVertexPositionBuffer.setFloat32Array("", this.mVertexPositionData);
        this.mVertexPositionBuffer.apply();

        this.mNewPositionBuffer = new ComputeGPUBuffer(this.mVertexPositionData.length);
        this.mNewPositionBuffer.setFloat32Array("", this.mVertexPositionData);
        this.mNewPositionBuffer.apply();

        this.mAtomicPositionBuffer = new ComputeGPUBuffer(this.mVertexPositionData.length);

        this.mAtomicNormalBuffer = new ComputeGPUBuffer(NUMPARTICLES * 4);
        this.mNormalBuffer = new ComputeGPUBuffer(NUMPARTICLES * 4);

        const { NUMTETS, bunnyTetIds } = config;

        const invMass = new Float32Array(NUMPARTICLES)
        const restVol = new Float32Array(NUMTETS)
        const tetIds = new Int32Array(NUMTETS * 4)
        for (let i = 0; i < NUMTETS; i++) {
            var vol = this.getTetVolume(bunnyVertex, bunnyTetIds, i);
            restVol[i] = vol;
            var pInvMass = vol > 0.0 ? 1.0 / (vol / 4.0) : 0.0;
            invMass[bunnyTetIds[4 * i]] += pInvMass;
            invMass[bunnyTetIds[4 * i + 1]] += pInvMass;
            invMass[bunnyTetIds[4 * i + 2]] += pInvMass;
            invMass[bunnyTetIds[4 * i + 3]] += pInvMass;
            tetIds[4 * i] = bunnyTetIds[4 * i];
            tetIds[4 * i + 1] = bunnyTetIds[4 * i + 1];
            tetIds[4 * i + 2] = bunnyTetIds[4 * i + 2];
            tetIds[4 * i + 3] = bunnyTetIds[4 * i + 3];
        }
        this.mTetIdsBuffer = new ComputeGPUBuffer(tetIds.length);
        webGPUContext.device.queue.writeBuffer(this.mTetIdsBuffer.buffer, 0, tetIds);
        // this.mTetIdsBuffer.setInt32Array("", tetIds);
        // this.mTetIdsBuffer.apply();

        this.mRestVolBuffer = new ComputeGPUBuffer(restVol.length);
        this.mRestVolBuffer.setFloat32Array("", restVol);
        this.mRestVolBuffer.apply();

        const velocity = new Float32Array(4 * NUMPARTICLES)
        for (let i = 0; i < NUMPARTICLES; ++i) {
            velocity[i * 4 + 3] = invMass[i]
        }
        this.mVelocityBuffer = new ComputeGPUBuffer(velocity.length);
        this.mVelocityBuffer.setFloat32Array("", velocity);
        this.mVelocityBuffer.apply();

        const { NUMTEDGES, bunnyEdgeIds } = config;

        const edgeInfos = new Float32Array(NUMTEDGES * 4)
        for (var i = 0; i < NUMTEDGES; i++) {
            edgeInfos[i * 4 + 0] = bunnyEdgeIds[2 * i];
            edgeInfos[i * 4 + 1] = bunnyEdgeIds[2 * i + 1];
            edgeInfos[i * 4 + 2] = Math.sqrt(this.distance(bunnyVertex, edgeInfos[i * 4], bunnyVertex, edgeInfos[i * 4 + 1]));
        }
        this.mEdgeInfosBuffer = new ComputeGPUBuffer(edgeInfos.length);
        this.mEdgeInfosBuffer.setFloat32Array("", edgeInfos);
        this.mEdgeInfosBuffer.apply();

        const {NUMTSURFACES, bunnySurfaceTriIds} = config;
        const surfaceInfos = new Float32Array(NUMTSURFACES * 4)
        for (let i = 0; i < NUMTSURFACES; i++) {
            surfaceInfos[i * 4] = bunnySurfaceTriIds[i * 3]
            surfaceInfos[i * 4 + 1] = bunnySurfaceTriIds[i * 3 + 1]
            surfaceInfos[i * 4 + 2] = bunnySurfaceTriIds[i * 3 + 2]
            surfaceInfos[i * 4 + 3] = 1
        }
        this.mSurfaceInfosBuffer = new ComputeGPUBuffer(surfaceInfos.length);
        this.mSurfaceInfosBuffer.setFloat32Array("", surfaceInfos);
        this.mSurfaceInfosBuffer.apply();

        const { GRAVITY, DELTATIME, NUMSUBSTEPS, EDGECOMPLIANCE, VOLCOMPLIANCE, CUBECENTREX, CUBECENTREY, CUBECENTREZ, CUBEWIDTH, CUBEHEIGHT, CUBEDEPTH } = config;
        this.mInputBuffer = new ComputeGPUBuffer(16);
        this.mInputBuffer.setFloat("NUMPARTICLES", NUMPARTICLES);
        this.mInputBuffer.setFloat("NUMTETS", NUMTETS);
        this.mInputBuffer.setFloat("NUMTEDGES", NUMTEDGES);
        this.mInputBuffer.setFloat("NUMTSURFACES", NUMTSURFACES);
        this.mInputBuffer.setFloat("GRAVITY", GRAVITY);
        this.mInputBuffer.setFloat("DELTATIME", DELTATIME / NUMSUBSTEPS);
        this.mInputBuffer.setFloat("EDGECOMPLIANCE", EDGECOMPLIANCE);
        this.mInputBuffer.setFloat("VOLCOMPLIANCE", VOLCOMPLIANCE);
        this.mInputBuffer.setFloat("CUBECENTREX", CUBECENTREX);
        this.mInputBuffer.setFloat("CUBECENTREY", CUBECENTREY);
        this.mInputBuffer.setFloat("CUBECENTREZ", CUBECENTREZ);
        this.mInputBuffer.setFloat("CUBEWIDTH", CUBEWIDTH);
        this.mInputBuffer.setFloat("CUBEHEIGHT", CUBEHEIGHT);
        this.mInputBuffer.setFloat("CUBEDEPTH", CUBEDEPTH);
        this.mInputBuffer.apply();

        this.mOutput0Buffer = new ComputeGPUBuffer(NUMTETS * 4);
        // this.mOutput0Buffer.debug();
    }

    public updateInputData(pos: Vector3) {
        this.mInputBuffer.setFloat("CUBECENTREX", pos.x);
        this.mInputBuffer.setFloat("CUBECENTREY", pos.y);
        this.mInputBuffer.setFloat("CUBECENTREZ", pos.z);
        this.mInputBuffer.apply();
    }

    protected cross(a: number[], indexa: number, b: number[], indexb: number, c: number[], indexc: number) {
        a[indexa * 3] = b[indexb * 3 + 1] * c[indexc * 3 + 2] - b[indexb * 3 + 2] * c[indexc * 3 + 1];
        a[indexa * 3 + 1] = b[indexb * 3 + 2] * c[indexc * 3 + 0] - b[indexb * 3 + 0] * c[indexc * 3 + 2];
        a[indexa * 3 + 2] = b[indexb * 3 + 0] * c[indexc * 3 + 1] - b[indexb * 3 + 1] * c[indexc * 3 + 0];
    }

    protected dot(a: number[], indexa: number, b: number[], indexb: number) {
        return a[indexa * 3] * b[indexb * 3] + a[indexa * 3 + 1] * b[indexb * 3 + 1] + a[indexa * 3 + 2] * b[indexb * 3 + 2];
    }
    
    protected getTetVolume(position: Float32Array | Uint16Array | Uint32Array, tetIds: Float32Array | Uint16Array | Uint32Array, i: number) {
        let id0 = tetIds[4 * i];
        let id1 = tetIds[4 * i + 1];
        let id2 = tetIds[4 * i + 2];
        let id3 = tetIds[4 * i + 3];

        let temp = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
        temp[0] = position[id1 * 3] - position[id0 * 3];
        temp[1] = position[id1 * 3 + 1] - position[id0 * 3 + 1];
        temp[2] = position[id1 * 3 + 2] - position[id0 * 3 + 2];
        temp[3] = position[id2 * 3] - position[id0 * 3];
        temp[4] = position[id2 * 3 + 1] - position[id0 * 3 + 1];
        temp[5] = position[id2 * 3 + 2] - position[id0 * 3 + 2];
        temp[6] = position[id3 * 3] - position[id0 * 3];
        temp[7] = position[id3 * 3 + 1] - position[id0 * 3 + 1];
        temp[8] = position[id3 * 3 + 2] - position[id0 * 3 + 2];

        this.cross(temp, 3, temp, 0, temp, 1);
        return this.dot(temp, 3, temp, 2) / 6.0;
    }

    protected distance(a: Float32Array | Uint16Array | Uint32Array, indexa: number, b: Float32Array | Uint16Array | Uint32Array, indexb: number) {
        let a0 = a[indexa * 3] - b[indexb * 3], a1 = a[indexa * 3 + 1] - b[indexb * 3 + 1], a2 = a[indexa * 3 + 2] - b[indexb * 3 + 2];
        return a0 * a0 + a1 * a1 + a2 * a2;
    }    
}
