import { CollectInfo, RenderNode } from "../../..";
import { Ray } from "../../../math/Ray";
import { Vector3 } from "../../../math/Vector3";
import { BoundingBox } from "../../bound/BoundingBox";
import { Frustum } from "../../bound/Frustum";
import { OctreeEntity } from "./OctreeEntity";

export class Octree {
  private static _v1 = new Vector3();
  private static _v2 = new Vector3();
  // private static _plane = new Plane();
  // private static _line1 = new Line3();
  // private static _line2 = new Line3();
  // private static _sphere = new Sphere();
  // private static _capsule = new Capsule();
  public readonly entities: Map<string, OctreeEntity>;
  public readonly box: BoundingBox;
  public readonly subTrees: Octree[] = [];
  public readonly parent: Octree;
  public readonly level: number;
  public static readonly maxSplitLevel = 6;
  private static readonly autoSplitLevel = 3;
  public readonly index: number;
  public readonly uuid: string;

  constructor(size: BoundingBox, index: number = 0, parent: Octree = null, level: number = 0) {
    this.parent = parent;
    this.box = size.clone() as BoundingBox;
    this.level = level;
    this.index = index;
    this.uuid = level + '_' + index;
    this.entities = new Map<string, OctreeEntity>();
  }

  public tryInsertEntity(entity: OctreeEntity): boolean {
    let userBox = entity.renderer.object3D.bound as any;
    if (this.level == 0 || this.box.containsBox(userBox)) {
      if (this.subTrees.length == 0) {
        if (this.level < Octree.maxSplitLevel) {
          this.splitTree();
        }
      }

      let holdByChild: boolean;
      if (this.subTrees.length > 0) {
        for (let child of this.subTrees) {
          if (child.tryInsertEntity(entity)) {
            holdByChild = true;
            break;
          }
        }
      }
      if (!holdByChild) {
        entity.enterNode(this);
      }

      return true;
    }
    return false;
  }


  private splitTree() {
    if (this.subTrees.length == 0) {
      const v = Octree._v1;
      const halfsize = this.box.extents.clone();
      let childLevel: number = this.level + 1;
      let index = 0;
      for (let x = 0; x < 2; x++) {
        for (let y = 0; y < 2; y++) {
          for (let z = 0; z < 2; z++) {
            const box = new BoundingBox();
            this.box.min.add(v.set(x, y, z).multiply(halfsize), box.min);
            box.min.add(halfsize, box.max);
            box.setFromMinMax(box.min, box.max);
            let subTree = new Octree(box, index++, this, childLevel);
            this.subTrees.push(subTree);
          }
        }
      }
    }
  }

  __rayCastTempVector: Vector3 = new Vector3();
  rayCasts(ray: Ray, ret: OctreeEntity[]): boolean {
    if (this.level == 0 || ray.intersectBox(this.box, this.__rayCastTempVector)) {
      if (this.entities.size > 0) {
        ret.push(...this.entities.values());
      }
      for (let child of this.subTrees) {
        child.rayCasts(ray, ret);
      }
      return true;
    }
    return false;
  }

  frustumCasts(frustum: Frustum, ret: OctreeEntity[]) {
    if (this.level == 0 || frustum.containsBox2(this.box) > 0) {
      if (this.entities.size > 0) {
        for (const item of this.entities.values()) {
          if (this.level > Octree.autoSplitLevel || frustum.containsBox2(item.renderer.object3D.bound) > 0) {
            ret.push(item);
          }
        }
      }
      for (let child of this.subTrees) {
        child.frustumCasts(frustum, ret);
      }
      return true;
    }
    return false;
  }

  getRenderNode(frustum: Frustum, ret: CollectInfo) {
    if (this.level == 0 || frustum.containsBox2(this.box) > 0) {
      if (this.entities.size > 0) {
        // let cacheMinSize: Vector3 = new Vector3();
        // let cacheMaxSize: Vector3 = new Vector3();
        for (const item of this.entities.values()) {
          if (this.level > Octree.autoSplitLevel || frustum.containsBox2(item.renderer.object3D.bound) > 0) {
            // ret.push(item.renderer);
            if (item.renderer.renderOrder < 3000) {
              // if (item.renderer.object3D.bound.min.equals(cacheMinSize) && item.renderer.object3D.bound.max.equals(cacheMaxSize)) {
              //   // console.log("bound same");
              //   continue;
              // } else {
              //   cacheMinSize.copy(item.renderer.object3D.bound.min);
              //   cacheMaxSize.copy(item.renderer.object3D.bound.max);
              //   ret.opaqueList.push(item.renderer);
              // }
              ret.opaqueList.push(item.renderer);
            } else if (item.renderer.renderOrder >= 3000) {
              ret.transparentList.push(item.renderer);
            }
          }
        }
      }
      for (let child of this.subTrees) {
        child.getRenderNode(frustum, ret);
      }
      return true;
    }
    return false;
  }

