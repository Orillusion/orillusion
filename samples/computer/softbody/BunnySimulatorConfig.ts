import { ComputeGPUBuffer } from '@orillusion/core';

export type BunnySimulatorConfig = {
    NUMPARTICLES: number,
    NUMTETS: number,
    NUMTEDGES: number,
    NUMTSURFACES: number,
    GRAVITY: number,
    DELTATIME: number,
    NUMSUBSTEPS: number,
    EDGECOMPLIANCE: number,
    VOLCOMPLIANCE: number,
    CUBECENTREX: number,
    CUBECENTREY: number,
    CUBECENTREZ: number,
    CUBEWIDTH: number,
    CUBEHEIGHT: number,
    CUBEDEPTH: number,
    bunnyVertex: Float32Array | Uint16Array | Uint32Array,
    bunnyTetIds: Float32Array | Uint16Array | Uint32Array,
    bunnyEdgeIds: Float32Array | Uint16Array | Uint32Array,
    bunnySurfaceTriIds: Float32Array | Uint16Array | Uint32Array,
    bunnyVertexBuffer: ComputeGPUBuffer,
};
