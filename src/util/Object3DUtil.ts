import { Object3D } from '../core/entities/Object3D';
import { MeshRenderer } from '../components/renderer/MeshRenderer';
import { BoxGeometry } from '../shape/BoxGeometry';
import { SphereGeometry } from '../shape/SphereGeometry';
import { LitMaterial } from '../materials/LitMaterial';
import { Color } from '../math/Color';
import { PointLight } from '../components/lights/PointLight';
import { PlaneGeometry } from '../shape/PlaneGeometry';
import { Texture } from '../gfx/graphics/webGpu/core/texture/Texture';
import { Vector3 } from '../math/Vector3';
import { BlendMode } from '../materials/BlendMode';
import { Material } from '../materials/Material';

export class Object3DUtil {
    private static boxGeo: BoxGeometry;
    private static planeGeo: PlaneGeometry;
    private static sphere: SphereGeometry;
    private static material: LitMaterial;

    private static materialMap: Map<Texture, LitMaterial>;

    private static initHeap() {
        if (!this.boxGeo)
            this.boxGeo = new BoxGeometry();
        if (!this.planeGeo)
            this.planeGeo = new PlaneGeometry(1, 1, 1, 1, Vector3.UP);
        if (!this.sphere)
            this.sphere = new SphereGeometry(1, 35, 35);
        if (!this.material) {
            this.material = new LitMaterial();
        }
        if (!this.materialMap) {
            this.materialMap = new Map<Texture, LitMaterial>();
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

    public static GetMaterial(tex: Texture) {
        let mat = this.materialMap.get(tex);
        if (!mat) {
            mat = new LitMaterial();
            mat.baseMap = tex;
            this.materialMap.set(tex, mat);
        }
        return mat.clone();
    }

    public static GetPlane(tex: Texture) {
        this.initHeap();
        let obj = new Object3D();
        let renderer = obj.addComponent(MeshRenderer);
        renderer.geometry = this.planeGeo;
        let cloneMat = this.GetMaterial(tex);
        cloneMat.blendMode = BlendMode.ADD;
        cloneMat.castShadow = false;
        renderer.material = cloneMat;
        renderer.castGI = false;
        renderer.castReflection = false;
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

    public static GetPointLight(pos: Vector3, rotation: Vector3, radius: number, r: number, g: number, b: number, intensity: number = 1, castShadow: boolean = true) {
        let lightObj = new Object3D();
        let light = lightObj.addComponent(PointLight);
        light.lightColor = new Color(r, g, b, 1);
        light.intensity = intensity;
        light.range = radius;
        light.at = 8;
        light.radius = 0;
        light.castShadow = castShadow;
        lightObj.localPosition = pos;
        lightObj.localRotation = rotation;

        let sp = this.GetSingleSphere(0.1, 1, 1, 1);
        lightObj.addChild(sp);
        return light;
    }
}