  boxCasts(box: BoundingBox, ret: OctreeEntity[]) {
    if (box.intersectsBox(this.box)) {
      if (this.entities.size > 0) {
        ret.push(...this.entities.values());
      }
      for (let child of this.subTrees) {
        child.boxCasts(box, ret);
      }
      return true;
    }
    return false;
  }

  clean(): this {
    for (let item of this.entities.values()) {
      item.leaveNode();
    }
    this.entities.clear();
    return this;
  }

  // getRayTriangles(ray, triangles) {
  //   for (let subTree of this.subTrees) {
  //     if (!ray.intersectsBox(subTree.box)) {
  //       continue;
  //     }
  //     subTree.setGizmos(true, false);

  //     let count = subTree.entities.length;
  //     if (count > 0) {
  //       let tempTriangle: OctreeEntity;
  //       for (let j = 0; j < count; j++) {
  //         tempTriangle = subTree.entities[j];
  //         if (triangles.indexOf(tempTriangle) == -1) {
  //           triangles.push(tempTriangle);
  //         }
  //       }
  //     }
  //     // else {
  //     subTree.getRayTriangles(ray, triangles);
  //     // }
  //   }

  //   return triangles;
  // }

  // triangleCapsuleIntersect(capsule, triangle) {
  //   triangle.getPlane(Octree._plane);
  //   const d1 = Octree._plane.distanceToPoint(capsule.start) - capsule.radius;
  //   const d2 = Octree._plane.distanceToPoint(capsule.end) - capsule.radius;

  //   if ((d1 > 0 && d2 > 0) || (d1 < -capsule.radius && d2 < -capsule.radius)) {
  //     return false;
  //   }

  //   const delta = Math.abs(d1 / (Math.abs(d1) + Math.abs(d2)));

  //   const intersectPoint = Octree._v1.copy(capsule.start).lerp(capsule.end, delta);

  //   if (triangle.containsPoint(intersectPoint)) {
  //     return {
  //       normal: Octree._plane.normal.clone(),
  //       point: intersectPoint.clone(),
  //       depth: Math.abs(Math.min(d1, d2)),
  //     };
  //   }

  //   const r2 = capsule.radius * capsule.radius;

  //   const line1 = Octree._line1.set(capsule.start, capsule.end);

  //   const lines = [
  //     [triangle.a, triangle.b],
  //     [triangle.b, triangle.c],
  //     [triangle.c, triangle.a],
  //   ];

  //   for (let i = 0; i < lines.length; i++) {
  //     const line2 = Octree._line2.set(lines[i][0], lines[i][1]);

  //     const [point1, point2] = capsule.lineLineMinimumPoints(line1, line2);

  //     if (point1.distanceToSquared(point2) < r2) {
  //       return {
  //         normal: point1.clone().sub(point2).normalize(),
  //         point: point2.clone(),
  //         depth: capsule.radius - point1.distanceTo(point2),
  //       };
  //     }
  //   }

  //   return false;
  // }

  // triangleSphereIntersect(sphere, triangle) {
  //   triangle.getPlane(Octree._plane);
  //   if (!sphere.intersectsPlane(Octree._plane)) return false;
  //   const depth = Math.abs(Octree._plane.distanceToSphere(sphere));
  //   const r2 = sphere.radius * sphere.radius - depth * depth;

  //   const plainPoint = Octree._plane.projectPoint(sphere.center, Octree._v1);

  //   if (triangle.containsPoint(sphere.center)) {
  //     return {
  //       normal: Octree._plane.normal.clone(),
  //       point: plainPoint.clone(),
  //       depth: Math.abs(Octree._plane.distanceToSphere(sphere)),
  //     };
  //   }

