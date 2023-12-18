import { Vector4 } from "../../../../../math/Vector4";
import { NonSerialize } from "../../../../../util/SerializeDecoration";
import { Struct } from "../../../../../util/struct/Struct";

export class ShapeInfo extends Struct {
    public shapeIndex: number = 0; //face,poly,line,cycle,rectangle,box,sphere
    public shapeType: number = 0;
    public width: number = 0;
    public lineCap: number = 0;
    public pathCount: number = 0;
    public uScale: number = 0;
    public vScale: number = 0;
    public lineJoin: number = 0;

    public startPath: number = 0;
    public endPath: number = 0;
    public uSpeed: number = 0;
    public vSpeed: number = 0;

    @NonSerialize
    public paths: Vector4[] = [];
}