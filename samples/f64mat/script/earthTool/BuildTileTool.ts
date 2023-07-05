import {
    Engine3D,
    GPUAddressMode,
    GPUPrimitiveTopology,
    Object3D,
    PlaneGeometry,
    Scene3D,
    UnLitMaterial,
    Vector3,
    VertexAttributeName
} from "@orillusion/core";
import { EarthTool } from "./EarthTool";
import { EarthControl } from "./EarthControl";

import {Float64Material, Float64TestMaterial, Mesh64Renderer} from "@orillusion/float64-material";

export class BuildTileTool {
    public scene: Scene3D
    quadKey: any;
    size: number;
    offsetX: any;
    offsetY: number;
    subd: number;
    tileX: number;
    level: number;
    cb: any;
    j: number;
    tileMapLoaded: boolean;
    isReady: boolean;
    lock: boolean;
    useShader: boolean;
    tile: Object3D;
    constructor(scene: Scene3D, quadKey: number, size: number, offsetX: number, offsetY: number, subd: number, level: number, tileX: number, tileY: number, l: any) {
        this.scene = scene;
        this.quadKey = quadKey;
        this.size = size;
        this.offsetX = offsetX;
        this.offsetY = offsetY;
        this.subd = subd;
        this.level = level;
        this.tileX = tileX;
        this.j = tileY;
        this.cb = l;
        this.tileMapLoaded = false;
        this.isReady = false;
        this.lock = false;
        this.useShader = true;
        // 3 === this.level && (this.lock = true);
        this.tile = BuildTileTool.builTile(this.scene, this.size, offsetX, offsetY, level, tileX, tileY);
        this.useShader

    }
    public static builTile(scene: Scene3D, size: number, offsetX: number, offsetY: number, level: number, tileX: number, tileY: number) {
        // 新建对象
        const obj: Object3D = new Object3D();
        // 为对象添 MeshRenderer
        let geometry = new PlaneGeometry(size, size,level>4?10:40, level>4?10:40);
        let VerticesData = geometry.getAttribute(VertexAttributeName.position).data;
        let lownom = new Float32Array(VerticesData.length);
        const t = VerticesData.length / 3;
        for (let i = 0; i < t; i++) {
            let t = VerticesData[3 * i] + offsetX;
            const n = VerticesData[3 * i + 1];
            let r = VerticesData[3 * i + 2] - offsetY;
            t = EarthTool.MapNumberToInterval(t, -180, 180, -EarthTool.EPSG3857_MAX_BOUND, EarthTool.EPSG3857_MAX_BOUND);
            r = EarthTool.MapNumberToInterval(r, -180, 180, -EarthTool.EPSG3857_MAX_BOUND, EarthTool.EPSG3857_MAX_BOUND);
            const o = EarthTool.InverseWebMercator(t, r, n);
            const s = this.spherify(o.x, o.z);
            VerticesData[3 * i] = BuildTileTool.SplitDouble(-s.x)[0];
            lownom[3 * i] = BuildTileTool.SplitDouble(-s.x)[1];
            VerticesData[3 * i + 1] = BuildTileTool.SplitDouble(-s.y)[0];
            lownom[3 * i + 1] = BuildTileTool.SplitDouble(-s.y)[1];
            VerticesData[3 * i + 2] = BuildTileTool.SplitDouble(s.z)[0];
            lownom[3 * i + 2] = BuildTileTool.SplitDouble(s.z)[1];
        }


        let mr: Mesh64Renderer = obj.addComponent(Mesh64Renderer);
        // 设置几何体
        mr.geometry = geometry;
        mr.geometry.setAttribute(VertexAttributeName.normal, lownom);

        // 设置材质
        mr.material = new Float64Material();
        let texture = Engine3D.res.loadTexture("//mt1.google.com/vt/lyrs=m&hl=en&x=" + tileX + "&y=" + tileY + "&z=" + level);


        texture.then((res) => {
            res.addressModeU = GPUAddressMode.clamp_to_edge;
            res.addressModeV = GPUAddressMode.clamp_to_edge;
            mr.material.baseMap = res;

        })

        mr.material.shaderState.topology = GPUPrimitiveTopology.line_list;
        mr.material.transparent = false;
        // mr.material.cullMode = GPUCullMode.none;
        scene.addChild(obj);
        return obj;
    }
    tileTexturCB() {
        this.tileMapLoaded = true,
            this.cb()
    }
    hasChild() {
        for (const e in EarthControl.TilesbyQuadKey)
            e !== this.quadKey && EarthControl.TilesbyQuadKey[e].quadKey.startsWith(this.quadKey) && (EarthControl.TilesbyQuadKey[e].tile.getComponent(Mesh64Renderer).enable = false);
    }
    public static spherify(e: number, t: number) {
        const n = (90 - t) / 180 * Math.PI
            , r = e / 180 * Math.PI;
        return new Vector3(50 * Math.sin(n) * Math.cos(r), 50 * Math.cos(n), 50 * Math.sin(n) * Math.sin(r))
    }

    public static SplitDouble(value: number): number[] {
        let hi = Float32Array.from([value])[0];
        let low = value - hi;
        return [hi, low];
    }

}