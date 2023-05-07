import { Transform } from '../../components/Transform';
import { Quaternion } from '../../math/Quaternion';
import { Vector3 } from '../../math/Vector3';
import { Entity } from './Entity';
import { Ctor } from "../../util/Global";
import { IComponent } from '../../components/IComponent';
import { ComponentCollect } from '../../gfx/renderJob/collect/ComponentCollect';
/**
 * The base class of most objects provides a series of properties and methods for manipulating objects in three-dimensional space.
 * @group Entity
 */
export class Object3D extends Entity {
    protected _isScene3D: boolean;
    public prefabRef?: string;

    /**
     * Instantiate a 3D object
     */
    constructor() {
        super();
        this.transform = this.addComponent(Transform);
    }

    public get isScene3D(): boolean {
        return this._isScene3D;
    }

    /**
     *
     * Traverse all sub objects starting from the object itself.
     *  If there are still sub objects in the sub object, recursively traverse.
     * @param callFunction execution body. Will execute sub objects as parameters
     * @returns
     */
    public forChild(call: Function) {
        this.entityChildren.forEach((element) => {
            call(element);
            (element as Object3D).forChild(call);
        });
    }

    /**
     *
     * Create a new component and add it to the object, and return an instance of the component.
     *  If a component of this type already exists, it will not be added and will return null.
     * @param c class of component
     * @return result component
     */
    public addComponent<T extends IComponent>(c: Ctor<T>, param?: any): T {
        let className = c.name;
        if (!this.components.has(className)) {
            let instance: T = new c() as T;
            instance.object3D = this;
            instance[`__init`](param);
            this.components.set(className, instance);
            this.appendLateStart(instance);
            return instance;
        }
        return null;
    }

    private appendLateStart(component: IComponent) {
        let arr = ComponentCollect.waitStartComponent.get(this);
        if (!arr) {
            ComponentCollect.waitStartComponent.set(this, [component]);
        } else {
            let index = arr.indexOf(component);
            if (index == -1) {
                arr.push(component);
            }
        }
    }

    /**
     *
     * Returns an instance of a component object of the specified type.
     *  If there are no components of that type, a new component is created and added to the object.
     * @param c class of component
     * @returns result component
     */
    public getOrAddComponent<T extends IComponent>(c: Ctor<T>): T {
        let className = c.name;
        let component = this.components.get(className);
        if (!component) {
            component = this.addComponent(c);
        }
        return component as T;
    }

    /**
     *
     * Remove components of the specified type
     * @param c class of component
     */
    public removeComponent<T extends IComponent>(c: Ctor<T>) {
        let className = c.name;
        if (this.components.has(className)) {
            let component = this.components.get(className);
            this.components.delete(className);
            component[`__stop`]();
            component.destroy();
        }
    }

    /**
     *
     * Is there a component of the specified type
     * @param c type of component
     * @returns boolean
     */
    public hasComponent<T extends IComponent>(c: Ctor<T>): boolean {
        let className = c.name;
        return this.components.has(className);
    }

    /**
     *
     * Returns a component of the specified type.
     * @param c class of component
     * @returns result component
     */
    public getComponent<T extends IComponent>(c: Ctor<T>): T {
        let className = c.name;
        return this.components.get(className) as T;
    }

    /**
     *
     * Returns a component object of the specified type from the parent node.
     *  If there are no components of that type,
     *  calls the parent object lookup of the parent object
     * @param c class of component
     * @returns reulst component
     */
    public getComponentFromParent<T extends IComponent>(c: Ctor<T>): T {
        if (!this.parent) {
            return null;
        }

        let component = this.parent.object3D.getComponent(c);
        if (component) {
            return component;
        }

        return this.parent.object3D.getComponentFromParent<T>(c);
    }

