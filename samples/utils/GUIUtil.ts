import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { AtmosphericComponent, BillboardType, Color, DirectLight, Engine3D, GPUCullMode, GlobalFog, GlobalIlluminationComponent, PointLight, SpotLight, Transform, UIImage, UIPanel, UIShadow, View3D } from "@orillusion/core";
import { UVMoveComponent } from "@samples/material/script/UVMoveComponent";

export class GUIUtil {


    //render AtmosphericComponent
    public static renderAtomosphericSky(component: AtmosphericComponent, open: boolean = true, name?: string) {
        name ||= 'AtmosphericSky';
        GUIHelp.addFolder(name);
        GUIHelp.add(component, 'sunX', 0, 1, 0.01);
        GUIHelp.add(component, 'sunY', 0.4, 1.6, 0.01);
        GUIHelp.add(component, 'eyePos', 0, 5000, 1);
        GUIHelp.add(component, 'sunRadius', 0, 1000, 0.01);
        GUIHelp.add(component, 'sunRadiance', 0, 100, 0.01);
        GUIHelp.add(component, 'sunBrightness', 0, 10, 0.01);
        GUIHelp.add(component, 'exposure', 0, 2, 0.01);
        GUIHelp.add(component, 'displaySun', 0, 1, 0.01);
        GUIHelp.add(component, 'enable');

        open && GUIHelp.open();
        GUIHelp.endFolder();
    }

    public static renderGlobalFog(fog: GlobalFog, open: boolean = true, name?: string) {
        name ||= 'GlobalFog';
        GUIHelp.addFolder(name);
        GUIHelp.add(fog, 'fogType', {
            Liner: 0,
            Exp: 1,
            Exp2: 2,
        });
        GUIHelp.add(fog, 'start', -0.0, 1000.0, 0.0001);
        GUIHelp.add(fog, 'end', -0.0, 1000.0, 0.0001);
        GUIHelp.add(fog, 'fogHeightScale', 0.0001, 1.0, 0.0001);
        GUIHelp.add(fog, 'density', 0.0, 1.0, 0.0001);
        GUIHelp.add(fog, 'ins', 0.0, 5.0, 0.0001);
        GUIHelp.add(fog, 'skyFactor', 0.0, 1.0, 0.0001);
        GUIHelp.add(fog, 'skyRoughness', 0.0, 1.0, 0.0001);
        GUIHelp.add(fog, 'overrideSkyFactor', 0.0, 1.0, 0.0001);
        GUIHelp.add(fog, 'falloff', 0.0, 100.0, 0.01);
        GUIHelp.add(fog, 'rayLength', 0.01, 2000.0, 0.01);
        GUIHelp.add(fog, 'scatteringExponent', 1, 40.0, 0.001);
        GUIHelp.add(fog, 'dirHeightLine', 0.0, 20.0, 0.01);
        GUIHelp.addColor(fog, 'fogColor');
        open && GUIHelp.open();
        GUIHelp.endFolder();
    }

    //render transform
    public static renderTransform(transform: Transform, open: boolean = true, name?: string) {
        name ||= 'Transform';
        GUIHelp.addFolder(name);
        GUIHelp.add(transform, 'x', -100.0, 100.0, 0.01);
        GUIHelp.add(transform, 'y', -100.0, 100.0, 0.01);
        GUIHelp.add(transform, 'z', -100.0, 100.0, 0.01);
        GUIHelp.add(transform, 'rotationX', 0.0, 360.0, 0.01);
        GUIHelp.add(transform, 'rotationY', 0.0, 360.0, 0.01);
        GUIHelp.add(transform, 'rotationZ', 0.0, 360.0, 0.01);
        GUIHelp.add(transform, 'scaleX', 0.0, 2.0, 0.01);
        GUIHelp.add(transform, 'scaleY', 0.0, 2.0, 0.01);
        GUIHelp.add(transform, 'scaleZ', 0.0, 2.0, 0.01);

        open && GUIHelp.open();
        GUIHelp.endFolder();
    }

