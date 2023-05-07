import { Camera3D } from '../core/Camera3D';
import { Object3D } from '../core/entities/Object3D';
import { Vector3 } from '../math/Vector3';

type ZSortItemObject3D = { obj3d: Object3D; z: number; userData: any };

/**
 * Sort a data with world coordinates based on the camera's camera by z
 * @group Util
 */
export class ZSorterUtil {
    private _pool: ZSortItemObject3D[] = [];
    private _worldPosition: Vector3 = new Vector3();
    private _viewPosition: Vector3 = new Vector3();
    private _zSortList: ZSortItemObject3D[] = [];

    private pop(): ZSortItemObject3D {
        return this._pool.pop() || ({} as any);
    }

    private recycle() {
        for (let item of this._zSortList) {
            item.z = 0;
            item.userData = null;
            item.obj3d = null;
            this._pool.push(item);
        }
        this._zSortList.length = 0;
    }

    /**
     * Sort userDataList by z based on the view coordinates of camera3D
     * @param camera3D camera3D
     * @param userDataList List of objects that users need to sort
     * @param getObject3D Obtain the function of the Object 3D reference based on userData
     * @param result Returns a list of userData, and if passed in as null, instantiates one
     * @returns
     */
    public sort(camera3D: Camera3D, userDataList: any[], getObject3D: (userData: any) => Object3D, result?: any[]) {
        this._zSortList = [];
        for (let userData of userDataList) {
            let zSortItemObject3D = this.pop();
            zSortItemObject3D.userData = userData;
            zSortItemObject3D.obj3d = getObject3D(userData);
            this._worldPosition.copyFrom(zSortItemObject3D.obj3d.transform.worldPosition);
            camera3D.worldToScreenPoint(this._worldPosition, this._viewPosition);
            zSortItemObject3D.z = this._viewPosition.z;
            this._zSortList.push(zSortItemObject3D);
        }

        this._zSortList.sort((a, b) => {
            return a.z - b.z > 0 ? 1 : -1;
        });

        result ||= [];
        for (let item of this._zSortList) {
            result.push(item.userData);
        }
        this.recycle();
        return result;
    }
}

// export let zSorterUtil: ZSorterUtil = new ZSorterUtil();
