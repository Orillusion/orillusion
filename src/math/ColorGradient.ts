import { Color } from "./Color";

export class ColorGradient {
    private colorArray: Color[];

    public constructor(array: Color[]) {
        this.colorArray = array;
    }

    public getColor(p: number) {
        let s = p * this.colorArray.length;
        let i = Math.floor(s);
        let k = Math.min(i + 1, this.colorArray.length - 1);

        let c1 = this.colorArray[i];
        let c2 = this.colorArray[k];

        return Color.lerp(s - i, c1, c2);
    }

}