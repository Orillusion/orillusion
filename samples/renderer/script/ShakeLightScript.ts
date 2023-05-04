import { ComponentBase, AnimationCurve, PointLight } from "../@orillusion/core";

export class ShakeLightScript extends ComponentBase {
    private curve: AnimationCurve;
    private light: PointLight;

    private ins: number = 0;
    private totalTime: number = 0;
    start(): void {
        let index = Math.floor(shakeAnim.length * Math.random());
        let data = JSON.parse(shakeAnim[index]);

        this.curve = new AnimationCurve();
        this.curve.unSerialized2(data);

        this.light = this.object3D.getComponent(PointLight);
        this.ins = this.light.intensity;

        this.totalTime = Math.random() * 10000 + 50000;


    }

    onUpdate() {
        // if (this.light) this.light.intensity = this.ins * this.curve.getValue(((Time.time*0.001) % this.totalTime) );
    }
}

let shakeAnim = [
    `{"keys":[{"time":0.0,"value":0.0,"inTangent":0.0,"outTangent":0.0,"inWeight":0.0,"outWeight":0.0,"weightedMode":0,"tangentMode":0},{"time":0.03832949,"value":0.8331702,"inTangent":21.7370529,"outTangent":-22.2846985,"inWeight":0.333333343,"outWeight":0.333333343,"weightedMode":0,"tangentMode":69},{"time":0.0755386949,"value":0.003974259,"inTangent":-22.2846985,"outTangent":-0.174049288,"inWeight":0.333333343,"outWeight":0.333333343,"weightedMode":0,"tangentMode":5},{"time":0.105488122,"value":0.8734519,"inTangent":0.5785523,"outTangent":0.5785523,"inWeight":0.333333343,"outWeight":0.333333343,"weightedMode":0,"tangentMode":1},{"time":0.1467758,"value":-0.0209245682,"inTangent":-0.142699018,"outTangent":-0.142699018,"inWeight":0.333333343,"outWeight":0.333333343,"weightedMode":0,"tangentMode":1},{"time":0.2458799,"value":0.921106637,"inTangent":1.00000334,"outTangent":1.00000334,"inWeight":0.333333343,"outWeight":0.333333343,"weightedMode":0,"tangentMode":1},{"time":1.0,"value":1.0,"inTangent":2.0,"outTangent":2.0,"inWeight":0.0,"outWeight":0.0,"weightedMode":0,"tangentMode":0}],"length":7,"preWrapMode":8,"postWrapMode":8}`,
    `{"keys":[{"time":0.0,"value":1.0,"inTangent":-6.187479,"outTangent":-6.187479,"inWeight":0.0,"outWeight":0.333333343,"weightedMode":0,"tangentMode":34},{"time":0.137369037,"value":0.150031984,"inTangent":7.513894,"outTangent":7.513894,"inWeight":0.333333343,"outWeight":0.333333343,"weightedMode":0,"tangentMode":34},{"time":0.1688426,"value":0.817752,"inTangent":9.953827,"outTangent":9.953827,"inWeight":0.333333343,"outWeight":0.333333343,"weightedMode":0,"tangentMode":34},{"time":0.353507161,"value":0.5762821,"inTangent":2.73813653,"outTangent":2.73813653,"inWeight":0.333333343,"outWeight":0.333333343,"weightedMode":0,"tangentMode":34},{"time":0.417366773,"value":1.00949848,"inTangent":1.40752745,"outTangent":1.40752745,"inWeight":0.333333343,"outWeight":0.333333343,"weightedMode":0,"tangentMode":34},{"time":0.442120463,"value":0.91125524,"inTangent":-0.6878693,"outTangent":-0.6878693,"inWeight":0.333333343,"outWeight":0.333333343,"weightedMode":0,"tangentMode":34},{"time":0.481633723,"value":1.01371682,"inTangent":-0.901199341,"outTangent":-0.901199341,"inWeight":0.333333343,"outWeight":0.333333343,"weightedMode":0,"tangentMode":34},{"time":0.5190189,"value":0.8493906,"inTangent":-1.02848566,"outTangent":-1.02848566,"inWeight":0.333333343,"outWeight":0.333333343,"weightedMode":0,"tangentMode":34},{"time":0.5885515,"value":1.01199412,"inTangent":-0.7182199,"outTangent":-0.7182199,"inWeight":0.333333343,"outWeight":0.333333343,"weightedMode":0,"tangentMode":34},{"time":0.62157625,"value":0.8873271,"inTangent":0.7198241,"outTangent":0.7198241,"inWeight":0.333333343,"outWeight":0.333333343,"weightedMode":0,"tangentMode":34},{"time":0.64431566,"value":1.0059042,"inTangent":0.532068253,"outTangent":0.532068253,"inWeight":0.333333343,"outWeight":0.333333343,"weightedMode":0,"tangentMode":34},{"time":0.663700044,"value":0.925449848,"inTangent":0.0989820957,"outTangent":0.0989820957,"inWeight":0.333333343,"outWeight":0.333333343,"weightedMode":0,"tangentMode":34},{"time":0.689128935,"value":1.03602576,"inTangent":0.7249485,"outTangent":0.7249485,"inWeight":0.333333343,"outWeight":0.333333343,"weightedMode":0,"tangentMode":34},{"time":0.7104381,"value":0.9742604,"inTangent":-0.4340061,"outTangent":-0.4340061,"inWeight":0.333333343,"outWeight":0.333333343,"weightedMode":0,"tangentMode":34},{"time":0.7366935,"value":1.02757275,"inTangent":-1.27046871,"outTangent":-1.27046871,"inWeight":0.333333343,"outWeight":0.333333343,"weightedMode":0,"tangentMode":34},{"time":0.7854935,"value":0.8044853,"inTangent":-0.511178851,"outTangent":-0.511178851,"inWeight":0.333333343,"outWeight":0.333333343,"weightedMode":0,"tangentMode":34},{"time":0.836351752,"value":0.9849867,"inTangent":-1.72366273,"outTangent":-1.72366273,"inWeight":0.333333343,"outWeight":0.333333343,"weightedMode":0,"tangentMode":34},{"time":0.9149727,"value":0.43492043,"inTangent":-0.1752851,"outTangent":-0.1752851,"inWeight":0.333333343,"outWeight":0.333333343,"weightedMode":0,"tangentMode":34},{"time":1.0,"value":1.0,"inTangent":6.645862,"outTangent":6.645862,"inWeight":0.333333343,"outWeight":0.0,"weightedMode":0,"tangentMode":34}],"length":19,"preWrapMode":8,"postWrapMode":8}`,
    `{"keys":[{"time":0.0,"value":1.0,"inTangent":0.0,"outTangent":-0.918874741,"inWeight":0.0,"outWeight":0.0,"weightedMode":0,"tangentMode":69},{"time":0.946449339,"value":0.130331635,"inTangent":-0.918874741,"outTangent":16.2401047,"inWeight":0.333333343,"outWeight":0.333333343,"weightedMode":0,"tangentMode":69},{"time":1.0,"value":1.0,"inTangent":16.2401047,"outTangent":0.0,"inWeight":0.333333343,"outWeight":0.0,"weightedMode":0,"tangentMode":69}],"length":3,"preWrapMode":8,"postWrapMode":8}`,
    `{"keys":[{"time":0.0,"value":1.0,"inTangent":0.0,"outTangent":-7.10534668,"inWeight":0.0,"outWeight":0.0,"weightedMode":0,"tangentMode":69},{"time":0.120958693,"value":0.140546545,"inTangent":-7.10534668,"outTangent":-0.01237435,"inWeight":0.333333343,"outWeight":0.333333343,"weightedMode":0,"tangentMode":69},{"time":0.946449339,"value":0.130331635,"inTangent":-0.01237435,"outTangent":16.2401047,"inWeight":0.333333343,"outWeight":0.333333343,"weightedMode":0,"tangentMode":69},{"time":1.0,"value":1.0,"inTangent":16.2401047,"outTangent":0.0,"inWeight":0.333333343,"outWeight":0.0,"weightedMode":0,"tangentMode":69}],"length":4,"preWrapMode":8,"postWrapMode":8}`,
    `{"keys":[{"time":0.0,"value":1.0,"inTangent":0.0,"outTangent":-13.1733074,"inWeight":0.0,"outWeight":0.0,"weightedMode":0,"tangentMode":69},{"time":0.03774203,"value":0.5028126,"inTangent":-13.1733074,"outTangent":15.2072763,"inWeight":0.333333343,"outWeight":0.333333343,"weightedMode":0,"tangentMode":69},{"time":0.05343855,"value":0.741513968,"inTangent":15.2072763,"outTangent":-10.4579134,"inWeight":0.333333343,"outWeight":0.333333343,"weightedMode":0,"tangentMode":69},{"time":0.07845405,"value":0.4799041,"inTangent":-10.4579134,"outTangent":7.70842361,"inWeight":0.333333343,"outWeight":0.333333343,"weightedMode":0,"tangentMode":69},{"time":0.141129568,"value":0.963033557,"inTangent":7.70842361,"outTangent":-0.425952643,"inWeight":0.333333343,"outWeight":0.333333343,"weightedMode":0,"tangentMode":69},{"time":0.5262223,"value":0.7990023,"inTangent":-0.425952643,"outTangent":0.424244761,"inWeight":0.333333343,"outWeight":0.333333343,"weightedMode":0,"tangentMode":69},{"time":1.0,"value":1.0,"inTangent":0.424244761,"outTangent":0.0,"inWeight":0.333333343,"outWeight":0.0,"weightedMode":0,"tangentMode":69}],"length":7,"preWrapMode":8,"postWrapMode":8}`,
];
