import { Object3D, Vector3, Color, GetCountInstanceID } from "@orillusion/core";
import { Ammo } from '../Physics';
import { TempPhyMath } from '../utils/TempPhyMath';
import { DebugDrawMode, DebugDrawerOptions } from "./DebugDrawModeEnum";

export class PhysicsDebugDrawer {
    private debugDrawer: Ammo.DebugDrawer;
    private _enable: boolean = true;
    private frameCount: number = 0;
    /**
     * A graphic object used to draw lines
     * 
     * Type: `Graphic3D`
     */
    private graphic3D;

    // Exceeding 32,000 lines may cause engine crash.
    private lineCount: number = 0;
    private lineNameList: string[] = [];
    private readonly _tmpCor: Color = new Color();
    private readonly _tmpVecA: Vector3 = new Vector3();
    private readonly _tmpVecB: Vector3 = new Vector3();

    public world: Ammo.btDiscreteDynamicsWorld | Ammo.btSoftRigidDynamicsWorld;
    public debugMode: number;
    public updateFreq: number;
    public maxLineCount: number;

    public readonly debugModeList = {
        NoDebug: DebugDrawMode.NoDebug,
        DrawWireframe: DebugDrawMode.DrawWireframe,
        DrawAabb: DebugDrawMode.DrawAabb,
        DrawFeaturesText: DebugDrawMode.DrawFeaturesText,
        DrawContactPoints: DebugDrawMode.DrawContactPoints,
        NoDeactivation: DebugDrawMode.NoDeactivation,
        NoHelpText: DebugDrawMode.NoHelpText,
        DrawText: DebugDrawMode.DrawText,
        ProfileTimings: DebugDrawMode.ProfileTimings,
        EnableSatComparison: DebugDrawMode.EnableSatComparison,
        DisableBulletLCP: DebugDrawMode.DisableBulletLCP,
        EnableCCD: DebugDrawMode.EnableCCD,
        DrawConstraints: DebugDrawMode.DrawConstraints,
        DrawConstraintLimits: DebugDrawMode.DrawConstraintLimits,
        FastWireframe: DebugDrawMode.FastWireframe,
        DrawAabbDynamic: DebugDrawMode.DrawAabbDynamic,
        DrawSoftBodies: DebugDrawMode.DrawSoftBodies,
    };

    constructor(world: Ammo.btDiscreteDynamicsWorld | Ammo.btSoftRigidDynamicsWorld, graphic3D: Object3D, options: DebugDrawerOptions = {}) {
        if (!graphic3D) throw new Error("Physics Debug Drawer requires a Graphic3D object.");

        this.world = world;
        this.graphic3D = graphic3D;

        this._enable = options.enable || false;
        this.debugMode = options.debugDrawMode ?? DebugDrawMode.DrawWireframe;
        this.updateFreq = options.updateFreq || 1;
        this.maxLineCount = options.maxLineCount || 25000;

        this.debugDrawer = new Ammo.DebugDrawer();
        this.debugDrawer.drawLine = this.drawLine.bind(this);
        this.debugDrawer.drawContactPoint = this.drawContactPoint.bind(this);
        this.debugDrawer.reportErrorWarning = this.reportErrorWarning.bind(this);
        this.debugDrawer.draw3dText = this.draw3dText.bind(this);
        this.debugDrawer.setDebugMode = this.setDebugMode.bind(this);
        this.debugDrawer.getDebugMode = this.getDebugMode.bind(this);

        this.world.setDebugDrawer(this.debugDrawer);
    }

    /**
     * 启用/禁用物理调试绘制
     */
    public set enable(value: boolean) {
        this._enable = value;
        if (this.lineNameList.length > 0) {
            this.clearLines()
        }

        // this.world.setDebugDrawer(value ? this.debugDrawer : null);

    }

    public get enable() {
        return this._enable;
    }

