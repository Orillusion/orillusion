import { View3D } from "../core/View3D";
import { Object3D } from "../core/entities/Object3D";
import { CEventDispatcher } from "../event/CEventDispatcher";
import { ComponentCollect } from "../gfx/renderJob/collect/ComponentCollect";
import { IComponent } from "./IComponent";
import { Transform } from "./Transform";

/**
 * Components are used to attach functionality to object3D, it has an owner object3D.
 * The component can receive update events at each frame.
 * @group Components
 */
export class ComponentBase implements IComponent {
    /**
     * owner object3D
     */
    public object3D: Object3D = null;

    /**
     * @internal
     */
    protected _eventDispatcher: CEventDispatcher;
    public get eventDispatcher() {
        this._eventDispatcher ||= new CEventDispatcher();
        return this._eventDispatcher;
    }

    public set eventDispatcher(value) {
        console.error('The eventDispatcher should not be set externally!');
    }

    /**
     * @internal
     */
    protected _enable: boolean = true;

    private __isStart: boolean = false;


    /**
     * Return the Transform component attached to the Object3D.
     */
    public get transform(): Transform {
        return this.object3D.transform;
    }

    /**
     * Enable/disable components. The enabled components can be updated, while the disabled components cannot be updated.
     */
    public set enable(value: boolean) {
        if (this._enable != value) {
            this._enable = value;
            if (this._enable) {
                this.onEnable?.(this.transform.view3D);
            } else {
                this.onDisable?.(this.transform.view3D);
            }
        }
    }

    /**
     * Enable/disable components. The enabled components can be updated, while the disabled components cannot be updated.
     */
    public get enable(): boolean {
        return this._enable;
    }

    private __init(param?: any) {
        this.init(param);
    }

    private __start() {
        if (this.transform && this.transform.scene3D && this.__isStart == false) {
            this.start?.();
            this.__isStart = true;
        }
        if (this.transform && this.transform.scene3D && this._enable) {
            this.onEnable?.(this.transform.view3D);
        }
        if (this.onUpdate) {
            this._onUpdate(this.onUpdate.bind(this));
        }
        if (this.onLateUpdate) {
            this._onLateUpdate(this.onLateUpdate.bind(this));
        }
        if (this.onBeforeUpdate) {
            this._onBeforeUpdate(this.onBeforeUpdate.bind(this));
        }
        if (this.onCompute) {
            this._onCompute(this.onCompute.bind(this));
        }
        if (this.onGraphic) {
            this._onGraphic(this.onGraphic.bind(this));
        }
    }

    private __stop() {
        if (this.transform && this.transform.scene3D) {
            this.onDisable?.(this.transform.view3D);
        }
        this._onUpdate(null);
        this._onLateUpdate(null);
        this._onBeforeUpdate(null);
        this._onCompute(null);
        this._onGraphic(null);
    }

    public init(param?: any) { }
    public start() { }
    public stop() { }
    public onEnable?(view?: View3D);
    public onDisable?(view?: View3D);
    public onUpdate?(view?: View3D);
    public onLateUpdate?(view?: View3D);
    public onBeforeUpdate?(view?: View3D);
    public onCompute?(view?: View3D, command?: GPUCommandEncoder);
    public onGraphic?(view?: View3D);
    public onParentChange?(lastParent?: Object3D, currentParent?: Object3D);
    public beforeDestroy?(force?: boolean);

    /**
     *
     * clone component data to target object3D
     * @param obj target object3D
     */
    public cloneTo(obj: Object3D) { }

    public copyComponent(from: this): this { return this; }

    /**
     * internal
     * Add update function. Will be executed at every frame update.
     * @param call callback
     */
    private _onUpdate(call: Function) {
        if (call != null) {
            ComponentCollect.bindUpdate(this.transform.view3D, this, call);
        } else {
            ComponentCollect.unBindUpdate(this.transform.view3D, this);
        }
    }

    /**
     * Add a delayed update function.
     * @param call callback
     */
    private _onLateUpdate(call: Function) {
        if (call != null) {
            ComponentCollect.bindLateUpdate(this.transform.view3D, this, call);
        } else {
            ComponentCollect.unBindLateUpdate(this.transform.view3D, this);
        }
    }

    /**
     * The function executed before adding frame updates.
     * @param call callback
     */
    private _onBeforeUpdate(call: Function) {
        if (call != null) {
            ComponentCollect.bindBeforeUpdate(this.transform.view3D, this, call);
        } else {
            ComponentCollect.unBindBeforeUpdate(this.transform.view3D, this);
        }
    }

    /**
     * @internal
     * Add individual execution compute capability
     * @param call callback
     */
    private _onCompute(call: Function) {
        if (call != null) {
            ComponentCollect.bindCompute(this.transform.view3D, this, call);
        } else {
            ComponentCollect.unBindCompute(this.transform.view3D, this);
        }
    }

    /**
     * Add individual execution drawing ability
     * @param call callback
     */
    private _onGraphic(call: Function) {
        if (call != null) {
            ComponentCollect.bindGraphic(this.transform.view3D, this, call);
        } else {
            ComponentCollect.unBindGraphic(this.transform.view3D, this);
        }
    }

    /**
     * release this component
     */
    public destroy(force?: boolean) {
        this.enable = false;
        this.stop();
        this._onBeforeUpdate(null);
        this._onUpdate(null);
        this._onLateUpdate(null);

        this.onEnable = null;
        this.onDisable = null;
        this.onUpdate = null;
        this.onLateUpdate = null;
        this.onBeforeUpdate = null;
        this.onCompute = null;
        this.onGraphic = null;
    }
}
