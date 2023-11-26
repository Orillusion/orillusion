import { Engine3D, LitMaterial, KeyCode, KeyEvent, MeshRenderer, Object3D, Time, Vector3, VertexAttributeName, View3D } from '@orillusion/core';
import { BunnySimulatorConfig } from "./BunnySimulatorConfig";
import { BunnySimulatorPipeline } from "./BunnySimulatorPipeline";
import bunnyMesh from "./bunnyMesh"
import { BunnyGeometry } from "./BunnyGeometry";

export class BunnySimulator extends MeshRenderer {
    protected mConfig: BunnySimulatorConfig;
    protected mBunnyGeometry: BunnyGeometry;
    protected mInteractionBox: Object3D;
    protected mBunnyComputePipeline: BunnySimulatorPipeline;
    protected mKeyState: boolean[] = [false, false, false, false];

    constructor() {
        super();
        this.mConfig = {
            NUMPARTICLES: 0,
            NUMTETS: 0,
            NUMTEDGES: 0,
            NUMTSURFACES: 0,
            GRAVITY: -10,
            DELTATIME: 1 / 60,
            NUMSUBSTEPS: 10,
            EDGECOMPLIANCE: 0.0,
            VOLCOMPLIANCE: 0.0,
            CUBECENTREX: 0.0,
            CUBECENTREY: 0.0,
            CUBECENTREZ: 0.0,
            CUBEWIDTH: 3.0,
            CUBEHEIGHT: 3.0,
            CUBEDEPTH: 3.0,
            bunnyVertex: null,
            bunnyTetIds: null,
            bunnyEdgeIds: null,
            bunnySurfaceTriIds: null,
            bunnyVertexBuffer: null,
        };
        this.mConfig.bunnyVertex = new Float32Array(bunnyMesh.verts);
        this.mConfig.bunnyTetIds = new Uint16Array(bunnyMesh.tetIds);
        this.mConfig.bunnyEdgeIds = new Uint16Array(bunnyMesh.tetEdgeIds);
        this.mConfig.bunnySurfaceTriIds = new Uint16Array(bunnyMesh.tetSurfaceTriIds);
        this.mConfig.NUMPARTICLES = this.mConfig.bunnyVertex.length / 3;
        this.mConfig.NUMTETS = this.mConfig.bunnyTetIds.length / 4;
        this.mConfig.NUMTEDGES = this.mConfig.bunnyEdgeIds.length / 2;
        this.mConfig.NUMTSURFACES = this.mConfig.bunnySurfaceTriIds.length / 3;
        this.mBunnyGeometry = new BunnyGeometry(0.0, 0.0, 0.0, this.mConfig.NUMPARTICLES);
        // this.mConfig.bunnyVertex = this.mBunnyGeometry.getAttribute(VertexAttributeName.position).data;
        // console.log(this.mConfig.NUMPARTICLES,this.mConfig.NUMTETS,this.mConfig.NUMTEDGES,this.mConfig.NUMTSURFACES)
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

    public init(){
        super.init();
        this.alwaysRender = true;
        this.geometry = this.mBunnyGeometry;
        var mat = new LitMaterial();
        mat.roughness = 0.8;
        mat.baseMap = Engine3D.res.redTexture;
        this.material = mat;
        this.material.doubleSide = true;    
    }

    public start() {
        Engine3D.inputSystem.addEventListener(KeyEvent.KEY_DOWN, (e: KeyEvent) => this.updateKeyState(e.keyCode, true), this);
        Engine3D.inputSystem.addEventListener(KeyEvent.KEY_UP, (e: KeyEvent) => this.updateKeyState(e.keyCode, false), this);
    }

    public SetInteractionBox(box: Object3D) {
        this.mInteractionBox = box;
    }

    private _tickTime = 0;

    public onCompute(view: View3D, command?: GPUCommandEncoder) {
        if (!this.mBunnyComputePipeline) {
            this.mConfig.bunnyVertexBuffer = this.mBunnyGeometry.vertexBuffer.vertexGPUBuffer;
            this.mBunnyComputePipeline = new BunnySimulatorPipeline(this.mConfig);
        }

        var pos = new Vector3();
        if (this.mInteractionBox) {
            var transform = this.mInteractionBox.transform;
            let dt = Time.delta / 1000.0;
            let speed = 5 * dt;
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
            pos.copyFrom(this.mInteractionBox.transform.worldPosition);
        }

        this._tickTime += Time.delta / 1000.0;
        if (this._tickTime >= this.mConfig.DELTATIME) {
            this._tickTime -= this.mConfig.DELTATIME;
            this.mBunnyComputePipeline.compute(command, pos);
        }
    }
}
