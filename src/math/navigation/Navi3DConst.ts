export class Navi3DConst {
    public static SetConst(epsilon: number) {
        this.EPSILON = epsilon;
        this.POWER_EPSILON = epsilon * epsilon;
    }

    public static EPSILON: number = 0.1;

    public static POWER_EPSILON: number = this.EPSILON * this.EPSILON;
}