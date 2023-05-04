import { Matrix4 } from '../../../math/Matrix4';
import { Quaternion } from '../../../math/Quaternion';
import { Vector3 } from '../../../math/Vector3';
/**
 * @internal
 */
export enum CubeMapFaceEnum {
    Left = 0,
    Right = 1,
    Bottom = 2,
    Top = 3,
    Back = 4,
    Front = 5,
}
/**
 * @internal
 * @group GFX
 */
export class TextureCubeUtils {
    public static getRotationToFace(face: number): Quaternion {
        let quaternion: Quaternion = Quaternion.identity().clone();
        let target: Vector3 = new Vector3();
        let matrix = new Matrix4().identity();
        let up: Vector3 = new Vector3();
        switch (face) {
            case CubeMapFaceEnum.Top:
                target.set(0, -1, 0);
                up.set(0, 0, -1);
                break;
            case CubeMapFaceEnum.Bottom:
                target.set(0, 1, 0);
                up.set(0, 0, 1);
                break;
            case CubeMapFaceEnum.Right:
                target.set(1, 0, 0);
                up.set(0, 1, 0);
                break;
            case CubeMapFaceEnum.Left:
                target.set(-1, 0, 0);
                up.set(0, 1, 0);
                break;
            case CubeMapFaceEnum.Back:
                target.set(0, 0, -1);
                up.set(0, 1, 0);
                break;
            case CubeMapFaceEnum.Front:
                return Quaternion.identity();
        }
        matrix.lookAt(new Vector3(), target, up);
        quaternion.setFromRotationMatrix(matrix);
        return quaternion;
    }

}
