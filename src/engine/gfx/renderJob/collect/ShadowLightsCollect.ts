import { Engine3D } from '../../../Engine3D';
import { DirectLight } from '../../../components/lights/DirectLight';
import { LightBase } from '../../../components/lights/LightBase';
import { LightType } from '../../../components/lights/LightData';
import { Scene3D } from '../../../core/Scene3D';
import { View3D } from '../../../core/View3D';
import { CameraUtil } from '../../../util/CameraUtil';
import { UUID } from '../../../util/Global';
/**
 * @internal
 * @group Lights
 */
export class ShadowLightsCollect {

    public static directionLightList: Map<Scene3D, DirectLight[]>;
    public static pointLightList: Map<Scene3D, LightBase[]>;

    public static init() {
        this.directionLightList = new Map<Scene3D, DirectLight[]>();
        this.pointLightList = new Map<Scene3D, LightBase[]>();
    }

    static getShadowLightList(light: LightBase) {
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

    static addShadowLight(light: LightBase) {
        if (!light.transform.view3D) return null;
        if (light.lightData.lightType == LightType.DirectionLight) {
            let list = this.directionLightList.get(light.transform.view3D.scene);
            if (!list) {
                list = [];
                this.directionLightList.set(light.transform.view3D.scene, list);
            }
            if (light instanceof DirectLight && !light.shadowCamera) {
                light.shadowCamera = CameraUtil.createCamera3DObject(null, 'shadowCamera');
                light.shadowCamera.name = UUID();
                light.shadowCamera.isShadowCamera = true;
                light.shadowCamera.orthoOffCenter(
                    Engine3D.setting.shadow.shadowBound,
                    -Engine3D.setting.shadow.shadowBound,
                    Engine3D.setting.shadow.shadowBound,
                    -Engine3D.setting.shadow.shadowBound,
                    1,
                    50000,
                );
            }
            let has = list.indexOf(light as DirectLight) == -1;
            if (has) {
                if (list.length < 8) {
                    light.lightData.castShadowIndex = list.length;
                }
                list.push(light as DirectLight);
            }
            return list;
        } else if (light.lightData.lightType == LightType.PointLight) {
            let list = this.pointLightList.get(light.transform.view3D.scene);
            if (!list) {
                list = [];
                this.pointLightList.set(light.transform.view3D.scene, list);
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
            let list = this.pointLightList.get(light.transform.view3D.scene);
            if (!list) {
                list = [];
                this.pointLightList.set(light.transform.view3D.scene, list);
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

    public static removeShadowLight(light: LightBase) {
        if (!light.transform.view3D) return null;
        if (light.lightData.lightType == LightType.DirectionLight) {
            let list = this.directionLightList.get(light.transform.view3D.scene);
            if (list) {
                let index = list.indexOf(light as DirectLight);
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
}
