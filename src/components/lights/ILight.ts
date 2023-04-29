import { Camera3D } from "../../core/Camera3D";
import { Transform } from "../Transform";
import { LightData } from "./LightData";

export interface ILight {
    name: string;
    transform: Transform;
    lightData: LightData;
    needUpdateShadow: boolean;
    realTimeShadow: boolean;

    shadowIndex: number;

    shadowCamera?: Camera3D;
}