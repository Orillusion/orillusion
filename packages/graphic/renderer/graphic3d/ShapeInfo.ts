import { Struct, Vector4 } from "@orillusion/core";

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
    public paths: Vector4[] = [];
}