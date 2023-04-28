import { IComponent } from "../../../components/IComponent";
import { Object3D } from "../../../core/entities/Object3D";

export class ComponentCollect {

    /**
     * @internal
     */
    public static componentsUpdateList: Map<any, Function>;

    /**
     * @internal
     */
    public static componentsLateUpdateList: Map<any, Function>;

    /**
     * @internal
     */
    public static componentsBeforeUpdateList: Map<any, Function>;

    /**
     * @internal
     */
    public static componentsComputeList: Map<IComponent, Function>;

    /**
     * @internal
     */
    public static waitStartComponent: Map<Object3D, IComponent[]>;

    /**
     * @internal
     */
    public static graphicComponent: Map<IComponent, Function>;

    public static init() {
        ComponentCollect.componentsUpdateList = new Map<any, Function>();
        ComponentCollect.componentsLateUpdateList = new Map<any, Function>();
        ComponentCollect.componentsBeforeUpdateList = new Map<any, Function>();
        ComponentCollect.componentsComputeList = new Map<IComponent, Function>();
        ComponentCollect.waitStartComponent = new Map<Object3D, IComponent[]>();
        ComponentCollect.graphicComponent = new Map<IComponent, Function>();
    }
}