    /**
     *
     * Returns an array of component objects of the specified type.
     *  If there are no components of that type, search in the list of self body class objects
     * @param c class of component
     * @returns result components
     */
    public getComponentsInChild<T extends IComponent>(c: Ctor<T>): T[] {
        let list: T[] = [];
        let className = c.name;
        let component = this.components.get(className);
        if (component) {
            list.push(component as T);
        }
        for (let i = 0; i < this.entityChildren.length; i++) {
            let child = this.entityChildren[i] as Object3D;
            let coms = child.getComponentsInChild(c);
            list.push(...coms);
        }
        return list;
    }

    /**
     *
     * Returns all components of the specified type contained in the current object and its children.
     *  If there are children in the child object, recursively search.
     * @param c class of component
     * @param outList result component list
     * @param includeInactive Whether to include invisible objects, default to false
     * @returns {outList}
     */
    public getComponents<T extends IComponent>(c: Ctor<T>, outList?: Array<T>, includeInactive?: boolean): T[] {
        outList ||= [];
        let component = this.getComponent(c);
        if (component && (component.enable || includeInactive)) {
            outList.push(component)
        };
        for (let i = 0, count = this.entityChildren.length; i < count; i++) {
            let child = this.entityChildren[i];
            if (child && child instanceof Object3D) {
                child.getComponents(c, outList, includeInactive);
            }
        }
        return outList;
    }

    /**
     *
     * Quickly obtain components and no longer access child nodes after obtaining them at a certain node
     * @template T
     * @param {{ new(): T; }} c class of component
     * @param ret List of incoming T
     * @param includeInactive Whether to include invisible objects, default to false
     * @return {*}  {T}
     * @memberof ELPObject3D
     */
    public getComponentsExt<T extends IComponent>(c: Ctor<T>, ret?: T[], includeInactive?: boolean): T[] {
        if (!ret) ret = [];
        let className = c.name;
        let component = this.components.get(className);
        if (component && (component.enable || includeInactive)) {
            ret.push(component as T);
        } else {
            for (const node of this.entityChildren) {
                if (node instanceof Object3D) {
                    node.getComponentsExt(c, ret, includeInactive);
                }
            }
        }
        return ret;
    }

    /**
     *
     * clone a Object3D
     * @returns
     */
    public clone(): Object3D {
        return this.instantiate();
    }

    /**
     *
     * @private
     * @returns
     */
    public instantiate(): Object3D {
        let tmp = new Object3D();
        tmp.name = this.name + "_clone";
        this.entityChildren.forEach((v, k) => {
            let tmpChild = v.instantiate();
            tmp.addChild(tmpChild);
        });

        let coms = this.components;
        coms.forEach((v, k) => {
            v.cloneTo(tmp);
        });
        return tmp;
    }

    //****************
    //****************
    //****************
    //****************

    /**
     * Get the position of an object relative to its parent
     */
    public get localPosition(): Vector3 {
        return this.transform.localPosition;
    }

    /**
     * Set the position of an object relative to its parent
     */
    public set localPosition(value: Vector3) {
        this.transform.localPosition = value;
    }

    /**
     * Get the rotation attribute of an object relative to its parent
     */
    public get localRotation(): Vector3 {
        return this.transform.localRotation;
    }

    /**
     * Set the rotation attribute of an object relative to its parent
     */
    public set localRotation(value: Vector3) {
        this.transform.localRotation = value;
    }

    /**
     * Get the scaling attribute of an object relative to its parent
     */
    public get localScale(): Vector3 {
        return this.transform.localScale;
    }

    /**
     * Set the scaling attribute of an object relative to its parent
     */
    public set localScale(value: Vector3) {
        this.transform.localScale = value;
    }

    /**
     * Get the rotation attribute of an object relative to its parent, which is a quaternion
     */
    public get localQuaternion(): Quaternion {
        return this.transform.localRotQuat;
    }

    /**
     * Set the rotation attribute of an object relative to its parent, which is a quaternion
     */
    public set localQuaternion(value: Quaternion) {
        this.transform.localRotQuat = value;
    }

