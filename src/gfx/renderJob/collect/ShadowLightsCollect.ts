import { StorageGPUBuffer } from '../../..';
import { Engine3D } from '../../../Engine3D';
import { ILight } from '../../../components/lights/ILight';

import { LightType } from '../../../components/lights/LightData';
import { Scene3D } from '../../../core/Scene3D';

import { CameraUtil } from '../../../util/CameraUtil';
import { UUID } from '../../../util/Global';
/**
 * @internal
 * @group Lights
 */
export class ShadowLightsCollect {

    public static maxNumDirectionShadow = 8;
    public static maxNumPointShadow = 8;

    public static directionLightList: Map<Scene3D, ILight[]>;
    public static pointLightList: Map<Scene3D, ILight[]>;
    public static shadowBuffer: Map<Scene3D, StorageGPUBuffer>;
    public static shadowLights: Map<Scene3D, Uint32Array>;//Uint32Array = new Uint32Array(16);

    public static init() {
        this.directionLightList = new Map<Scene3D, ILight[]>();
        this.pointLightList = new Map<Scene3D, ILight[]>();

        this.shadowBuffer = new Map<Scene3D, StorageGPUBuffer>;
        this.shadowLights = new Map<Scene3D, Uint32Array>;
    }

    public static createBuffer(scene: Scene3D) {
        if (!this.shadowBuffer.has(scene)) {
            let buffer = new StorageGPUBuffer(4 + 16);
            buffer.visibility = GPUShaderStage.FRAGMENT;
            this.shadowBuffer.set(scene, buffer);

            buffer.setInt32('nDirShadowStart', 0);
            buffer.setInt32('nDirShadowEnd', 1);
            buffer.setInt32('nPointShadowStart', 0);
            buffer.setInt32('nPointShadowEnd', 0);

            let list = new Uint32Array(16);
            this.shadowLights.set(scene, list);

            buffer.setUint32Array('shadowLights', list);
            buffer.apply();
        }
    }

    static getShadowLightList(light: ILight) {
        if (!light.transform.view3D) return null;
        if (light.lightData.lightType == LightType.DirectionLight) {
            let list = this.directionLightList.get(light.transform.view3D.scene);
            if (!list) {
                list = [];
                this.directionLightList.set(light.transform.view3D.scene, list);
            }
            return list;
        } else if (light.lightData.lightType == LightType.PointLight) {
            let list = this.pointLightList.get(light.transform.view3D.scene);
            if (!list) {
                list = [];
                this.pointLightList.set(light.transform.view3D.scene, list);
            }
            return list;
        } else if (light.lightData.lightType == LightType.SpotLight) {
            let list = this.pointLightList.get(light.transform.view3D.scene);
            if (!list) {
                list = [];
                this.pointLightList.set(light.transform.view3D.scene, list);
            }
            return list;
        }
    }

    static getShadowLightWhichScene(scene: Scene3D, type: LightType) {
        if (type == LightType.DirectionLight) {
            let list = this.directionLightList.get(scene);
            if (!list) {
                list = [];
                this.directionLightList.set(scene, list);
            }
            return list;
        } else if (type == LightType.PointLight) {
            let list = this.pointLightList.get(scene);
            if (!list) {
                list = [];
                this.pointLightList.set(scene, list);
            }
            return list;
        }
    }

    static getDirectShadowLightWhichScene(scene: Scene3D) {
        let list = this.directionLightList.get(scene);
        if (!list) {
            list = [];
            this.directionLightList.set(scene, list);
        }
        return list;
    }

    static getPointShadowLightWhichScene(scene: Scene3D) {
        let list = this.pointLightList.get(scene);
        if (!list) {
            list = [];
            this.pointLightList.set(scene, list);
        }
        return list;
    }

