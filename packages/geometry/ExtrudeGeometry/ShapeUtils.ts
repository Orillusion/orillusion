import { Vector2, Vector3 } from "@orillusion/core";
import { Earcut } from "@orillusion/graphic";

export class ShapeUtils {
    public static isClockWise(points: Vector2[]): boolean {
        return ShapeUtils.area(points) < 0;
    }

    public static area(contour: Vector2[]) {
        let a: number = 0.0;
        const n = contour.length;
        for (let p = n - 1, q = 0; q < n; p = q++) {
            a += contour[p].x * contour[q].y - contour[q].x * contour[p].y;
        }
        return a * 0.5;
    }

    public static triangulateShape(contour: Vector2[], holes: Vector2[][]) {
        const faces: number[][] = [];
        const vertices: number[] = [];
        const holeIndices: number[] = [];

        removeDupEndPoints(contour);
        addContour(vertices, contour);

        let holeIndex = contour.length;
        holes.forEach(removeDupEndPoints);

        for (let i = 0; i < holes.length; i++) {
            holeIndices.push(holeIndex);
            holeIndex += holes[i].length;
            addContour(vertices, holes[i]);
        }

        const triangles = Earcut.triangulate(vertices, holeIndices);

        for (let i = 0; i < triangles.length; i += 3) {
            faces.push(triangles.slice(i, i + 3));
        }

        return faces;
    }
}

function removeDupEndPoints(points: Vector2[]) {
    const l = points.length;
    if (l > 2 && points[l - 1].equals(points[0])) {
        points.pop();
    }
}

function addContour(vertices: number[], contour: Vector2[]) {
    for (let i = 0; i < contour.length; i++) {
        vertices.push(contour[i].x);
        vertices.push(contour[i].y);
    }
}
