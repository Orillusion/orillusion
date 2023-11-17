import { ComponentCollect } from '../..';
import { IComponent } from '../../components/IComponent';
import { RenderNode } from '../../components/renderer/RenderNode';
import { Transform } from '../../components/Transform';
import { CEventDispatcher } from '../../event/CEventDispatcher';
import { RenderLayer } from '../../gfx/renderJob/config/RenderLayer';
import { BoundUtil } from '../../util/BoundUtil';
import { GetCountInstanceID } from '../../util/Global';
import { BoundingBox } from '../bound/BoundingBox';
import { IBound } from '../bound/IBound';
import { Object3D } from './Object3D';

/**
 * The entity class provides an abstract base class for all scene objects that are considered to have "existence" in the scene,
 *  which can be considered as actual objects with positions and sizes.
 * Entity class is an abstract class and cannot be instantiated. If you want to instantiate it, please use the Object 3D class.
 * @group Entity
 */
export class Entity extends CEventDispatcher {
    /**
     *
     * The name of the object. The default value is an empty string.
     */
    public name: string = '';

    protected readonly _instanceID: string = '';
    private _numChildren: number;

    /**
     * The unique identifier of the object.
     */
    public get instanceID(): string {
        return this._instanceID;
    }



    /**
     *
     * The Transform attached to this object.
     */
    public transform: Transform;
    /**
     *
     * Renderer components
     */
    public renderNode: RenderNode;
    /**
     *
     * An array containing sub objects of an object
     */
    public entityChildren: Entity[];
    /**
     *
     * List of components attached to an object
     */
    public components: Map<any, IComponent>;


    protected waitDisposeComponents: IComponent[];

    /**
     *
     * The bounding box of an object
     */
    protected _bound: IBound;
    protected _boundWorld: IBound;
    protected _isBoundChange: boolean = true;
    private _dispose: boolean = false;
    // private _visible: boolean = true;



    /**
     *
     * Starting from the object itself, search for the object and its children, and return the first child object with a matching name.
     * For most objects, the name is an empty string by default. You must manually set it to use this method.
     * @param name input name
     * @returns result Entity
     */
    public getObjectByName(name: string): Entity {
        let isPath = name.indexOf('/') >= 0;
        if (!isPath) {
            return this.getChildByName(name, false);
        } else {
            let list = name.split('/');
            let currentEntity = this;

            while (list.length > 0 && currentEntity) {
                let shortName = list.shift();
                currentEntity = currentEntity.getChildByName(shortName, false);
                if (!currentEntity) {
                    return null;
                }
            }
            return currentEntity;
        }
    }

    /**
     *
     * @constructor
     */
    constructor() {
        super();
        this.entityChildren = [];
        this.components = new Map<any, IComponent>();
        this._instanceID = GetCountInstanceID().toString();
        this.waitDisposeComponents = [];
    }

    /**
     *
     * Returns the number of child objects of an object
     */
    public get numChildren(): number {
        return this._numChildren;
    }

    /**
     *
     * Add an object as a child of this object. You can add any number of objects.
     * Any current parent object on the object passed here will be deleted, as an object can only have at most one parent object.
     * @param child target child entity
     * @returns
     */
    public addChild(child: Entity): Entity {
        if (child == null) {
            throw new Error('child is null!');
        }
        if (child === this) {
            throw new Error('child is self!');
        }

        let index = this.entityChildren.indexOf(child);
        if (index == -1) {
            child.removeFromParent();
            child.transform.parent = this.transform;
            this.entityChildren.push(child);
            this._numChildren = this.entityChildren.length;
            return child;
        }
        return null;
    }

    /**
     *
     * Remove the child objects of the object. You can remove any number of objects.
     * @param child Removed objects
     */
    public removeChild(child: Entity) {
        if (child === null) return; // throw new Error('remove child is null!');
        if (child === this) throw new Error('add child is self!');
        let index = this.entityChildren.indexOf(child);
        if (index != -1) {
            this.entityChildren.splice(index, 1);
            child.transform.parent = null;
            this._numChildren = this.entityChildren.length;
        }
    }

