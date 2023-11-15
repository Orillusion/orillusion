import { ComputeGPUBuffer, webGPUContext, Vector3 } from '@orillusion/core';
import { HairSimulatorConfig } from "./HairSimulatorConfig";

export class HairSimulatorBuffer {
    protected mConfig: HairSimulatorConfig;
    protected mPositionData: Float32Array;
    protected mPositionBuffer: ComputeGPUBuffer;
    protected mTempPositionBuffer: ComputeGPUBuffer;
    protected mNewPositionBuffer: ComputeGPUBuffer;
    protected mAnchorPositionData: Float32Array;
    protected mAnchorPositionBuffer: ComputeGPUBuffer;
    protected mVelocityBuffer: ComputeGPUBuffer;
    // protected mInputData: Float32Array;
    protected mInputBuffer: ComputeGPUBuffer;
    protected mOutput0Buffer: ComputeGPUBuffer;

    constructor(config: HairSimulatorConfig) {
        this.mConfig = config;
        this.initGPUBuffer(config);
    }

    protected initGPUBuffer(config: HairSimulatorConfig) {
        let device = webGPUContext.device;

        const { NUM, BACK, FRONT, SEGMENTFBACK, LENGTHSEGMENT, SEGMENTFRONT } = config;

        // core position buffer
        const position = new Float32Array(4 * NUM);
        let r, a = 0;
        var offset = 4 * BACK * (SEGMENTFBACK + 1)
        for (let i = 0; i < BACK; ++i) {
            r = Math.random() / 2.0 //* 2.0 - 1.0
            a = Math.random()
            position[i * (SEGMENTFBACK + 1) * 4 + 0] = Math.cos(r * Math.PI) * Math.sin(a * Math.PI) // x
            position[i * (SEGMENTFBACK + 1) * 4 + 1] = Math.sin(r * Math.PI) * Math.sin(a * Math.PI) // y
            position[i * (SEGMENTFBACK + 1) * 4 + 2] = Math.cos(a * Math.PI) // z
            position[i * (SEGMENTFBACK + 1) * 4 + 3] = 0 // w
            for (let j = 1; j < SEGMENTFBACK + 1; ++j) {
                position[(i * (SEGMENTFBACK + 1) + j) * 4 + 0] = position[i * (SEGMENTFBACK + 1) * 4 + 0] + j * LENGTHSEGMENT // x
                position[(i * (SEGMENTFBACK + 1) + j) * 4 + 1] = position[i * (SEGMENTFBACK + 1) * 4 + 1] + 0.0 // y
                position[(i * (SEGMENTFBACK + 1) + j) * 4 + 2] = position[i * (SEGMENTFBACK + 1) * 4 + 2] + 0.0 // z
                position[(i * (SEGMENTFBACK + 1) + j) * 4 + 3] = j // w
                // console.log((i * (SEGMENTFBACK + 1) + j) * 4 + 3)
            }
            // console.log('position', i, position[i * 4 + 0], position[i * 4 + 1], position[i * 4 + 2]);
        }

        for (let i = 0; i < FRONT; ++i) {
            a = Math.random()
            position[offset + i * (SEGMENTFRONT + 1) * 4 + 0] = 0.0 // x
            position[offset + i * (SEGMENTFRONT + 1) * 4 + 1] = Math.sin(a * Math.PI) // y
            position[offset + i * (SEGMENTFRONT + 1) * 4 + 2] = Math.cos(a * Math.PI) // z
            position[offset + i * (SEGMENTFRONT + 1) * 4 + 3] = 0 // w
            // console.log('position', i * (SEGMENTFRONT + 1), position[i * (SEGMENTFRONT + 1) * 4 + 0], position[i * (SEGMENTFRONT + 1) * 4 + 1], position[i * (SEGMENTFRONT + 1) * 4 + 1]);
            for (let j = 1; j < SEGMENTFRONT + 1; ++j) {
                position[offset + (i * (SEGMENTFRONT + 1) + j) * 4 + 0] = position[offset + i * (SEGMENTFRONT + 1) * 4 + 0] - j * LENGTHSEGMENT // x
                position[offset + (i * (SEGMENTFRONT + 1) + j) * 4 + 1] = position[offset + i * (SEGMENTFRONT + 1) * 4 + 1] + 0.0 // y
                position[offset + (i * (SEGMENTFRONT + 1) + j) * 4 + 2] = position[offset + i * (SEGMENTFRONT + 1) * 4 + 2] + 0.0 // z
                position[offset + (i * (SEGMENTFRONT + 1) + j) * 4 + 3] = j // w
                // console.log(offset, i, j, offset + (i * (SEGMENTFRONT + 1) + j) * 4 + 3)
            }
            // console.log('position', i, position[i * 4 + 0], position[i * 4 + 1], position[i * 4 + 2]);
        }
        this.mPositionData = position;
        this.mPositionBuffer = new ComputeGPUBuffer(this.mPositionData.length);
        this.mPositionBuffer.setFloat32Array("", this.mPositionData);
        this.mPositionBuffer.apply();

        this.mTempPositionBuffer = new ComputeGPUBuffer(this.mPositionData.length);
        this.mTempPositionBuffer.setFloat32Array("", this.mPositionData);
        this.mTempPositionBuffer.apply();

        this.mNewPositionBuffer = new ComputeGPUBuffer(this.mPositionData.length);
        this.mNewPositionBuffer.setFloat32Array("", this.mPositionData);
        this.mNewPositionBuffer.apply();

        const anchor = new Float32Array(4 * NUM)
        for (let i = 0; i < BACK; ++i) {
            anchor[i * (SEGMENTFBACK + 1) * 4 + 0] = position[i * (SEGMENTFBACK + 1) * 4 + 0] // x
            anchor[i * (SEGMENTFBACK + 1) * 4 + 1] = position[i * (SEGMENTFBACK + 1) * 4 + 1] // y
            anchor[i * (SEGMENTFBACK + 1) * 4 + 2] = position[i * (SEGMENTFBACK + 1) * 4 + 2] // z
            anchor[i * (SEGMENTFBACK + 1) * 4 + 3] = position[i * (SEGMENTFBACK + 1) * 4 + 3] // w
            for (let j = 1; j < SEGMENTFBACK + 1; ++j) {
                anchor[(i * (SEGMENTFBACK + 1) + j) * 4 + 0] = position[(i * (SEGMENTFBACK + 1) + j - 1) * 4 + 0] // x
                anchor[(i * (SEGMENTFBACK + 1) + j) * 4 + 1] = position[(i * (SEGMENTFBACK + 1) + j - 1) * 4 + 1] // y
                anchor[(i * (SEGMENTFBACK + 1) + j) * 4 + 2] = position[(i * (SEGMENTFBACK + 1) + j - 1) * 4 + 2] // z
                anchor[(i * (SEGMENTFBACK + 1) + j) * 4 + 3] = position[(i * (SEGMENTFBACK + 1) + j - 1) * 4 + 3] // w
            }
            // console.log('anchor', i, anchor[i * 4 + 0], anchor[i * 4 + 1], anchor[i * 4 + 2]);
        }
        for (let i = 0; i < FRONT; ++i) {
            anchor[offset + i * (SEGMENTFRONT + 1) * 4 + 0] = position[offset + i * (SEGMENTFRONT + 1) * 4 + 0] // x
            anchor[offset + i * (SEGMENTFRONT + 1) * 4 + 1] = position[offset + i * (SEGMENTFRONT + 1) * 4 + 1] // y
            anchor[offset + i * (SEGMENTFRONT + 1) * 4 + 2] = position[offset + i * (SEGMENTFRONT + 1) * 4 + 2] // z
            anchor[offset + i * (SEGMENTFRONT + 1) * 4 + 3] = position[offset + i * (SEGMENTFRONT + 1) * 4 + 3] // w
            for (let j = 1; j < SEGMENTFRONT + 1; ++j) {
                anchor[offset + (i * (SEGMENTFRONT + 1) + j) * 4 + 0] = position[(offset + i * (SEGMENTFRONT + 1) + j - 1) * 4 + 0] // x
                anchor[offset + (i * (SEGMENTFRONT + 1) + j) * 4 + 1] = position[(offset + i * (SEGMENTFRONT + 1) + j - 1) * 4 + 1] // y
                anchor[offset + (i * (SEGMENTFRONT + 1) + j) * 4 + 2] = position[(offset + i * (SEGMENTFRONT + 1) + j - 1) * 4 + 2] // z
                anchor[offset + (i * (SEGMENTFRONT + 1) + j) * 4 + 3] = position[(offset + i * (SEGMENTFRONT + 1) + j - 1) * 4 + 3] // w
            }
            // console.log('anchor', i, anchor[i * 4 + 0], anchor[i * 4 + 1], anchor[i * 4 + 2]);
        }
        this.mAnchorPositionData = anchor;
        this.mAnchorPositionBuffer = new ComputeGPUBuffer(this.mAnchorPositionData.length);
        this.mAnchorPositionBuffer.setFloat32Array("", this.mAnchorPositionData);
        this.mAnchorPositionBuffer.apply();

        const velocity = new Float32Array(4 * NUM);
        this.mVelocityBuffer = new ComputeGPUBuffer(velocity.length);

        const { GRAVITY, DELTATIME, DAMPING, HEADX, HEADY, HEADZ, HEADR, NEWHEADX, NEWHEADY, NEWHEADZ } = config;
        this.mInputBuffer = new ComputeGPUBuffer(16);
        this.mInputBuffer.setFloat("NUM", NUM);
        this.mInputBuffer.setFloat("BACKNUM", BACK * (SEGMENTFBACK + 1));
        this.mInputBuffer.setFloat("FRONTNUM", FRONT * (SEGMENTFRONT + 1));
        this.mInputBuffer.setFloat("GRAVITY", GRAVITY);
        this.mInputBuffer.setFloat("DELTATIME", DELTATIME);
        this.mInputBuffer.setFloat("LENGTHSEGMENT", LENGTHSEGMENT);
        this.mInputBuffer.setFloat("DAMPING", DAMPING);
        this.mInputBuffer.setFloat("HEADX", HEADX);
        this.mInputBuffer.setFloat("HEADY", HEADY);
        this.mInputBuffer.setFloat("HEADZ", HEADZ);
        this.mInputBuffer.setFloat("HEADR", HEADR);
        this.mInputBuffer.setFloat("NEWHEADX", NEWHEADX);
        this.mInputBuffer.setFloat("NEWHEADY", NEWHEADY);
        this.mInputBuffer.setFloat("NEWHEADZ", NEWHEADZ);
        this.mInputBuffer.apply();

        this.mOutput0Buffer = new ComputeGPUBuffer((NUM + 10) * 4);
    }

    public updateInputData(pos: Vector3, newpos: Vector3) {
        this.mInputBuffer.setFloat("HEADX", pos.x);
        this.mInputBuffer.setFloat("HEADY", pos.y);
        this.mInputBuffer.setFloat("HEADZ", pos.z);
        this.mInputBuffer.setFloat("NEWHEADX", newpos.x);
        this.mInputBuffer.setFloat("NEWHEADY", newpos.y);
        this.mInputBuffer.setFloat("NEWHEADZ", newpos.z);
        this.mInputBuffer.apply();
    }
}
