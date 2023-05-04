import {B3DMLoaderBase} from "./B3DMLoaderBase";
import {B3DMParseUtil} from "../B3DMParser";
import { Transform } from "../../../components/Transform";
import { Matrix4 } from "../../../math/Matrix4";
import { Orientation3D } from "../../../math/Orientation3D";
import { Vector3 } from "../../../math/Vector3";


export class B3DMLoader extends B3DMLoaderBase {
    public adjustmentTransform: Matrix4;
    private gltfBuffer: ArrayBufferLike;
    private static tempMatrix: Matrix4;

    constructor() {
        super();
        this.adjustmentTransform = new Matrix4().identity();
        B3DMLoader.tempMatrix ||= new Matrix4().identity();
    }

    async parse(buffer: ArrayBuffer) {
        const b3dm = await super.parse(buffer);
        this.gltfBuffer = b3dm.glbBytes.slice().buffer;
        let glbLoader = new B3DMParseUtil();

        let model = await glbLoader.parseBinary(this.gltfBuffer);

        let {batchTable, featureTable} = b3dm;

        const rtcCenter = featureTable.getData('RTC_CENTER');
        if (rtcCenter) {

            model.x += rtcCenter[0];
            model.y += rtcCenter[1];
            model.z += rtcCenter[2];

        }

        let transform = model.getComponent(Transform);
        transform.updateWorldMatrix();

        let tempMatrix = B3DMLoader.tempMatrix;
        tempMatrix.compose(transform.localPosition, transform.localRotQuat, transform.localScale);
        tempMatrix.multiply(this.adjustmentTransform);
        let prs: Vector3[] = tempMatrix.decompose(Orientation3D.QUATERNION);

        transform.localRotQuat.copyFrom(prs[1]);
        transform.localRotQuat = transform.localRotQuat;

        transform.localPosition.copyFrom(prs[0]);
        transform.localPosition = transform.localPosition;

        transform.localScale.copyFrom(prs[2]);
        transform.localScale = transform.localScale;

        transform.updateWorldMatrix();

        model['batchTable'] = batchTable;
        model['featureTable'] = featureTable;

        return model as any;
    }


    static decodeText(array) {

        if (typeof TextDecoder !== 'undefined') {

            return new TextDecoder().decode(array);

        }

        // Avoid the String.fromCharCode.apply(null, array) shortcut, which
        // throws a "maximum call stack size exceeded" error for large arrays.

        let s = '';

        for (let i = 0, il = array.length; i < il; i++) {

            // Implicitly assumes little-endian.
            s += String.fromCharCode(array[i]);

        }

        try {

            // merges multi-byte utf-8 characters.

            return decodeURIComponent(escape(s));

        } catch (e) { // see #16358

            return s;

        }

    }
}
