import { Object3D } from '../core/entities/Object3D';
import { MeshRenderer } from '../components/renderer/MeshRenderer';
import { BoxGeometry } from '../shape/BoxGeometry';
import { SphereGeometry } from '../shape/SphereGeometry';
import { LitMaterial } from '../materials/LitMaterial';
import { Color } from '../math/Color';
import { Material } from '..';

export class Object3DUtil {
    private static boxGeo: BoxGeometry;
    private static sphere: SphereGeometry;
    private static material: LitMaterial;

    private static initHeap() {
        if (!this.boxGeo)
            this.boxGeo = new BoxGeometry();
        if (!this.sphere)
            this.sphere = new SphereGeometry(1, 35, 35);
        if (!this.material) {
            this.material = new LitMaterial();
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
        let renderer = obj.addComponent(MeshRenderer);
        renderer.geometry = this.boxGeo;
        renderer.material = this.material.clone();
        renderer.castShadow = true;
        return obj;
    }

    public static GetSingleCube(sizeX: number, sizeY: number, sizeZ: number, r: number, g: number, b: number) {
        this.initHeap();

        let mat = new LitMaterial();
        mat.roughness = 0.5;
        mat.metallic = 0.1;
        mat.baseColor = new Color(r, g, b, 1);

        let obj = new Object3D();
        let renderer = obj.addComponent(MeshRenderer);
        renderer.castGI = true;
        renderer.geometry = new BoxGeometry(sizeX, sizeY, sizeZ);
        renderer.material = mat;
        return obj;
    }

    public static GetSingleSphere(radius: number, r: number, g: number, b: number) {
        this.initHeap();

        let mat = new LitMaterial();
        mat.baseColor = new Color(r, g, b, 1);

        let obj = new Object3D();
        let renderer = obj.addComponent(MeshRenderer);
        renderer.castGI = true;
        renderer.geometry = new SphereGeometry(radius, 20, 20);
        renderer.material = mat;
        return obj;
    }

    public static get Sphere() {
        this.initHeap();

        let obj = new Object3D();
        let renderer = obj.addComponent(MeshRenderer);
        renderer.geometry = this.sphere;
        renderer.material = this.material;
        return obj;
    }

    public static GetSingleCube2(mat: Material, size: number = 10) {
        this.initHeap();

        let obj = new Object3D();
        let renderer = obj.addComponent(MeshRenderer);
        renderer.castShadow = false;
        renderer.geometry = new BoxGeometry(size, size, size);
        renderer.material = mat;
        return obj;
    }
}
