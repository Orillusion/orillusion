import { ComponentBase } from "../../../../components/ComponentBase";
import { Color } from "../../../../math/Color";
import { Vector2 } from "../../../../math/Vector2";
import { RegisterComponent } from "../../../../util/SerializeDecoration";

@RegisterComponent
export class APatch extends ComponentBase {
    public size: Vector2;
    public blockSize: number;
    public walk: Color;
    public obs: Color;

    public colors: Color[];

    public aPaths: number[];
} 