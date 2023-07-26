import { Engine3D } from "../../Engine3D";
import { GlobalBindGroup } from "../../gfx/graphics/webGpu/core/bindGroups/GlobalBindGroup";
import { EntityCollect } from "../../gfx/renderJob/collect/EntityCollect";
import { DDGIIrradianceVolume } from "../../gfx/renderJob/passRenderer/ddgi/DDGIIrradianceVolume";
import { Probe } from "../../gfx/renderJob/passRenderer/ddgi/Probe";
import { GIProbeMaterial, GIProbeMaterialType } from "../../materials/GIProbeMaterial";
import { Quaternion } from "../../math/Quaternion";
import { Vector3 } from "../../math/Vector3";
import { SphereGeometry } from "../../shape/SphereGeometry";
import { ComponentBase } from "../ComponentBase";
import { MeshRenderer } from "./MeshRenderer";

/**
 *
 * Global illumination component.
 * Use global illumination to achieve more realistic lighting.
 * The global illumination system can model the way light reflects
 *  or refracts on the surface to other surfaces (indirect lighting),
 *  rather than limiting that light can only shine from the light
 *  source to a certain surface.
 * @group Components
 */
export class GlobalIlluminationComponent extends ComponentBase {
    private _probes: Probe[];
    private _volume: DDGIIrradianceVolume;

    private _debugMr: MeshRenderer[] = [];

    public init(): void {
        Engine3D.setting.gi.enable = true;
    }

    public start(): void {
        this._volume = GlobalBindGroup.getLightEntries(this.transform.scene3D).irradianceVolume;
        this.initProbe();
    }

    private initProbe() {
        let xCount: number = this._volume.setting.probeXCount;
        let yCount: number = this._volume.setting.probeYCount;
        let zCount: number = this._volume.setting.probeZCount;


        let debugGeo = new SphereGeometry(4, 16, 16);
        let position: Vector3 = new Vector3();
        this._probes = [];
        for (let x = 0; x < xCount; x++) {
            for (let y = 0; y < yCount; y++) {
                for (let z = 0; z < zCount; z++) {
                    let index = x + z * xCount + y * (xCount * zCount);
                    let probe = new Probe();
                    probe.index = index;

                    probe.name = `${x}_${y}_${z}`;
                    let mr = probe.addComponent(MeshRenderer);
                    mr.material = new GIProbeMaterial(GIProbeMaterialType.CastGI, index);
                    // mr.material = new GIProbeMaterial(GIProbeMaterialType.CastDepth, index);
                    // mr.material = unlitMat;
                    mr.geometry = debugGeo;
                    mr.castGI = false;
                    mr.castShadow = false;

                    this._debugMr.push(mr);

                    this.object3D.addChild(probe);

                    this._volume.calcPosition(x, y, z, position);

                    probe.x = position.x;
                    probe.y = position.y;
                    probe.z = position.z;

                    this._probes[index] = probe;

                    this._debugMr.push(mr);
                }
            }
        }

        for (let i = 0; i < this._probes.length; i++) {
            EntityCollect.instance.addGIProbe(this.transform.scene3D, this._probes[i]);
        }

        this.object3D.transform.enable = false;

        if (this._volume.setting.debug) {
            this.debug();
        }
    }

    public debug() {

    }

    private debugProbeRay(probeIndex: number, array: Float32Array) {
        const rayNumber = Engine3D.setting.gi.rayNumber;
        let quat = new Quaternion(0.0, -0.7071067811865475, 0.7071067811865475, 0.0);
        for (let i = 0; i < rayNumber; i++) {
            let ii = probeIndex * rayNumber + i;
            let dir = new Vector3(
                -array[ii * 4 + 0],
                -array[ii * 4 + 1],
                -array[ii * 4 + 2],
                0
            );
            quat.transformVector(dir, dir);
            let len = array[ii * 4 + 3];
            let id = `showRays${probeIndex}${i}`;

            let start = this._probes[probeIndex].transform.worldPosition.clone();
            let end = dir.scaleBy(len);
            end.add(start, end);

            //view.graphic3D.Clear(id);
            //view.graphic3D..drawLines(id, [start, end], [new Color(0, 0, 0, 0), new Color(1.0, 1.0, 1.0, 1.0)]);

        }
    }

    private changeProbesVolumeData(): void {
        this._volume.setVolumeDataChange();
    }

    private changeProbesPosition(): void {
        this._volume.setVolumeDataChange();
        let xCount: number = this._volume.setting.probeXCount;
        let yCount: number = this._volume.setting.probeYCount;
        let zCount: number = this._volume.setting.probeZCount;
        let position: Vector3 = new Vector3();

        for (let x = 0; x < xCount; x++) {
            for (let y = 0; y < yCount; y++) {
                for (let z = 0; z < zCount; z++) {
                    let index = x + z * xCount + y * (xCount * zCount);
                    let probe: Probe = this._probes[index];
                    this._volume.calcPosition(x, y, z, position);

                    probe.x = position.x;
                    probe.y = position.y;
                    probe.z = position.z;
                }
            }
        }
    }

    public onUpdate(): void {
        Engine3D.setting.gi.maxDistance = Engine3D.setting.gi.probeSpace * 1.5;

        let camera = this.transform.scene3D.view.camera;
        let scale = Vector3.distance(camera.transform.worldPosition, camera.transform.targetPos) / 300;
        // console.log(scale);

        if (this._debugMr && this._debugMr.length > 0) {
            for (let i = 0; i < this._debugMr.length; i++) {
                const debugOBJ = this._debugMr[i].transform;
                debugOBJ.scaleX = scale;
                debugOBJ.scaleY = scale;
                debugOBJ.scaleZ = scale;
            }
        }
    }
}
