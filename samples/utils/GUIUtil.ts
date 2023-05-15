import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { AtmosphericComponent, DirectLight, PointLight, SpotLight, Transform } from "@orillusion/core";
import { UVMoveComponent } from "@samples/material/script/UVMoveComponent";

export class GUIUtil {

    //render AtmosphericComponent
    public static renderAtomosphericSky(component: AtmosphericComponent, open: boolean = true, name?: string) {
        name ||= 'AtmosphericSky';
        GUIHelp.addFolder(name);
        GUIHelp.add(component, 'sunX', 0, 1, 0.01);
        GUIHelp.add(component, 'sunY', 0, 1, 0.01);
        GUIHelp.add(component, 'eyePos', 0, 5000, 1);
        GUIHelp.add(component, 'sunRadius', 0, 1000, 0.01);
        GUIHelp.add(component, 'sunRadiance', 0, 100, 0.01);
        GUIHelp.add(component, 'sunBrightness', 0, 10, 0.01);
        GUIHelp.add(component, 'exposure', 0, 2, 0.01);
        GUIHelp.add(component, 'displaySun', 0, 1, 0.01);
        open && GUIHelp.open();
        GUIHelp.endFolder();
    }

    //render transform
    public static renderTransform(transform: Transform, open: boolean = true, name?: string) {
        name ||= 'Transform';
        GUIHelp.addFolder(name);
        GUIHelp.add(transform, 'x', -10.0, 10.0, 0.01);
        GUIHelp.add(transform, 'y', -10.0, 10.0, 0.01);
        GUIHelp.add(transform, 'z', -10.0, 10.0, 0.01);
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

        GUIHelp.open();
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


}