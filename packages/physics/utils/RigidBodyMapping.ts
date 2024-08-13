import { Object3D, BiMap } from '@orillusion/core';
import { Ammo } from "../Physics";

/**
 * A bidirectional mapping between RigidBody objects and 3D objects.
 */
export class RigidBodyMapping {
    private static mapping: BiMap<Object3D, Ammo.btRigidBody> = new BiMap();

    /**
     * Retrieves the entire mapping of all RigidBody objects.
     * @returns A map of RigidBody objects to 3D objects.
     */
    public static get getAllPhysicsObjectMap(): Map<Ammo.btRigidBody, Object3D> {
        return this.mapping["negtive"];
    }

    /**
     * Retrieves the entire mapping of all 3D objects.
     * @returns A map of 3D objects to RigidBody objects.
     */
    public static get getAllGraphicObjectMap(): Map<Object3D, Ammo.btRigidBody> {
        return this.mapping;
    }

    /**
     * Adds a mapping between a 3D object and a RigidBody object.
     * @param object3D The 3D object.
     * @param physics The RigidBody object.
     */
    public static addMapping(object3D: Object3D, physics: Ammo.btRigidBody) {
        this.mapping.set(object3D, physics);
    }

    /**
     * Retrieves the RigidBody object associated with a given 3D object.
     * @param object3D The 3D object.
     * @returns The associated RigidBody object, or undefined if not found.
     */
    public static getPhysicsObject(object3D: Object3D): Ammo.btRigidBody | undefined {
        return this.mapping.get(object3D);
    }

    /**
     * Retrieves the 3D object associated with a given RigidBody object.
     * @param physics The RigidBody object.
     * @returns The associated 3D object, or undefined if not found.
     */
    public static getGraphicObject(physics: Ammo.btRigidBody): Object3D | undefined {
        return this.mapping.getKey(physics);
    }

    /**
     * Removes the mapping associated with a given 3D object.
     * @param object3D The 3D object.
     */
    public static removeMappingByGraphic(object3D: Object3D) {
        this.mapping.delete(object3D);
    }

    /**
     * Removes the mapping associated with a given RigidBody object.
     * @param physics The RigidBody object.
     */
    public static removeMappingByPhysics(physics: Ammo.btRigidBody) {
        this.mapping.deleteValue(physics);
    }
}