    /**
     *
     * Remove all children of the current object
     */
    public removeAllChild() {
        while (this.numChildren > 0) {
            this.removeChild(this.entityChildren[0]);
        }
    }

    /**
     *
     * Remove the current node from the parent
     * @returns this
     */
    public removeSelf(): this {
        return this.removeFromParent();
    }

    /**
     *
     * Search for child nodes of objects and remove child objects with matching indexes.
     * @param index assign index
     * @returns
     */
    public removeChildByIndex(index: number) {
        if (index >= 0 && index < this.entityChildren.length) {
            this.removeChild(this.entityChildren[index]);
        } else {
            console.error('remove child by index , index out of range');
        }
    }

    /**
     *
     * Does the current object contain a certain object
     * @param child certain object
     * @returns boolean
     */
    public hasChild(child: Entity) {
        let index = this.entityChildren.indexOf(child);
        return index != -1;
    }

    /**
     *
     * Remove the current node from the parent
     * @returns this
     */
    public removeFromParent(): this {
        let parent = this.transform.parent;
        if (parent && parent.object3D) {
            parent.object3D.removeChild(this);
        }
        return this;
    }

    /**
     *
     * Search for object children and return the first child object with a matching index.
     * @param index matching index
     * @returns child entity
     */
    public getChildByIndex(index: number): Entity {
        let outObj = null;
        if (index < this.entityChildren.length) {
            outObj = this.entityChildren[index];
        }
        return outObj;
    }

    /**
     *
     * Search for object children and return a child object with a matching name.
     * @param name matching name
     * @param loopChild Whether to traverse the children of the child object. The default value is true
     * @returns result
     */
    public getChildByName(name: string, loopChild: boolean = true) {
        let out = null;
        for (const iterator of this.entityChildren) {
            if (iterator.name == name) {
                out = iterator;
                return out;
            } else if (loopChild) {
                out = iterator.getChildByName(name, loopChild);
                if (out) {
                    return out;
                }
            }
        }
        return out;
    }

    /**
     * @internal
     */
    public update() {
    }

    /**
     *
     * @private
     * @returns
     */
    public instantiate(): Object3D {
        return null;
    }

    protected onTransformLocalChange(e) {
        this._isBoundChange = true;
    }

    public get bound(): IBound {
        (this._isBoundChange || !this._bound) && this.updateBound();
        return this._boundWorld;
    }

    public set bound(value: IBound) {
        this._bound = value;
        this._boundWorld = this._bound.clone();
        this._isBoundChange = true;
    }

    private updateBound(): IBound {
        if (!this._bound) {
            this._bound = new BoundingBox();
            this._boundWorld = this._bound.clone();
            this._isBoundChange = true;
        }
        if (this._isBoundChange) {
            BoundUtil.transformBound(this.transform.worldMatrix, this._bound as BoundingBox, this._boundWorld as BoundingBox);
            this._isBoundChange = false;
        }
        return this._boundWorld;
    }

    /**
     *
     * @private
     * @returns
     */
    public waitUpdate(): void {
        if (this._dispose) {
            if (this.transform.parent) {
                this.transform.parent.object3D.removeChild(this);
            }
            this.components.forEach((v, k) => {
                v.enable = false;
                v.beforeDestroy();
                v.destroy();
            });
            this.components.clear();
        } else {
            ComponentCollect.waitStartComponent.forEach((v, k) => {
                // v.forEach((v) => {
                //     v[`__start`]();
                // })
                while (v.length > 0) {
                    const element = v.shift();
                    element[`__start`]();
                    ComponentCollect.waitStartComponent.delete(element.object3D);
                }
            });
        }
    }


    /**
     * release current object
     */
    public destroy(force?: boolean) {
        if (!this._dispose) {
            this.components.forEach((c) => {
                c.beforeDestroy(force);
            });
            this.components.forEach((c) => {
                c.destroy(force);
            });
            this.components.clear();
            this.entityChildren.forEach((c) => {
                c.destroy(force);
            })

            this.removeAllChild();

            this.transform.parent = null;
            this._dispose = true;
            super.destroy();
        }
    }
}
