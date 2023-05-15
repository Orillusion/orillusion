import { ComponentBase } from "@orillusion/core";

export class TestComponents extends ComponentBase {
    public initState: boolean = false;
    public startState: boolean = false;
    public stopState: boolean = false;
    public destroyState: boolean = false;
    public enableState: boolean = false;
    public updateState: boolean = false;
    public lateUpdateState: boolean = false;
    public beforeUpdateState: boolean = false;

    public init(param?: any): void {
        this.initState = true;
    }

    public start(): void {
        this.startState = true;
    }

    public stop(): void {
        this.stopState = true;
    }

    public onEnable(): void {
        this.enableState = true;
    }

    public onDisable(): void {
        this.enableState = false;
    }

    public onUpdate(): void {
        this.updateState = true;
    }

    public onLateUpdate(): void {

    }

    public onBeforeUpdate(): void {

    }

    public destroy(force?: boolean): void {
        this.destroyState = true;
        super.destroy(force);
    }
}