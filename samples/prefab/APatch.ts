import { Color, ComponentBase, RegisterComponent, Vector2 } from "../../src";

@RegisterComponent
export class APatch extends ComponentBase {
    public size: Vector2;
    public blockSize: number;
    public walk: Color;
    public obs: Color;

    public colors: Color[];

    public aPaths: number[];
}