    //render direct light gui panel
    public static renderDirLight(light: DirectLight, open: boolean = true, name?: string) {
        name ||= 'DirectLight';
        GUIHelp.addFolder(name);
        GUIHelp.add(light, 'enable');
        GUIHelp.add(light.transform, 'rotationX', 0.0, 360.0, 0.01);
        GUIHelp.add(light.transform, 'rotationY', 0.0, 360.0, 0.01);
        GUIHelp.add(light.transform, 'rotationZ', 0.0, 360.0, 0.01);
        GUIHelp.addColor(light, 'lightColor');
        GUIHelp.add(light, 'intensity', 0.0, 160.0, 0.01);
        GUIHelp.add(light, 'indirect', 0.0, 10.0, 0.01);
        GUIHelp.add(light, 'castShadow');

        open && GUIHelp.open();
        GUIHelp.endFolder();
    }

    //show point light gui controller
    public static showPointLightGUI(light: PointLight) {
        GUIHelp.addFolder('PointLight');
        GUIHelp.add(light, 'enable');
        GUIHelp.addColor(light, 'lightColor');
        GUIHelp.add(light.transform, 'x', -1000, 1000.0, 0.01);
        GUIHelp.add(light.transform, 'y', -1000, 1000.0, 0.01);
        GUIHelp.add(light.transform, 'z', -1000, 1000.0, 0.01);

        GUIHelp.add(light, 'r', 0.0, 1.0, 0.001);
        GUIHelp.add(light, 'g', 0.0, 1.0, 0.001);
        GUIHelp.add(light, 'b', 0.0, 1.0, 0.001);
        GUIHelp.add(light, 'intensity', 0.0, 1500.0, 0.001);
        GUIHelp.add(light, 'at', 0.0, 1600.0, 0.001);
        GUIHelp.add(light, 'radius', 0.0, 1000.0, 0.001);
        GUIHelp.add(light, 'range', 0.0, 1000.0, 0.001);
        GUIHelp.add(light, 'quadratic', 0.0, 2.0, 0.001);
        GUIHelp.add(light, 'castShadow');

        GUIHelp.open();
        GUIHelp.endFolder();
    }

    public static showSpotLightGUI(light: SpotLight) {
        GUIHelp.addFolder('SpotLight');
        GUIHelp.add(light, 'enable');
        GUIHelp.add(light.transform, 'x', -1000, 1000.0, 0.01);
        GUIHelp.add(light.transform, 'y', -1000, 1000.0, 0.01);
        GUIHelp.add(light.transform, 'z', -1000, 1000.0, 0.01);

        GUIHelp.add(light.transform, 'rotationX', -360, 360.0, 0.01);
        GUIHelp.add(light.transform, 'rotationY', -360, 360.0, 0.01);
        GUIHelp.add(light.transform, 'rotationZ', -360, 360.0, 0.01);

        GUIHelp.addColor(light, 'lightColor');
        GUIHelp.add(light, 'intensity', 0.0, 1600.0, 0.001);
        GUIHelp.add(light, 'at', 0.0, 1600.0, 0.001);
        GUIHelp.add(light, 'radius', 0.0, 1000.0, 0.001);
        GUIHelp.add(light, 'range', 0.0, 1000.0, 0.001);
        GUIHelp.add(light, 'outerAngle', 0.0, 180.0, 0.001);
        GUIHelp.add(light, 'innerAngle', 0.0, 100.0, 0.001);
        GUIHelp.add(light, 'castShadow');

        GUIHelp.open();
        GUIHelp.endFolder();
    }

