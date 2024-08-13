/**
 * Collision flags
 */
export enum CollisionFlags {
    /**
     * Default flag for dynamic rigid bodies.
     */
    DEFAULT = 0,
    /**
     * Used for static objects. These objects do not move but can be collided with by other objects.
     */
    STATIC_OBJECT = 1,
    /**
     * Used for kinematic objects. These objects are not affected by physical forces (like gravity or collisions) but can be moved programmatically and affect dynamic objects they collide with.
     */
    KINEMATIC_OBJECT = 2,
    /**
     * Objects with this flag do not participate in collision response but still trigger collision events.
     */
    NO_CONTACT_RESPONSE = 4,
    /**
     * This flag indicates that the object will use a custom material interaction callback.
     */
    CUSTOM_MATERIAL_CALLBACK = 8,
    /**
     * Special flag for collision objects used by character controllers. This is typically used to optimize character collision handling in games.
     */
    CHARACTER_OBJECT = 16,
    /**
     * Prevents this object from being displayed in the physical debug view.
     */
    DISABLE_VISUALIZE_OBJECT = 32,
    /**
     * Prevents this object’s collision from being processed on the auxiliary processing unit, optimizing performance on specific hardware platforms.
     */
    DISABLE_SPU_COLLISION_PROCESSING = 64,
    /**
     * Enables custom contact stiffness and damping settings for this object. This allows adjusting the physical response's stiffness and damping when handling collisions, used to simulate more complex physical interactions.
     */
    HAS_CONTACT_STIFFNESS_DAMPING = 128,
    /**
     * Allows specifying a custom rendering color for this object in the physical debug view. This helps differentiate and identify specific physical objects during debugging.
     */
    HAS_CUSTOM_DEBUG_RENDERING_COLOR = 256,
    /**
     * Enables friction anchors for this object. Friction anchors improve the friction effect on contact surfaces, typically used for vehicle tires to enhance grip on the ground and reduce sliding.
     */
    HAS_FRICTION_ANCHOR = 512,
    /**
     * Triggers sound effects when this object collides. This flag can be used to configure sound feedback for specific collisions, enhancing the realism and immersion of the game or simulation environment.
     */
    HAS_COLLISION_SOUND_TRIGGER = 1024,
}

/**
 * Activation states
 */
export enum ActivationState {
    /**
     * The object is active and will be processed by the simulation.
     */
    ACTIVE_TAG = 1,
    /**
     * The object is inactive but may be activated if other active objects collide with it.
     */
    ISLAND_SLEEPING = 2,
    /**
     * The object is requesting to be deactivated in the next simulation step. If there is no further interaction, the object will enter a sleeping state.
     */
    WANTS_DEACTIVATION = 3,
    /**
     * Disables automatic sleeping. The object will continue to be simulated even if it is stationary.
     */
    DISABLE_DEACTIVATION = 4,
    /**
     * The object will not be simulated by the physics engine, whether dynamic or colliding, but can be moved or manipulated programmatically.
     */
    DISABLE_SIMULATION = 5,
}
