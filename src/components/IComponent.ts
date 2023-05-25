import { View3D } from "../core/View3D";
import { Object3D } from "../core/entities/Object3D";
import { CEventDispatcher } from "../event/CEventDispatcher";
import { Transform } from "./Transform";

export interface IComponent {
    object3D: Object3D;
    eventDispatcher: CEventDispatcher;
    transform: Transform;
    enable: boolean;
    init(param?: any);
    start();
    stop();
    onEnable?(view?: View3D);
    onDisable?(view?: View3D);
    onUpdate?(view?: View3D);
    onLateUpdate?(view?: View3D);
    onBeforeUpdate?(view?: View3D);
    onCompute?(view?: View3D, command?: GPUCommandEncoder);
    onGraphic?(view?: View3D);
    cloneTo(obj: Object3D);
    destroy(force?: boolean);
    onParentChange?(lastParent?: Object3D, currentParent?: Object3D);

}