import { Camera3D } from "../../../../../core/Camera3D";
import { Scene3D } from "../../../../../core/Scene3D";
import { Probe } from "../../../../renderJob/passRenderer/ddgi/Probe";
import { GlobalUniformGroup } from "./GlobalUniformGroup";
import { LightEntries } from "./groups/LightEntries";
import { ProbeEntries } from "./groups/ProbeEntries";
import { MatrixBindGroup } from "./MatrixBindGroup";

/**
 * @internal
 * Use Global DO Matrix ArrayBuffer Descriptor
 * @group GFX
 */
export class GlobalBindGroup {
    private static _cameraBindGroups: Map<Camera3D, GlobalUniformGroup>;
    private static _lightEntriesMap: Map<Scene3D, LightEntries>;
    private static _probeEntries: ProbeEntries;
    public static modelMatrixBindGroup: MatrixBindGroup;

    public static init() {
        this.modelMatrixBindGroup = new MatrixBindGroup();
        this._cameraBindGroups = new Map<Camera3D, GlobalUniformGroup>();
        this._lightEntriesMap = new Map<Scene3D, LightEntries>();
    }

    public static getCameraGroup(camera: Camera3D) {
        let cameraBindGroup = this._cameraBindGroups.get(camera);
        if (!cameraBindGroup) {
            cameraBindGroup = new GlobalUniformGroup(this.modelMatrixBindGroup);
            this._cameraBindGroups.set(camera, cameraBindGroup);
        }

        if (camera.isShadowCamera) {
            cameraBindGroup.setShadowCamera(camera);
        } else {
            cameraBindGroup.setCamera(camera);
        }
        return cameraBindGroup;
    }

    public static getLightEntries(scene: Scene3D): LightEntries {
        if (!scene) {
            console.log(`getLightEntries scene is null`);
        }

        let lightEntries = this._lightEntriesMap.get(scene);
        if (!lightEntries) {
            lightEntries = new LightEntries();
            this._lightEntriesMap.set(scene, lightEntries);
        }
        return this._lightEntriesMap.get(scene);
    }

    public static updateProbes(probes: Probe[]) {
        if (!this._probeEntries) {
            this._probeEntries = new ProbeEntries();
            this._probeEntries.initDataUniform(probes);
        }
    }

}