    static addShadowLight(light: ILight) {
        if (!light.transform.view3D) return null;
        let scene = light.transform.view3D.scene;

        if (light.lightData.lightType == LightType.DirectionLight) {
            let list = this.directionLightList.get(scene);
            if (!list) {
                list = [];
                this.directionLightList.set(scene, list);
            }
            if (light.lightData.lightType == LightType.DirectionLight && !light['shadowCamera']) {
                light['shadowCamera'] = CameraUtil.createCamera3DObject(null, 'shadowCamera');
                light['shadowCamera'].name = UUID();
                light['shadowCamera'].isShadowCamera = true;
                light['shadowCamera'].orthoOffCenter(
                    Engine3D.setting.shadow.shadowBound,
                    -Engine3D.setting.shadow.shadowBound,
                    Engine3D.setting.shadow.shadowBound,
                    -Engine3D.setting.shadow.shadowBound,
                    1,
                    50000,
                );
            }
            let has = list.indexOf(light) == -1;
            if (has) {
                if (list.length < 8) {
                    light.lightData.castShadowIndex = list.length;
                }
                list.push(light);
            }
            return list;
        } else if (light.lightData.lightType == LightType.PointLight) {
            let list = this.pointLightList.get(scene);
            if (!list) {
                list = [];
                this.pointLightList.set(scene, list);
            }
            let has = list.indexOf(light) == -1;
            if (has) {
                if (list.length < 8) {
                    light.lightData.castShadowIndex = list.length;
                }
                list.push(light);
            }
            return list;
        } else if (light.lightData.lightType == LightType.SpotLight) {
            let list = this.pointLightList.get(scene);
            if (!list) {
                list = [];
                this.pointLightList.set(scene, list);
            }
            let has = list.indexOf(light) == -1;
            if (has) {
                if (list.length < 8) {
                    light.lightData.castShadowIndex = list.length;
                }
                list.push(light);
            }
            return list;
        }
    }

    public static removeShadowLight(light: ILight) {
        if (!light.transform.view3D) return null;
        if (light.lightData.lightType == LightType.DirectionLight) {
            let list = this.directionLightList.get(light.transform.view3D.scene);
            if (list) {
                let index = list.indexOf(light);
                if (index != -1) {
                    list.splice(index, 1);
                }
            }
            return list;
        } else if (light.lightData.lightType == LightType.PointLight) {
            let list = this.pointLightList.get(light.transform.view3D.scene);
            if (list) {
                let index = list.indexOf(light);
                if (index != -1) {
                    list.splice(index, 1);
                }
            }
            return list;
        }
    }


    public static update(scene3D: Scene3D) {
        let shadowBuffer = this.shadowBuffer.get(scene3D);
        let shadowLights = this.shadowLights.get(scene3D);
        let directionLightList = ShadowLightsCollect.directionLightList.get(scene3D);
        let pointLightList = ShadowLightsCollect.pointLightList.get(scene3D);

        let nDirShadowStart: number = 0;
        let nDirShadowEnd: number = 0;
        let nPointShadowStart: number = 0;
        let nPointShadowEnd: number = 0;
        shadowLights.fill(-1);
        if (directionLightList) {
            for (let i = 0; i < directionLightList.length; i++) {
                const light = directionLightList[i];
                shadowLights[i] = light.lightData.index;
            }
            nDirShadowEnd = directionLightList.length;
        }
        shadowBuffer.setInt32('nDirShadowStart', nDirShadowStart);
        shadowBuffer.setInt32('nDirShadowEnd', nDirShadowEnd);

        if (pointLightList) {
            nPointShadowStart = nDirShadowEnd;
            for (let i = nPointShadowStart; i < pointLightList.length; i++) {
                const light = pointLightList[i];
                shadowLights[i] = light.lightData.index;
            }
            nPointShadowEnd = nPointShadowStart + pointLightList.length;
        }
        shadowBuffer.setInt32('nPointShadowStart', nPointShadowStart);
        shadowBuffer.setInt32('nPointShadowEnd', nPointShadowEnd);

        shadowBuffer.setUint32Array(`shadowLights`, shadowLights);
        shadowBuffer.apply();
    }
}
