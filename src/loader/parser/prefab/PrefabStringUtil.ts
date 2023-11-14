import { Quaternion } from "../../..";

export class PrefabStringUtil {

    public static getNumber(st: string) {
        let v = parseFloat(st);
        return v;
    }

    public static getInt(st: string) {
        let v = parseInt(st);
        return v;
    }

    public static getBoolean(st: string) {
        let v = st == "true" ? true : false;
        return v;
    }

    public static getNumberArray(st: string) {
        let v = st.replaceAll("[", "");
        v = v.replaceAll("]", "");
        let list = v.split(",");
        let ret: number[] = [];
        for (let i = 0; i < list.length; i++) {
            const element = parseFloat(list[i]);
            ret.push(element);
        }
        return v;
    }

    public static getStringArray(st: string) {
        let v = st.replaceAll("[", "");
        v = v.replaceAll("]", "");
        let list = v.split(",");
        let ret: string[] = [];
        for (let i = 0; i < list.length; i++) {
            const element = (list[i]);
            ret.push(element);
        }
        return ret;
    }

    public static getVector2(st: string) {

    }

    public static getVector3(st: string) {

    }

    public static getVector4(st: string) {

    }

    public static getQuaternion(st: string) {

    }

    public static getColor(st: string) {

    }
}