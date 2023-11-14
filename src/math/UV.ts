import { Vector4 } from '..';
import { Vector2 } from './Vector2';

/***
 * @internal
 * @group Math
 */
export class UV extends Vector2 {
    public static uv_0: UV = new UV();

    public u: number = 0.0;

    public v: number = 0.0;

    constructor(x: number = 0, y: number = 0) {
        super(x, y);
        this.u = x;
        this.v = y;
    }

    public length(): number {
        return 0;
    }

    public static getUVSheet(frame: number, countX: number, countY: number) {
        let f = Math.floor(frame % (countX * countY));
        let fx = Math.floor(f / countX);
        let fy = f % countX;
        return new Vector4((fx / countX), (fy / countY), 1 / countX, 1 / countY);
    }
}

