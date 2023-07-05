import { Vector3 } from "@orillusion/core";

export class Float64MaterialTool {
    constructor(){

    }
    /**
     * 拆分一个64位的数值
     * @param value 64位number
     * @returns 返回两个32位的数值 { high:高位, low:低位 }
     */
    public static SplitDouble(value: number): {high:number, low:number}{
        let high = Float32Array.from([value])[0];
        let low = value - high;
        return {high, low};
    }
    /**
     * 拆分一个64位的Vector3
     * @param value Vector3
     * @returns 返回两个32位的Vector3 { highVector3:高位, lowVector3:低位 }
     */
    public static SplitVector3(value: Vector3): {highVector3:Vector3,lowVector3:Vector3} {
        let _xHL = Float64MaterialTool.SplitDouble(value.x);
        let _yHL = Float64MaterialTool.SplitDouble(value.y);
        let _zHL = Float64MaterialTool.SplitDouble(value.z);
        let highVector3 = new Vector3(_xHL[0], _yHL[0], _zHL[0]);
        let lowVector3 = new Vector3(_xHL[1], _yHL[1], _zHL[1]);
        return  {highVector3,lowVector3}
    }
}