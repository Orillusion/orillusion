import { Plane3D } from "../../../math/Plane3D";
import { QuadAABB } from "./QuadAABB";

export interface IQuadNode {

    initAABB(): void;

    isTriangle: boolean;

    aabb: QuadAABB;

    calcGlobalQuadAABB(): void;

    plane?: Plane3D;

}
