import { ComponentBase, Time } from "@orillusion/core";

export class TestTransformComponent extends ComponentBase {
    start(): void {
    }

    onUpdate(): void {
        this.transform.y = Math.sin(Time.time * 0.001) * 10.0;
    }
}
