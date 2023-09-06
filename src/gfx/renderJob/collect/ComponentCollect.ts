import { ColliderComponent } from "../../../components/ColliderComponent";
import { IComponent } from "../../../components/IComponent";
import { View3D } from "../../../core/View3D";
import { Object3D } from "../../../core/entities/Object3D";

export class ComponentCollect {

    /**
     * @internal
     */
    public static componentsUpdateList: Map<View3D, Map<IComponent, Function>>;

    /**
     * @internal
     */
    public static componentsLateUpdateList: Map<View3D, Map<IComponent, Function>>;

    /**
     * @internal
     */
    public static componentsBeforeUpdateList: Map<View3D, Map<IComponent, Function>>;

    /**
     * @internal
     */
    public static componentsComputeList: Map<View3D, Map<IComponent, Function>>;

    /**
     * @internal
     */
    public static componentsEnablePickerList: Map<View3D, Map<ColliderComponent, Function>>;

    /**
     * @internal
     */
    public static graphicComponent: Map<View3D, Map<IComponent, Function>>;

    /**
     * @internal
     */
    // private static waitStartComponentBak: Map<Object3D, IComponent[]>;
    // private static waitStartComponentBody: Map<Object3D, IComponent[]>;
    public static waitStartComponent: Map<Object3D, IComponent[]>;

    private static _init: boolean = false;

    private static init() {
        if (!this._init) {
            this._init = true;
            this.componentsUpdateList = new Map<View3D, Map<IComponent, Function>>();
            this.componentsLateUpdateList = new Map<View3D, Map<IComponent, Function>>();
            this.componentsBeforeUpdateList = new Map<View3D, Map<IComponent, Function>>();
            this.componentsComputeList = new Map<View3D, Map<IComponent, Function>>();
            this.componentsEnablePickerList = new Map<View3D, Map<ColliderComponent, Function>>();
            this.graphicComponent = new Map<View3D, Map<IComponent, Function>>();
            // this.waitStartComponentBak = new Map<Object3D, IComponent[]>();
            // this.waitStartComponentBody = new Map<Object3D, IComponent[]>();
            this.waitStartComponent = new Map<Object3D, IComponent[]>();
        }
    }

    public static bindUpdate(view: View3D, component: IComponent, call: Function) {
        this.init();
        let list = this.componentsUpdateList.get(view);
        if (!list) {
            list = new Map<IComponent, Function>();
            this.componentsUpdateList.set(view, list);
        }
        list.set(component, call);
    }

    public static unBindUpdate(view: View3D, component: IComponent) {
        this.init();
        let list = this.componentsUpdateList.get(view);
        if (list) {
            list.delete(component);
        }
    }

    public static bindLateUpdate(view: View3D, component: IComponent, call: Function) {
        this.init();
        let list = this.componentsLateUpdateList.get(view);
        if (!list) {
            list = new Map<IComponent, Function>();
            this.componentsLateUpdateList.set(view, list);
        }
        list.set(component, call);
    }

    public static unBindLateUpdate(view: View3D, component: IComponent) {
        this.init();
        let list = this.componentsLateUpdateList.get(view);
        if (list) {
            list.delete(component);
        }
    }

    public static bindBeforeUpdate(view: View3D, component: IComponent, call: Function) {
        this.init();
        let list = this.componentsBeforeUpdateList.get(view);
        if (!list) {
            list = new Map<IComponent, Function>();
            this.componentsBeforeUpdateList.set(view, list);
        }
        list.set(component, call);
    }

    public static unBindBeforeUpdate(view: View3D, component: IComponent) {
        this.init();
        let list = this.componentsBeforeUpdateList.get(view);
        if (list) {
            list.delete(component);
        }
    }

    public static bindCompute(view: View3D, component: IComponent, call: Function) {
        this.init();
        let list = this.componentsComputeList.get(view);
        if (!list) {
            list = new Map<IComponent, Function>();
            this.componentsComputeList.set(view, list);
        }
        list.set(component, call);
    }

    public static unBindCompute(view: View3D, component: IComponent) {
        this.init();
        let list = this.componentsComputeList.get(view);
        if (list) {
            list.delete(component);
        }
    }

    public static bindGraphic(view: View3D, component: IComponent, call: Function) {
        this.init();
        let list = this.graphicComponent.get(view);
        if (!list) {
            list = new Map<IComponent, Function>();
            this.graphicComponent.set(view, list);
        }
        list.set(component, call);
    }

    public static unBindGraphic(view: View3D, component: IComponent) {
        this.init();
        let list = this.graphicComponent.get(view);
        if (list) {
            list.delete(component);
        }
    }

    public static appendWaitStart(component: IComponent) {
        this.init();
        let arr = this.waitStartComponent.get(component.object3D);
        if (!arr) {
            this.waitStartComponent.set(component.object3D, [component]);
        } else {
            let index = arr.indexOf(component);
            if (index == -1) {
                arr.push(component);
            }
        }
    }

    public static removeWaitStart(obj: Object3D, component: IComponent) {
        this.init();
        let arr = ComponentCollect.waitStartComponent.get(obj);
        if (arr) {
            let index = arr.indexOf(component);
            if (index != -1) {
                arr.splice(index);
            }
        }
    }

    public static bindEnablePick(view: View3D, component: ColliderComponent, call: Function) {
        this.init();
        let list = this.componentsEnablePickerList.get(view);
        if (!list) {
            list = new Map<ColliderComponent, Function>();
            this.componentsEnablePickerList.set(view, list);
        }
        list.set(component, call);
    }

    public static unBindEnablePick(view: View3D, component: ColliderComponent) {
        this.init();
        let list = this.componentsEnablePickerList.get(view);
        if (list) {
            list.delete(component);
        }
    }
}
