import { View3D } from "../../..";
import { IComponent } from "../../../components/IComponent";
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
    public static graphicComponent: Map<View3D, Map<IComponent, Function>>;

    /**
     * @internal
     */
    public static waitStartComponent: Map<Object3D, IComponent[]>;

    public static init() {
        ComponentCollect.componentsUpdateList = new Map<View3D, Map<IComponent, Function>>();
        ComponentCollect.componentsLateUpdateList = new Map<View3D, Map<IComponent, Function>>();
        ComponentCollect.componentsBeforeUpdateList = new Map<View3D, Map<IComponent, Function>>();
        ComponentCollect.componentsComputeList = new Map<View3D, Map<IComponent, Function>>();
        ComponentCollect.graphicComponent = new Map<View3D, Map<IComponent, Function>>();
        ComponentCollect.waitStartComponent = new Map<Object3D, IComponent[]>();
    }

    public static bindUpdate(view: View3D, component: IComponent, call: Function) {
        let list = ComponentCollect.componentsUpdateList.get(view);
        if (!list) {
            list = new Map<IComponent, Function>();
            ComponentCollect.componentsUpdateList.set(view, list);
        }
        list.set(component, call);
    }

    public static unBindUpdate(view: View3D, component: IComponent) {
        let list = ComponentCollect.componentsUpdateList.get(view);
        if (list) {
            list.delete(component);
        }
    }

    public static bindLateUpdate(view: View3D, component: IComponent, call: Function) {
        let list = ComponentCollect.componentsLateUpdateList.get(view);
        if (!list) {
            list = new Map<IComponent, Function>();
            ComponentCollect.componentsLateUpdateList.set(view, list);
        }
        list.set(component, call);
    }

    public static unBindLateUpdate(view: View3D, component: IComponent) {
        let list = ComponentCollect.componentsLateUpdateList.get(view);
        if (list) {
            list.delete(component);
        }
    }

    public static bindBeforeUpdate(view: View3D, component: IComponent, call: Function) {
        let list = ComponentCollect.componentsBeforeUpdateList.get(view);
        if (!list) {
            list = new Map<IComponent, Function>();
            ComponentCollect.componentsBeforeUpdateList.set(view, list);
        }
        list.set(component, call);
    }

    public static unBindBeforeUpdate(view: View3D, component: IComponent) {
        let list = ComponentCollect.componentsBeforeUpdateList.get(view);
        if (list) {
            list.delete(component);
        }
    }

    public static bindCompute(view: View3D, component: IComponent, call: Function) {
        let list = ComponentCollect.componentsComputeList.get(view);
        if (!list) {
            list = new Map<IComponent, Function>();
            ComponentCollect.componentsComputeList.set(view, list);
        }
        list.set(component, call);
    }

    public static unBindCompute(view: View3D, component: IComponent) {
        let list = ComponentCollect.componentsComputeList.get(view);
        if (list) {
            list.delete(component);
        }
    }


    public static bindGraphic(view: View3D, component: IComponent, call: Function) {
        let list = ComponentCollect.graphicComponent.get(view);
        if (!list) {
            list = new Map<IComponent, Function>();
            ComponentCollect.graphicComponent.set(view, list);
        }
        list.set(component, call);
    }

    public static unBindGraphic(view: View3D, component: IComponent) {
        let list = ComponentCollect.graphicComponent.get(view);
        if (list) {
            list.delete(component);
        }
    }
}