    public setDebugMode(debugMode: DebugDrawMode): void {
        this.debugMode = debugMode;
    }

    public getDebugMode(): DebugDrawMode {
        return this.debugMode;
    }

    public update(): void {
        if (!this._enable) return;

        if (++this.frameCount % this.updateFreq !== 0) return;

        this.clearLines();

        this.world.debugDrawWorld();

        // console.log(this.lineCount);
        this.lineCount = 0;
    }

    private drawLine(from: Ammo.btVector3, to: Ammo.btVector3, color: Ammo.btVector3): void {
        if (!this._enable) return;

        if (++this.lineCount > this.maxLineCount) return; // console.log(`超出限制,正在渲染第 ${this.lineCount} 条线`);

        const fromVector = Ammo.wrapPointer(from as unknown as number, Ammo.btVector3);
        const toVector = Ammo.wrapPointer(to as unknown as number, Ammo.btVector3);
        const colorVector = Ammo.wrapPointer(color as unknown as number, Ammo.btVector3);

        const lineColor = this._tmpCor.copyFromVector(TempPhyMath.fromBtVec(colorVector, this._tmpVecA));
        const p0 = TempPhyMath.fromBtVec(fromVector, this._tmpVecA);
        const p1 = TempPhyMath.fromBtVec(toVector, this._tmpVecB);

        const name = `AmmoLine_${this.lineCount}`;
        this.lineNameList.push(name);
        // Engine3D.views[this.viewIndex].graphic3D.drawLines(name, [p0, p1], lineColor);
        this.graphic3D.drawLines(name, [p0, p1], lineColor);

    }

    private drawContactPoint(pointOnB: Ammo.btVector3, normalOnB: Ammo.btVector3, distance: number, lifeTime: number, color: Ammo.btVector3): void {
        if (!this._enable) return;

        if (++this.lineCount > this.maxLineCount) return; // console.log(`超出限制,正在渲染第 ${this.lineCount} 条线`);

        const colorVector = Ammo.wrapPointer(color as unknown as number, Ammo.btVector3);
        const pointOnBVector = Ammo.wrapPointer(pointOnB as unknown as number, Ammo.btVector3);
        const normalOnBVector = Ammo.wrapPointer(normalOnB as unknown as number, Ammo.btVector3);

        const lineColor = this._tmpCor.copyFromVector(TempPhyMath.fromBtVec(colorVector, this._tmpVecA));
        const p0 = TempPhyMath.fromBtVec(pointOnBVector, this._tmpVecA);
        const normal = TempPhyMath.fromBtVec(normalOnBVector, this._tmpVecB);
        const p1 = p0.add(normal.multiplyScalar(distance), this._tmpVecB);

        const name = `AmmoContactPoint_${GetCountInstanceID()}`;
        this.lineNameList.push(name);

        // Engine3D.views[this.viewIndex].graphic3D.drawLines(name, [p0, p1], lineColor);
        this.graphic3D.drawLines(name, [p0, p1], lineColor);

        // 在接触点生命周期结束后进行清理
        // setTimeout(() => {
        //     Engine3D.views[this.viewIndex].graphic3D.Clear(name)
        // }, lifeTime * 1000);
    }

    private reportErrorWarning(warningString: string): void {
        const warning = Ammo.UTF8ToString(warningString as unknown as number);
        console.error(warning);
    }

    private draw3dText(location: Ammo.btVector3, textString: string): void {
        const _location = Ammo.wrapPointer(location as unknown as number, Ammo.btVector3);
        const _textString = Ammo.UTF8ToString(textString as unknown as number);
        console.log("draw3dText", _location, _textString);
    }

    private clearLines(): void {
        // let view = Engine3D.views[this.viewIndex];
        // this.lineNameList.forEach(name => view.graphic3D.Clear(name));
        this.lineNameList.forEach(name => this.graphic3D.Clear(name));
        this.lineNameList.length = 0;
    }
}
