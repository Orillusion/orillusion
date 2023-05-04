import { ComponentBase } from "../../src/components/ComponentBase";
import { Time } from "../../src/util/Time";

export class TestTransformComponent extends ComponentBase {
    start(): void {

    }

    onUpdate(): void {
        this.transform.y = Math.sin(Time.time * 0.001) * 10.0;
    }
}