  //   const lines = [
  //     [triangle.a, triangle.b],
  //     [triangle.b, triangle.c],
  //     [triangle.c, triangle.a],
  //   ];

  //   for (let i = 0; i < lines.length; i++) {
  //     Octree._line1.set(lines[i][0], lines[i][1]);

  //     Octree._line1.closestPointToPoint(plainPoint, true, Octree._v2);

  //     const d = Octree._v2.distanceToSquared(sphere.center);

  //     if (d < r2) {
  //       return {
  //         normal: sphere.center.clone().sub(Octree._v2).normalize(),
  //         point: Octree._v2.clone(),
  //         depth: sphere.radius - Math.sqrt(d),
  //       };
  //     }
  //   }

  //   return false;
  // }

  // getSphereTriangles(sphere, triangles) {
  //   for (let subTree of this.subTrees) {
  //     if (!sphere.intersectsBox(subTree.box)) continue;

  //     if (subTree.entities.length > 0) {
  //       for (let j = 0; j < subTree.entities.length; j++) {
  //         if (triangles.indexOf(subTree.entities[j]) === -1) triangles.push(subTree.entities[j]);
  //       }
  //     } else {
  //       subTree.getSphereTriangles(sphere, triangles);
  //     }
  //   }
  // }

  // getCapsuleTriangles(capsule, triangles) {
  //   for (let subTree of this.subTrees) {
  //     if (!capsule.intersectsBox(subTree.box)) continue;

  //     if (subTree.entities.length > 0) {
  //       for (let j = 0; j < subTree.entities.length; j++) {
  //         if (triangles.indexOf(subTree.entities[j]) === -1) triangles.push(subTree.entities[j]);
  //       }
  //     } else {
  //       subTree.getCapsuleTriangles(capsule, triangles);
  //     }
  //   }
  // }

  // sphereIntersect(sphere) {
  //   Octree._sphere.copy(sphere);

  //   const triangles = [];
  //   let result,
  //     hit = false;
  //   this.getSphereTriangles(sphere, triangles);

  //   for (let i = 0; i < triangles.length; i++) {
  //     if ((result = this.triangleSphereIntersect(Octree._sphere, triangles[i]))) {
  //       hit = true;

  //       Octree._sphere.center.add(result.normal.multiplyScalar(result.depth));
  //     }
  //   }

  //   if (hit) {
  //     const collisionVector = Octree._sphere.center.clone().sub(sphere.center);

  //     const depth = collisionVector.length();
  //     return {
  //       normal: collisionVector.normalize(),
  //       depth: depth,
  //     };
  //   }

  //   return false;
  // }

  // capsuleIntersect(capsule) {
  //   Octree._capsule.copy(capsule);

  //   const triangles = [];
  //   let result,
  //     hit = false;
  //   this.getCapsuleTriangles(Octree._capsule, triangles);

  //   for (let i = 0; i < triangles.length; i++) {
  //     if ((result = this.triangleCapsuleIntersect(Octree._capsule, triangles[i]))) {
  //       hit = true;

  //       Octree._capsule.translate(result.normal.multiplyScalar(result.depth));
  //     }
  //   }

  //   if (hit) {
  //     let collisionVector: Vector3;
  //     let getCenter = Octree._capsule['getCenter'] as any;
  //     collisionVector = getCenter(new Vector3()).sub(capsule.getCenter(Octree._v1));

  //     const depth = collisionVector.length();
  //     return {
  //       normal: collisionVector.normalize(),
  //       depth: depth,
  //     };
  //   }

  //   return false;
  // }

  // rayIntersect(ray) {
  //   if (ray.direction.length() === 0) return;
  //   const triangles = [];
  //   let triangle,
  //     position,
  //     distance = 1e100;
  //   this.getRayTriangles(ray, triangles);

  //   for (let i = 0; i < triangles.length; i++) {
  //     const result = ray.intersectTriangle(triangles[i].a, triangles[i].b, triangles[i].c, true, Octree._v1);

  //     if (result) {
  //       const newdistance = result.sub(ray.origin).length();

  //       if (distance > newdistance) {
  //         position = result.clone().add(ray.origin);
  //         distance = newdistance;
  //         triangle = triangles[i];
  //       }
  //     }
  //   }

  //   return distance < 1e100
  //     ? {
  //       distance: distance,
  //       triangle: triangle,
  //       position: position,
  //     }
  //     : false;
  // }
}