    public static renderGIComponent(component: GlobalIlluminationComponent): void {
        let volume = component['_volume'];
        let giSetting = volume.setting;
        let view: View3D = Engine3D.views[0];
        let renderJob = Engine3D.getRenderJob(view);

        function onProbesChange(): void {
            component['changeProbesPosition']();
        }

        function debugProbeRay(probeIndex: number, array: Float32Array): void {
            component['debugProbeRay'](probeIndex, array);
        }

        GUIHelp.addFolder('GI');
        GUIHelp.add(giSetting, `lerpHysteresis`, 0.001, 10, 0.0001).onChange(() => {
            onProbesChange();
        });
        GUIHelp.add(giSetting, `depthSharpness`, 1.0, 100.0, 0.001).onChange(() => {
            onProbesChange();
        });
        GUIHelp.add(giSetting, `normalBias`, -100.0, 100.0, 0.001).onChange(() => {
            onProbesChange();
        });
        GUIHelp.add(giSetting, `irradianceChebyshevBias`, -100.0, 100.0, 0.001).onChange(() => {
            onProbesChange();
        });
        GUIHelp.add(giSetting, `rayNumber`, 0, 512, 1).onChange(() => {
            onProbesChange();
        });
        GUIHelp.add(giSetting, `irradianceDistanceBias`, 0.0, 200.0, 0.001).onChange(() => {
            onProbesChange();
        });
        GUIHelp.add(giSetting, `indirectIntensity`, 0.0, 100.0, 0.001).onChange(() => {
            onProbesChange();
        });
        GUIHelp.add(giSetting, `bounceIntensity`, 0.0, 1.0, 0.001).onChange(() => {
            onProbesChange();
        });
        GUIHelp.add(giSetting, `probeRoughness`, 0.0, 1.0, 0.001).onChange(() => {
            onProbesChange();
        });
        GUIHelp.add(giSetting, `ddgiGamma`, 0.0, 4.0, 0.001).onChange(() => {
            onProbesChange();
        });

        GUIHelp.add(giSetting, 'autoRenderProbe');
        GUIHelp.endFolder();

        GUIHelp.addFolder('probe volume');
        GUIHelp.add(volume.setting, 'probeSpace', 0.1, volume.setting.probeSpace * 5, 0.001).onChange(() => {
            onProbesChange();
        });
        GUIHelp.add(volume.setting, 'offsetX', -100, 100, 0.001).onChange(() => {
            onProbesChange();
        });
        GUIHelp.add(volume.setting, 'offsetY', -100, 100, 0.001).onChange(() => {
            onProbesChange();
        });
        GUIHelp.add(volume.setting, 'offsetZ', -100, 100, 0.001).onChange(() => {
            onProbesChange();
        });
        GUIHelp.addButton('show', () => {
            component.object3D.transform.enable = true;
        });
        GUIHelp.addButton('hide', () => {
            component.object3D.transform.enable = false;
        });

        let ddgiProbeRenderer = renderJob.ddgiProbeRenderer;
        GUIHelp.addButton('showRays', () => {
            let array = ddgiProbeRenderer.irradianceComputePass['depthRaysBuffer'].readBuffer();
            let count = Engine3D.setting.gi.probeXCount * Engine3D.setting.gi.probeYCount * Engine3D.setting.gi.probeZCount
            for (let j = 0; j < count; j++) {
                let probeIndex = j;
                debugProbeRay(probeIndex, array);
            }
            debugProbeRay(0, array);
        });

        GUIHelp.addButton('hideRays', () => {
            let count = Engine3D.setting.gi.probeXCount * Engine3D.setting.gi.probeYCount * Engine3D.setting.gi.probeZCount
            for (let j = 0; j < count; j++) {
                let probeIndex = j;
                const rayNumber = Engine3D.setting.gi.rayNumber;
                for (let i = 0; i < rayNumber; i++) {
                    let id = `showRays${probeIndex}${i}`;
                    view.graphic3D.Clear(id);
                }
            }
        });
        GUIHelp.endFolder();
    }

    //render uv move component
    public static renderUVMove(component: UVMoveComponent, open: boolean = true, name?: string) {
        name ||= 'UV Move';
        GUIHelp.addFolder(name);
        GUIHelp.add(component.speed, 'x', -1, 1, 0.01);
        GUIHelp.add(component.speed, 'y', -1, 1, 0.01);
        GUIHelp.add(component.speed, 'z', 0.1, 10, 0.01);
        GUIHelp.add(component.speed, 'w', 0.1, 10, 0.01);
        GUIHelp.add(component, 'enable');

        open && GUIHelp.open();
        GUIHelp.endFolder();
    }

