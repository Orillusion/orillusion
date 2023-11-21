import { Vector3, View3D } from "../../../..";
import { ComponentBase } from "../../../../components/ComponentBase";
import { Color } from "../../../../math/Color";
import { Vector2 } from "../../../../math/Vector2";
import { RegisterComponent } from "../../../../util/SerializeDecoration";

@RegisterComponent(APatch, 'APatch')
export class APatch extends ComponentBase {
    public size: Vector2;
    public blockSize: number;
    public walk: Color;
    public obs: Color;

    public colors: Color[];

    public aPaths: number[];

    public onGraphic(view?: View3D) {
        return;
        
        // for (let i = this.size.x ; i > 0 ; i--) {
            for (let i = 0; i < this.size.x; i++) {
            for (let j = 0; j < this.size.y; j++) {
                let index = j * this.size.x + (i); 
                let data = this.aPaths[index];
                let color = this.colors[data] ;

                let pos = new Vector3(-i * this.blockSize + this.object3D.x , 0 + this.object3D.y , j * this.blockSize+ this.object3D.z);
                view.graphic3D.drawFillRect(`${i}-${j}` , pos , this.blockSize , this.blockSize, color );
            }
        }
      
    }
} 