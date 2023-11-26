import { CylinderGeometry, Engine3D, Texture, KeyCode, KeyEvent, MeshRenderer, Object3D, RendererMask, RendererPassState, Time, Vector3, webGPUContext, View3D, ComputeGPUBuffer, ClusterLightingBuffer, PassType } from '@orillusion/core';
import { HairSimulatorConfig } from "./HairSimulatorConfig";
import { HairSimulatorMaterial } from "./HairSimulatorMaterial";
import { HairSimulatorPipeline } from "./HairSimulatorPipeline";

export class HairSimulator extends MeshRenderer {
    protected mConfig: HairSimulatorConfig;
    protected mGlobalArgs: ComputeGPUBuffer;
    protected mInteractionSphere: Object3D;
    protected mHairTexture: Texture;
    protected mComputePipeline: HairSimulatorPipeline;
    protected mKeyState: boolean[] = [false, false, false, false];

    constructor() {
        super();
        this.rendererMask = RendererMask.Particle;
        this.mConfig = {
            GROUP_SIZE: 128,
            FRONT: 100 * 2,
            BACK: 1000 * 2,
            GRAVITY: -10,
            LENGTHSEGMENT: 0.1,
            SEGMENTFRONT: 10,
            SEGMENTFBACK: 30,
            DELTATIME: 1 / 60,
            DAMPING: 0.9,
            NUM: 0,
            HEADX: 0.0,
            HEADY: 0.0,
            HEADZ: 0.0,
            HEADR: 1.0,
            NEWHEADX: 0.0,
            NEWHEADY: 0.0,
            NEWHEADZ: 0.0,
        };
        this.mConfig.NUM = this.mConfig.FRONT * (this.mConfig.SEGMENTFRONT + 1) + this.mConfig.BACK * (this.mConfig.SEGMENTFBACK + 1);
    }

    protected updateKeyState(keyCode: number, state: boolean) {
        switch (keyCode) {
            case KeyCode.Key_W:
                this.mKeyState[0] = state;
                break;
            case KeyCode.Key_S:
                this.mKeyState[1] = state;
                break;
            case KeyCode.Key_A:
                this.mKeyState[2] = state;
                break;
            case KeyCode.Key_D:
                this.mKeyState[3] = state;
                break;
        }
    }

    public init() {
        super.init();
        this.alwaysRender = true;
        // this.geometry = new PlaneGeometry(0.01, 0.01, 1.0, 1.0, Vector3.Z_AXIS);
        this.geometry = new CylinderGeometry(0.001, 0.001, this.mConfig.LENGTHSEGMENT);
        this.material = new HairSimulatorMaterial();
        // this.material.baseMap = this.mHairTexture;
        let device = webGPUContext.device;
        var globalArgsData = new Float32Array(4);
        this.mGlobalArgs = new ComputeGPUBuffer(globalArgsData.byteLength);
        globalArgsData[0] = this.transform.worldMatrix.index;
        this.mGlobalArgs.setFloat32Array("", globalArgsData);
        this.mGlobalArgs.apply();

        this.mComputePipeline = new HairSimulatorPipeline(this.mConfig);

        this.instanceCount = this.mConfig.NUM;   
    }

    public start() {
        Engine3D.inputSystem.addEventListener(KeyEvent.KEY_DOWN, (e: KeyEvent) => this.updateKeyState(e.keyCode, true), this);
        Engine3D.inputSystem.addEventListener(KeyEvent.KEY_UP, (e: KeyEvent) => this.updateKeyState(e.keyCode, false), this);
    }

    public SetInteractionSphere(sphere: Object3D, HairTexture: Texture) {
        this.mInteractionSphere = sphere;
        this.mHairTexture = HairTexture;
    }

    private _tickTime = 0;

    public onCompute(view: View3D, command?: GPUCommandEncoder) {
        this._tickTime += Time.delta / 1000.0;
        if (this._tickTime >= this.mConfig.DELTATIME) {
            this._tickTime -= this.mConfig.DELTATIME;
            var pos = new Vector3();
            var newpos = new Vector3();
            if (this.mInteractionSphere) {
                var transform = this.mInteractionSphere.transform;
                pos.copyFrom(this.mInteractionSphere.transform.worldPosition);
                let dt = Time.delta / 1000.0;
                let speed = 0.5 * dt;
                // console.log(speed);
                // W S
                if (this.mKeyState[0]) {
                    transform.y += speed
                } else if (this.mKeyState[1]) {
                    transform.y -= speed
                }
                // A D
                if (this.mKeyState[2]) {
                    transform.x -= speed
                } else if (this.mKeyState[3]) {
                    transform.x += speed
                }
                newpos.copyFrom(this.mInteractionSphere.transform.worldPosition);
            }
            // console.log(pos, newpos);
            this.mComputePipeline.compute(command, pos, newpos);
        }
    }

    public nodeUpdate(view: View3D, passType: PassType, renderPassState: RendererPassState, clusterLightingBuffer: ClusterLightingBuffer) {
        let material = this.materials[0];
        let passes = material.getPass(passType);
        if (passes) {
            for (let i = 0; i < passes.length; i++) {
                var subs = passes[i];
                subs.setStorageBuffer(`particleGlobalData`, this.mGlobalArgs);
                subs.setStorageBuffer(`particlePosition`, this.mComputePipeline.positionBuffer);
                subs.setStorageBuffer(`anchorPosition`, this.mComputePipeline.anchorPositionBuffer);
            }
            super.nodeUpdate(view, passType, renderPassState, clusterLightingBuffer);
        }
    }

}