    public static renderUIShadow(image: UIShadow, open: boolean = true, name?: string) {
        name ||= 'Image Shadow';
        GUIHelp.addFolder(name);
        GUIHelp.add(image, 'shadowQuality', 0, 4, 1);

        GUIHelp.add(image, 'shadowRadius', 0.00, 10, 0.01);
        //shadow color
        image.shadowColor = new Color(0.1, 0.1, 0.1, 0.6);
        GUIHelp.addColor(image, 'shadowColor');

        let changeOffset = () => {
            image.shadowOffset = image.shadowOffset;
        }
        GUIHelp.add(image.shadowOffset, 'x', -100, 100, 0.01).onChange(v => changeOffset());
        GUIHelp.add(image.shadowOffset, 'y', -100, 100, 0.01).onChange(v => changeOffset());
        GUIHelp.addButton('Destroy', () => { image.object3D.removeComponent(UIShadow); })
        open && GUIHelp.open();
        GUIHelp.endFolder();
    }

    public static renderUIPanel(panel: UIPanel, open: boolean = true, name?: string) {
        name ||= 'GUI Panel';
        GUIHelp.addFolder(name);
        //cull mode
        let cullMode = {};
        cullMode[GPUCullMode.none] = GPUCullMode.none;
        cullMode[GPUCullMode.front] = GPUCullMode.front;
        cullMode[GPUCullMode.back] = GPUCullMode.back;

        // change cull mode by click dropdown box
        GUIHelp.add({ cullMode: GPUCullMode.none }, 'cullMode', cullMode).onChange((v) => {
            panel.cullMode = v;
        });

        //billboard
        let billboard = {};
        billboard['None'] = BillboardType.None;
        billboard['Y'] = BillboardType.BillboardY;
        billboard['XYZ'] = BillboardType.BillboardXYZ;

        // change billboard by click dropdown box
        GUIHelp.add({ billboard: panel.billboard }, 'billboard', billboard).onChange((v) => {
            panel.billboard = v;
        });

        let scissorData = {
            scissorCornerRadius: panel.scissorCornerRadius,
            scissorFadeOutSize: panel.scissorFadeOutSize,
            panelWidth: 400,
            panelHeight: 300,
            backGroundVisible: panel.visible,
            backGroundColor: panel.color,
            scissorEnable: panel.scissorEnable

        };
        let changeSissor = () => {
            panel.scissorCornerRadius = scissorData.scissorCornerRadius;
            panel.scissorEnable = scissorData.scissorEnable;
            panel.scissorFadeOutSize = scissorData.scissorFadeOutSize;
            panel.color = scissorData.backGroundColor;
            panel.visible = scissorData.backGroundVisible;
            panel.uiTransform.resize(scissorData.panelWidth, scissorData.panelHeight);
        }
        GUIHelp.add(scissorData, 'scissorCornerRadius', 0, 100, 0.1).onChange(() => {
            changeSissor();
        });
        GUIHelp.add(scissorData, 'scissorFadeOutSize', 0, 100, 0.1).onChange(() => {
            changeSissor();
        });
        GUIHelp.add(scissorData, 'panelWidth', 1, 400, 1).onChange(() => {
            changeSissor();
        });
        GUIHelp.add(scissorData, 'panelHeight', 1, 300, 1).onChange(() => {
            changeSissor();
        });
        GUIHelp.add(scissorData, 'backGroundVisible').onChange(() => {
            changeSissor();
        });

        GUIHelp.addColor(scissorData, 'backGroundColor').onChange(() => {
            changeSissor();
        });

        GUIHelp.add(scissorData, 'scissorEnable').onChange(() => {
            changeSissor();
        });

        //depth test
        if (panel['isWorldPanel']) {
            GUIHelp.add(panel, 'depthTest');
        }

        open && GUIHelp.open();
        GUIHelp.endFolder();
    }

}