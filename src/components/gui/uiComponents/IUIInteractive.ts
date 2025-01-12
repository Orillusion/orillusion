import { Object3D } from "../../../core/entities/Object3D";
import { Ray } from "../../../math/Ray";
import { Vector2 } from "../../../math/Vector2";
import { Vector3 } from "../../../math/Vector3";

export enum UIInteractiveStyle {
    NORMAL,
    DOWN,
    OVER,
    DISABLE
}

export type GUIHitInfo = { intersectPoint?: Vector3; distance: number; collider?: IUIInteractive };

export interface IUIInteractive {
    interactive: boolean;
    enable: boolean;
    visible: boolean;
    object3D?: Object3D;
    get interactiveVisible(): boolean;
    rayPick(ray: Ray, panel: any, screenPos: Vector2, screenSize: Vector2) : GUIHitInfo;
    destroy(): void;
    set mouseStyle(value: UIInteractiveStyle);
}