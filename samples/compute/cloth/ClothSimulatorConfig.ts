import { ComputeGPUBuffer } from '@orillusion/core';

export type ClothSimulatorConfig = {
    NUMPARTICLES: number,
    NUMTSURFACES: number,
    NUMTEDGES: number,
    NUMTBENDS: number,
    GRAVITY: number,
    DELTATIME: number,
    NUMSUBSTEPS: number,
    STRETCHCOMPLIANCE: number,
    BENDCOMPLIANCE: number,
    SPHERERADIUS: number,
    SPHERECENTREX: number,
    SPHERECENTREY: number,
    SPHERECENTREZ: number,
    clothVertex: Float32Array | Uint16Array | Uint32Array,
    clothFaceTriIds: Float32Array | Uint16Array | Uint32Array,
    clothVertexBuffer: ComputeGPUBuffer,
};
