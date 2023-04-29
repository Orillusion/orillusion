import { ILight } from "./ILight";

/**
 * Collecting and storing light that affects GI
 * @internal
 * @group Lights
 */
export class GILighting {
    public static list: ILight[] = [];
    public static add(light: ILight) {
        let index = this.list.indexOf(light);
        if (index == -1) {
            this.list.push(light);
        }
    }

    public static remove(light: ILight) {
        let index = this.list.indexOf(light);
        if (index != -1) {
            this.list.splice(index, 1);
        }
    }
}
