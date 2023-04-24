import { LightBase } from './LightBase';

/**
 * Collecting and storing light that affects GI
 * @internal
 * @group Lights
 */
export class GILighting {
    public static list: LightBase[] = [];
    public static add(light: LightBase) {
        let index = this.list.indexOf(light);
        if (index == -1) {
            this.list.push(light);
        }
    }

    public static remove(light: LightBase) {
        let index = this.list.indexOf(light);
        if (index != -1) {
            this.list.splice(index, 1);
        }
    }
}
