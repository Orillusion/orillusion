import { Vector2 } from "@orillusion/core";
import { Path2D } from "./Path2D";


export class Shape2D extends Path2D {
    public holes: Path2D[] = [];

    constructor(points?: Vector2[]) {
        super(points);
    }

    public extractPoints(divisions: number): { shape: Vector2[], holes: Vector2[][] } {
        return {
            shape: this.getPoints(divisions),
            holes: this.getPointsHoles(divisions)
        };
    }

    public getPointsHoles(divisions: number): Vector2[][] {
        const holesPts: Vector2[][] = [];
        for (let i = 0, l = this.holes.length; i < l; i++) {
            holesPts[i] = this.holes[i].getPoints(divisions);
        }
        return holesPts;
    }
}
