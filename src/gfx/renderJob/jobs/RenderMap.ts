import { Camera3D } from "../../../core/Camera3D";
import { Scene3D } from "../../../core/Scene3D";
import { RendererBase } from "../passRenderer/RendererBase";
import { PassType } from "../passRenderer/state/RendererType";

export class RendererMap {

    private map: Map<PassType, RendererBase>;
    private passRendererList: RendererBase[];

    constructor() {
        this.map = new Map<PassType, RendererBase>();
        this.passRendererList = [];
    }

    public addRenderer(renderer: RendererBase) {
        if (!this.map.has(renderer.passType)) {
            this.map.set(renderer.passType, renderer);
            if (renderer.passType <= (1 << 3)) {
                this.addPassRenderer(renderer);
            }
        } else {
            console.error("same renderer pass repeat!");
        }
    }

    public getRenderer(passType: PassType): RendererBase {
        return this.map.get(passType);
    }

    private addPassRenderer(renderer: RendererBase) {
        this.passRendererList.push(renderer);
    }

    public getAllRenderer(): Map<PassType, RendererBase> {
        return this.map;
    }

    public getAllPassRenderer(): RendererBase[] {
        return this.passRendererList;
    }
}