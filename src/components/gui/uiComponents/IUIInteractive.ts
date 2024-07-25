import { Object3D } from "../../../core/entities/Object3D";
import { Ray } from "../../../math/Ray";
import { Vector2 } from "../../../math/Vector2";

export enum UIInteractiveStyle {
    NORMAL,
    DOWN,
    OVER,
    DISABLE
}

export interface IUIInteractive {
    interactive: boolean;
    enable: boolean;
    visible: boolean;
    object3D?: Object3D;

    get interactiveVisible(): boolean;

    rayPick(ray: Ray, panel: any, screenPos: Vector2, screenSize: Vector2);

    destroy(): void;

    set mouseStyle(value: UIInteractiveStyle);
}