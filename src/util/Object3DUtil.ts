import { Vector3 } from '.././math/Vector3';
import { BoundingBox } from '../core/bound/BoundingBox';
import { Object3D } from '../core/entities/Object3D';
import { MeshRenderer } from '../components/renderer/MeshRenderer';
import { BoxGeometry, SphereGeometry, LitMaterial, Color, MaterialBase } from '..';

export class Object3DUtil {
    private static readonly genMeshMinVector = Vector3.ZERO.clone();
    private static readonly genMeshMaxVector = Vector3.ZERO.clone();
    private static readonly genMeshVectorList8: Vector3[] = [new Vector3(), new Vector3(), new Vector3(), new Vector3(), new Vector3(), new Vector3(), new Vector3(), new Vector3()];
    /**
     * Merge the bounding boxes that have been added to the world matrix based on the mesh of the children node
     */
    public static genMeshBounds(obj: Object3D) {
        let tempMin = this.genMeshMinVector;
        let tempMax = this.genMeshMaxVector;
        let tempPoints = this.genMeshVectorList8;
        let min: Vector3 = new Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
        let max: Vector3 = min.clone().mul(-1);
        let bound = new BoundingBox(Vector3.ZERO, Vector3.ZERO);
        bound.setFromMinMax(min.clone(), max.clone());

        let cmpts = obj.getComponents(MeshRenderer);
        for (const cmpt of cmpts) {
            if (cmpt && cmpt.geometry) {
                let matrix = cmpt.object3D.transform.worldMatrix;
                tempMin.copy(cmpt.geometry.bounds.min);
                tempMax.copy(cmpt.geometry.bounds.max);

                tempPoints[0].set(tempMin.x, tempMin.y, tempMin.z); // 000
                tempPoints[1].set(tempMin.x, tempMin.y, tempMax.z); // 001
                tempPoints[2].set(tempMin.x, tempMax.y, tempMin.z); // 010
                tempPoints[3].set(tempMin.x, tempMax.y, tempMax.z); // 011
                tempPoints[4].set(tempMax.x, tempMin.y, tempMin.z); // 100
                tempPoints[5].set(tempMax.x, tempMin.y, tempMax.z); // 101
                tempPoints[6].set(tempMax.x, tempMax.y, tempMin.z); // 110
                tempPoints[7].set(tempMax.x, tempMax.y, tempMax.z); // 111

                for (const p of tempPoints) {
                    matrix.transformPoint(p, p);
                    bound.expandByPoint(p);
                }
            }
        }
        bound.setFromMinMax(bound.min, bound.max);

        return bound;
    }

    private static boxGeo: BoxGeometry;
    private static sphere: SphereGeometry;

    private static mat: LitMaterial;

    private static initHeap() {
        if (!this.boxGeo) {
            this.boxGeo = new BoxGeometry();
        }
        if (!this.sphere) {
            this.sphere = new SphereGeometry(1, 35, 35);
        }
        if (!this.mat) {
            this.mat = new LitMaterial();
        }
    }

    public static get CubeMesh() {
        this.initHeap();
        return this.boxGeo;
    }

    public static get SphereMesh() {
        this.initHeap();
        return this.sphere;
    }

    public static GetCube() {
        this.initHeap();

        let obj = new Object3D();
        let mr = obj.addComponent(MeshRenderer);
        mr.geometry = this.boxGeo;
        mr.material = this.mat.clone();
        mr.castShadow = true;
        return obj;
    }

    public static GetSingleCube(sizeX: number, sizeY: number, sizeZ: number, r: number, g: number, b: number) {
        this.initHeap();

        let mat = new LitMaterial();
        mat.baseColor = new Color(r, g, b, 1);

        let obj = new Object3D();
        let mr = obj.addComponent(MeshRenderer);
        mr.castGI = true;
        mr.geometry = new BoxGeometry(sizeX, sizeY, sizeZ);
        mr.material = mat;
        return obj;
    }

    public static GetSingleSphere(radius: number, r: number, g: number, b: number) {
        this.initHeap();

        let mat = new LitMaterial();
        mat.baseColor = new Color(r, g, b, 1);

        let obj = new Object3D();
        let mr = obj.addComponent(MeshRenderer);
        mr.castGI = true;
        mr.geometry = new SphereGeometry(radius, 20, 20);
        mr.material = mat;
        return obj;
    }

    public static get Sphere() {
        this.initHeap();

        let obj = new Object3D();
        let mr = obj.addComponent(MeshRenderer);
        mr.geometry = this.sphere;
        mr.material = this.mat;
        return obj;
    }

    public static getSinglepCube(mat: MaterialBase, size: number = 10) {
        this.initHeap();

        let obj = new Object3D();
        let mr = obj.addComponent(MeshRenderer);
        mr.castShadow = false;
        // mr.geometry = new SphereGeometry(size,35,35) ;
        mr.geometry = new BoxGeometry(size, size, size);
        mr.material = mat;
        return obj;
    }
}
