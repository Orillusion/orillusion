import { CEventDispatcher } from "../../../event/CEventDispatcher";
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
    object3D?: CEventDispatcher;

    get interactiveVisible(): boolean;

    rayPick(ray: Ray, screenPos: Vector2, screenSize: Vector2);

    destroy(): void;

    set mouseStyle(value: UIInteractiveStyle);
}