    /**
     * Notify transformation attribute updates
     */
    public notifyChange(): void {
        this.transform.notifyChange();
    }

    /**
     *
     * Transform component of object parent
     */
    public get parent(): Transform {
        return this.transform.parent;
    }

    /**
     *
     * parent object3D
     */
    public get parentObject(): Object3D {
        return this.transform.parent.object3D;
    }

    /**
     *
     * Set the x coordinate relative to the local coordinates of the parent container.
     */
    public set x(value: number) {
        this.transform.x = value;
    }

    /**
     *
     * Get the x coordinate relative to the local coordinates of the parent container.
     */
    public get x(): number {
        return this.transform.x;
    }

    /**
     * Set the y coordinate relative to the local coordinates of the parent container.
     */
    public set y(value: number) {
        this.transform.y = value;
    }

    /**
     *
     * Get the y coordinate relative to the local coordinates of the parent container.
     */
    public get y(): number {
        return this.transform.y;
    }

    /**
     * Set the z coordinate relative to the local coordinates of the parent container.
     */
    public set z(value: number) {
        this.transform.z = value;
    }

    /**
     * Get the z coordinate relative to the local coordinates of the parent container.
     */
    public get z(): number {
        return this.transform.z;
    }

    /**
     * Set the x scale relative to the local coordinates of the parent container.
     */
    public set scaleX(value: number) {
        this.transform.scaleX = value;
    }

    /**
     *
     * Get the x scale relative to the local coordinates of the parent container.
     */
    public get scaleX(): number {
        return this.transform.scaleX;
    }

    /**
     *
     * Set the y scale relative to the local coordinates of the parent container.
     */
    public set scaleY(value: number) {
        this.transform.scaleY = value;
    }

    /**
     *
     * Get the y scale relative to the local coordinates of the parent container.
     */
    public get scaleY(): number {
        return this.transform.scaleY;
    }

    /**
     *
     * Set the z scale relative to the local coordinates of the parent container.
     */
    public set scaleZ(value: number) {
        this.transform.scaleZ = value;
    }

    /**
     *
     * Get the z scale relative to the local coordinates of the parent container.
     */
    public get scaleZ(): number {
        return this.transform.scaleZ;
    }

    /**
     *
     * Set the x rotation relative to the local coordinates of the parent container.
     */
    public set rotationX(value: number) {
        this.transform.rotationX = value;
    }

    /**
     *
     * Get the x rotation relative to the local coordinates of the parent container.
     */
    public get rotationX(): number {
        return this.transform.rotationX;
    }

    /**
     *
     * Set the y rotation relative to the local coordinates of the parent container.
     */
    public set rotationY(value: number) {
        this.transform.rotationY = value;
    }

    /**
     *
     * Get the y rotation relative to the local coordinates of the parent container.
     */
    public get rotationY(): number {
        return this.transform.rotationY;
    }

    /**
     *
     * Set the z rotation relative to the local coordinates of the parent container.
     */
    public set rotationZ(value: number) {
        this.transform.rotationZ = value;
    }

    /**
     *
     * Set the z rotation relative to the local coordinates of the parent container.
     */
    public get rotationZ(): number {
        return this.transform.rotationZ;
    }

    /**
     * @internal
     */
    protected fixedUpdate(): void {
    }

    /**
     * @internal
     */
    protected lateUpdate(): void {
    }

    /**
     *
     * Recursive child nodes and execute specified function
     * @param callback specified function
     */
    public traverse(callback: (child) => void) {
        callback(this);
        for (let i = 0, l = this.entityChildren.length; i < l; i++) {
            let item = this.entityChildren[i];
            if (item instanceof Object3D) {
                item.traverse(callback);
            }
        }

    }

    /**
     *
     * Release self
     */
    public destroy(): void {
        super.destroy();
    }

}
