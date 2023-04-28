import { MeshRenderer } from '../components/renderer/MeshRenderer';
import { Object3D } from '../core/entities/Object3D';
import { LitMaterial } from '../materials/LitMaterial';
import { UnLitMaterial } from '../materials/UnLitMaterial';
import { Color } from '../math/Color';
import { Vector3 } from '../math/Vector3';
import { BoxGeometry } from '../shape/BoxGeometry';


/**
 * @internal
 * @group Util
 */
export class AxisObject extends Object3D {
    public length: number = 100;

    public thickness: number = 0.1;
    constructor(length: number, thickness: number = 0.1) {
        super();
        this.length = length;
        this.thickness = thickness;
        this.init();
    }

    public init() {
        let xAx = new Object3D();
        let yAx = new Object3D();
        let zAx = new Object3D();

        let cubeX = new BoxGeometry(2, 2, 2);
        let cubeY = new BoxGeometry(2, 2, 2);
        let cubeZ = new BoxGeometry(2, 2, 2);

        let matX = new UnLitMaterial();
        matX.baseColor = new Color(1.0, 0.0, 0.0);

        let matY = new UnLitMaterial();
        matY.baseColor = new Color(0.0, 1.0, 0.0);

        let matZ = new UnLitMaterial();
        matZ.baseColor = new Color(0.0, 0.0, 1.0);

        let mrx = xAx.addComponent(MeshRenderer);
        let mry = yAx.addComponent(MeshRenderer);
        let mrz = zAx.addComponent(MeshRenderer);

        mrx.geometry = cubeX;
        mrx.material = matX;
        mrx.castShadow = false;
        mry.geometry = cubeY;
        mry.material = matY;
        mry.castShadow = false;
        mrz.geometry = cubeZ;
        mrz.material = matZ;
        mrz.castShadow = false;

        xAx.localScale = new Vector3(this.length, this.thickness, this.thickness);
        xAx.x = this.length;
        yAx.localScale = new Vector3(this.thickness, this.length, this.thickness);
        yAx.y = this.length;
        zAx.localScale = new Vector3(this.thickness, this.thickness, this.length);
        zAx.z = this.length;

        this.addChild(xAx);
        this.addChild(yAx);
        this.addChild(zAx);
    }
}
