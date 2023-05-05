import { AnimationCurve } from "../../../math/AnimationCurve";

/**
 * @internal
 * @group Animation
 */
export class AttributeAnimCurve extends AnimationCurve {
    public attribute: string = '';
    public propertyList: string[];
    public path: string;

    constructor() {
        super();
    }

    public unSerialized(data: any): this {
        let { attribute, path } = data;
        this.attribute = attribute;
        this.path = path;
        this.propertyList = attribute.split('.');
        super.unSerialized(data.curve);
        return this;
    }
}
