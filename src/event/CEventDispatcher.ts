import { CEvent } from './CEvent';
import { CEventListener } from './CEventListener';

/**
 * Basic class of event diapatcher.
 * It includes the implementation of functions such as event registration, 
 * deregistration, distribution, and unregister.
 * @group Events
 */
export class CEventDispatcher {
    /**
     * @internal
     */
    protected listeners: any = {};
    /**
     * @internal
     */
    public data: any;
    /**
     *
     * Dispatch an event to all registered objects with a specific type of listener.
     * @param event3D the event is dispatched.
     */
    public dispatchEvent(event: CEvent) {
        var list: any = this.listeners[event.type];
        if (list != null) {
            list = list.slice();
            for (var i: number = 0; i < list.length; i++) {
                var listener: CEventListener = list[i];
                if (listener.handler) {
                    try {
                        event.param = listener.param;
                        event.currentTarget = listener;
                        if (!listener.thisObject) {
                            // log("nullListener thisObject");
                        }
                        listener.handler.call(listener.thisObject, event);
                    } catch (error) {
                        // if (window.//console) {
                        //console.error(error.stack);
                        // }
                    }
                    if (event.isStopImmediatePropagation) {
                        break;
                    }
                }
            }
        }
    }

    /**
     *
     * release all registered event.
     */
    public dispose() {
        for (var key in this.listeners) {
            var list: any = this.listeners[key];
            while (list.length > 0) {
                var listener: CEventListener = list[0];
                listener.handler = null;
                listener.thisObject = null;
                list.splice(0, 1);
            }
        }
    }

    /**
     *
     * register an event listener to event distancher.
     * @param type {string} event type.
     * @param callback {Function} The callback function that handles events. 
     * This function must accept an Event3D object as its unique parameter and cannot return any result.
     * for example: function(evt:Event3D):void.
     * @param thisObject {any} Current registration object, it'll call callback function.
     * @param param {any} the data binded to registered event, the default value is null.
     * @param priority {number} The priority of callback function execution, with a larger set value having priority to call
     * @returns {number} Returns register event id
     */
    public addEventListener(type: string | number, callback: Function, thisObject: any, param: any = null, priority: number = 0): number {
        if (this.listeners[type] == null) {
            this.listeners[type] = [];
        }

        if (!this.hasEventListener(type, callback, thisObject)) {
            var listener: CEventListener = new CEventListener(type, thisObject, callback, param, priority);
            listener.id = ++CEventListener.event_id_count;
            listener.current = this;
            this.listeners[type].push(listener);
            this.listeners[type].sort(function (listener1: CEventListener, listener2: CEventListener) {
                return listener2.priority - listener1.priority;
            });

            return listener.id;
        }

        for (let i = 0; i < this.listeners[type].length; i++) {
            let listener: CEventListener = this.listeners[type][i];
            if (listener.equalCurrentListener(type, callback, thisObject, param)) {
                return listener.id;
            }
        }

        return 0;
    }

    /**
     *
     * Remove Event Listening
     * @param type {string} event type
     * @param callback {Function} callback function of event register
     * @param thisObject {any} The current registered object.
     */
    public removeEventListener(type: string | number, callback: Function, thisObject: any): void {
        if (this.hasEventListener(type, callback, thisObject)) {
            for (var i: number = 0; i < this.listeners[type].length; i++) {
                var listener: CEventListener = this.listeners[type][i];
                if (listener.equalCurrentListener(type, callback, thisObject, listener.param)) {
                    listener.handler = null;
                    listener.thisObject = null;
                    this.listeners[type].splice(i, 1);
                    return;
                }
            }
        }
    }

    /**
     *
     * Remove an event Listening with id
     * @param register event id, see {@link addEventListener}
     * Returns true when removed success.
     */
    public removeEventListenerAt(id: number): boolean {
        for (var key in this.listeners) {
            for (var i: number = 0; i < this.listeners[key].length; i++) {
                var listener = this.listeners[key][i];
                if (listener.id == id) {
                    listener.handler = null;
                    listener.thisObject = null;
                    this.listeners[key].splice(i, 1);
                    return true;
                }
            }
        }
        return false;
    }

    /**
     *
     * Specify a event type to remove all related event listeners
     * eventType event type, set null to remove all event listeners
     */
    public removeAllEventListener(eventType: string | number = null): void {
        let listener: CEventListener;

        if (eventType) {
            if (this.listeners[eventType]) {
                for (var i: number = 0; i < this.listeners[eventType].length; i++) {
                    listener = this.listeners[eventType][i];
                    listener.dispose();
                    this.listeners[eventType].splice(i, 1);
                }

                delete this.listeners[eventType];
            }
        } else {
            for (let key in this.listeners) {
                for (var i: number = 0; i < this.listeners[key].length; i++) {
                    listener = this.listeners[key][i];
                    listener.dispose();
                    this.listeners[key].splice(i, 1);
                }

                delete this.listeners[key];
            }
        }
    }

    /**
     *
     * whether the target presence of a listener with event type.
     * @param type {string} event type.
     * @returns {boolean} Returns a boolean.
     */
    public containEventListener(type: string): boolean {
        if (this.listeners[type] == null) return false;
        return this.listeners[type].length > 0;
    }

    /**
     *
     * whether the target presence of a listener with event type. it associate more registration parameters.
     * @param type {string} event name.
     * @param callback {Function} callback function of event register.
     * @param thisObject {any} The registered object.
     * @returns {boolean} Returns a boolean.
     */
    public hasEventListener(type: string | number, callback: Function = null, thisObject: any = null): boolean {
        if (this.listeners[type] == null) return false;
        if (thisObject && callback) {
            for (var i: number = 0; i < this.listeners[type].length; i++) {
                var listener: CEventListener = this.listeners[type][i];
                if (listener.equalCurrentListener(type, callback, thisObject, listener.param)) {
                    return true;
                }
            }
        }
        return false;
    }
}
