import { GeometryBase, Object3D } from '../..';
import { Engine3D } from '../../Engine3D';
import { RegisterComponent } from '../../util/SerializeDecoration';
import { MeshRenderer } from './MeshRenderer';

/**
 * The mesh renderer component is a component used to render the mesh
 * @group Components
 */
@RegisterComponent(MeshFilter, 'MeshFilter')
export class MeshFilter extends MeshRenderer {
    constructor() {
        super();
    }

    public get geometry(): GeometryBase {
        return null;
    }
    public set geometry(value: GeometryBase) {

    }

    public cloneTo(obj: Object3D): void {

    }

    public set meshURL(value: string) {
        let geometry = Engine3D.res.getGeometry(value);
        if (geometry) {
            this.geometry = geometry;
        } else {
            console.error("no geometry set", value);
        }
        // this.material = Engine3D.res.defaltMaterial;
    }
}
