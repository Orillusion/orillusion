/**
 * The EventListener class is used to add or remove event listeners.
 * @internal
 * @group Events
 */
export class CEventListener {
    /**
     * @private
     */
    public static event_id_count = 0;

    /**
     *
     * Record a id. When registering a listening event, the value will increase automatically
     */
    public id: number = 0;

    /**
     *
     * Returns current event dispatcher
     */
    public current: any;

    /**
     *
     * @param type {string} event type
     * @param thisObject {any} the object is registerd
     * @param handler {Function} The callback function that handles events. 
     * @param param {any} Parameters bound when registering events
     * @param priority {number} The priority of callback function execution, with a larger set value having priority to call
     */
    constructor(public type: string | number = null, public thisObject: any = null, public handler: Function = null, public param: any = null, public priority: number = 0) { }

    /**
     *
     * Compare whether two events are the same
     * @param type {string} event type
     * @param handler {Function} The callback function that handles events. 
     * @param thisObject {any} the object is registerd
     * @param param {any} Parameters bound when registering events
     * @returns {boolean} Returns a boolean
     */
    public equalCurrentListener(type: string | number, handler: Function, thisObject: any, param: any): boolean {
        if (this.type == type && this.thisObject == thisObject && this.handler == handler && this.param == param) {
            return true;
        }
        return false;
    }

    /**
     *
     * release all registered event.
     */

    public dispose() {
        this.handler = null;
        this.thisObject = null;
        this.param = null;
        this.priority = 0;
    }
}
