import { View3D } from "../core/View3D";
import { Object3D } from "../core/entities/Object3D";
import { CEventDispatcher } from "../event/CEventDispatcher";
import { ComponentType, SerializeTag } from "../util/SerializeDefine";
import { Transform } from "./Transform";


/**
 * Components are used to attach functionality to object3D, it has an owner object3D.
 * The component can receive update events at each frame.
 * @group Components
 */
export class ComponentBase {
    /**
     * owner object3D
     */
    public object3D: Object3D = null;

    /**
     * @internal
     */
    public eventDispatcher: CEventDispatcher;

    /**
     * @internal
     */
    public componentType: ComponentType = ComponentType.none;

    /**
     * @internal
     */
    public serializeTag?: SerializeTag;

    /**
     * @internal
     */
    protected _enable: boolean = true;

    private __isStart: boolean = false;

    constructor() {
        this.eventDispatcher = new CEventDispatcher();
    }

    /**
     * 附加到此 Object3D对象 的 Transform组件。
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
                this.onEnable();
            } else {
                this.onDisable();
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
            this.start();
            this.__isStart = true;
        }
        if (this.transform && this.transform.scene3D) {
            this.onEnable();
        }
        let hasUpdate = this.onUpdate.toString().replace(/\s+/g, '').length;
        if (hasUpdate > 10) {
            this._onUpdate(this.onUpdate.bind(this));
        }
        let hasLateUpdate = this.onLateUpdate.toString().replace(/\s+/g, '').length;
        if (hasLateUpdate > 14) {
            this._onLateUpdate(this.onLateUpdate.bind(this));
        }
        let hasBeforeUpdate = this.onBeforeUpdate.toString().replace(/\s+/g, '').length;
        if (hasBeforeUpdate > 16) {
            this._onBeforeUpdate(this.onBeforeUpdate.bind(this));
        }
        let hasCompute = this.onCompute.toString().replace(/\s+/g, '').length;
        if (hasCompute > 11) {
            this._onCompute(this.onCompute.bind(this));
        }
        let hasOnGraphic = this.onGraphic.toString().replace(/\s+/g, '').length;
        if (hasOnGraphic > 11) {
            this._onGraphic(this.onGraphic.bind(this));
        }
    }

    private __stop() {
        if (this.transform && this.transform.scene3D) {
            this.onDisable();
        }
        this._onUpdate(null);
        this._onLateUpdate(null);
        this._onBeforeUpdate(null);
        this._onCompute(null);
        this._onGraphic(null);
    }

    protected init(param?: any) { }
    protected start() { }
    protected stop() { }
    protected onEnable(view?: View3D) { }
    protected onDisable(view?: View3D) { }
    protected onUpdate(view?: View3D) { }
    protected onLateUpdate(view?: View3D) { }
    protected onBeforeUpdate(view?: View3D) { }
    protected onCompute(view?: View3D, command?: GPUCommandEncoder) { }
    protected onGraphic(view?: View3D) { }

    /**
     *
     * clone component data to target object3D
     * @param obj target object3D
     */
    public cloneTo(obj: Object3D) { }

    /**
     * internal
     * Add update function. Will be executed at every frame update.
     * @param call callback
     */
    private _onUpdate(call: Function) {
        if (call != null) {
            ComponentBase.componentsUpdateList.set(this, call);
        } else {
            ComponentBase.componentsUpdateList.delete(this);
        }
    }

    /**
     * Add a delayed update function.
     * @param call callback
     */
    private _onLateUpdate(call: Function) {
        // if(!this.enable) return;
        if (call != null) {
            ComponentBase.componentsLateUpdateList.set(this, call);
        } else {
            ComponentBase.componentsLateUpdateList.delete(this);
        }
    }

    /**
     * The function executed before adding frame updates.
     * @param call callback
     */
    private _onBeforeUpdate(call: Function) {
        // if(!this.enable) return;
        if (call != null) {
            ComponentBase.componentsBeforeUpdateList.set(this, call);
        } else {
            ComponentBase.componentsBeforeUpdateList.delete(this);
        }
    }

    /**
     * @internal
     * Add individual execution compute capability
     * @param call callback
     */
    private _onCompute(call: Function) {
        if (call != null) {
            ComponentBase.componentsComputeList.set(this, call);
        } else {
            ComponentBase.componentsComputeList.delete(this);
        }
    }

    /**
     * Add individual execution drawing ability
     * @param call callback
     */
    private _onGraphic(call: Function) {
        if (call != null) {
            ComponentBase.graphicComponent.set(this, call);
        } else {
            ComponentBase.graphicComponent.delete(this);
        }
    }

    /**
     * release this component
     */
    public destroy() {
        this.enable = false;
        this.stop();
        this._onBeforeUpdate(null);
        this._onUpdate(null);
        this._onLateUpdate(null);
    }

    /**
     * @internal
     */
    static componentsUpdateList: Map<any, Function> = new Map<any, Function>();

    /**
     * @internal
     */
    static componentsLateUpdateList: Map<any, Function> = new Map<any, Function>();

    /**
     * @internal
     */
    static componentsBeforeUpdateList: Map<any, Function> = new Map<any, Function>();

    /**
     * @internal
     */
    static componentsComputeList: Map<ComponentBase, Function> = new Map<ComponentBase, Function>();

    /**
     * @internal
     */
    static waitStartComponent: Map<Object3D, ComponentBase[]> = new Map<Object3D, ComponentBase[]>();

    /**
     * @internal
     */
    static graphicComponent: Map<ComponentBase, Function> = new Map<ComponentBase, Function>();
}
