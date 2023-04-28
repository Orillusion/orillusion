import { Object3D } from '../../core/entities/Object3D';
import { UnLitMaterial } from '../../materials/UnLitMaterial';
import { Color } from '../../math/Color';
import { Vector3 } from '../../math/Vector3';
import { BoxGeometry } from '../../shape/BoxGeometry';
import { MeshRenderer } from '../renderer/MeshRenderer';
import { AudioListener } from './AudioListener';
import { StaticAudio } from './StaticAudio';
/**
 * Dynamic audio component, with volume varying based on the relative position of the monitor
 * @internal
 * @group Audio
 */
export class PositionAudio extends StaticAudio {
    public panner: PannerNode;
    private _helper: boolean = false;
    private _thickness: number = 0.1;
    private _step: number = 16;
    private _lines: Object3D[] = [];
    constructor() {
        super();
    }
    public setLister(listener: AudioListener): this {
        super.setLister(listener);
        this.panner = this.context?.createPanner() as PannerNode;
        this.panner.panningModel = 'HRTF';
        this.panner.connect(this.gainNode as GainNode);
        return this;
    }
    public showHelper(thickness?: number, step?: number) {
        this._helper = true
        if (thickness) {
            this._thickness = thickness;
        }
        if (step) {
            this._step = step;
        }
        const innerAngle = this.panner.coneInnerAngle;
        const outerAngle = this.panner.coneOuterAngle;
        const diffAngle = (outerAngle - innerAngle) / 2;
        let refLength = this.panner.refDistance;
        let maxLength = this.panner.maxDistance;
        let box = new BoxGeometry(1, 1, 1);

        let m1 = new UnLitMaterial();
        m1.baseColor = new Color(1, 0, 0);
        let m2 = new UnLitMaterial();
        m2.baseColor = new Color(0, 0, 1);
        let m3 = new UnLitMaterial();
        m3.baseColor = new Color(0, 1, 0);
        let m4 = new UnLitMaterial();
        m4.baseColor = new Color(1, 1, 0);
        for (let i = 0; i < this._step; i++) {
            let group = new Object3D();
            let angle = (i * outerAngle) / (this._step - 1);
            let isOuterAngle = angle < diffAngle || angle > innerAngle + diffAngle;
            {
                let line = new Object3D();
                let mr = line.addComponent(MeshRenderer);
                mr.geometry = box;
                mr.material = isOuterAngle ? m2 : m1;
                mr.castShadow = false;
                mr.castGI = false;
                line.localScale = new Vector3(refLength, this._thickness, this._thickness);
                line.x = refLength / 2;
                group.addChild(line);
            }
            {
                let line = new Object3D();
                let mr = line.addComponent(MeshRenderer);
                mr.geometry = box;
                mr.material = isOuterAngle ? m4 : m3;
                mr.castShadow = false;
                mr.castGI = false;
                line.localScale = new Vector3(maxLength, this._thickness / 2, this._thickness / 2);
                line.x = maxLength / 2;
                group.addChild(line);
            }
            group.rotationY = -90 + outerAngle / 2 - angle;
            this.object3D.addChild(group);
            this._lines.push(group);
        }
    }
    public hideHelper() {
        this._helper = false;
        for (let l of this._lines) {
            l.removeAllChild();
            l.removeFromParent();
            l.dispose();
        }
        this._lines.length = 0;
    }
    public toggleHelper() {
        if (this._helper) {
            this.hideHelper();
        }
        else {
            this.showHelper();
        }
    }
    public updateHeler() {
        this.hideHelper();
        this.showHelper();
    }
    public get refDistance() {
        return this.panner.refDistance;
    }
    public set refDistance(value: number) {
        this.panner.refDistance = value;
        if (this._helper) {
            this.updateHeler();
        }
    }
    public get rolloffFactor() {
        return this.panner.rolloffFactor;
    }
    public set rolloffFactor(value: number) {
        this.panner.rolloffFactor = value;
    }
    public get distanceModel() {
        return this.panner.distanceModel;
    }
    public set distanceModel(value: DistanceModelType) {
        this.panner.distanceModel = value;
    }
    public get maxDistance() {
        return this.panner.maxDistance;
    }
    public set maxDistance(value: number) {
        this.panner.maxDistance = value;
        if (this._helper) {
            this.updateHeler();
        }
    }

    public setDirectionalCone(coneInnerAngle: number, coneOuterAngle: number, coneOuterGain: number) {
        this.panner.coneInnerAngle = coneInnerAngle;
        this.panner.coneOuterAngle = coneOuterAngle;
        this.panner.coneOuterGain = coneOuterGain;
        if (this._helper) {
            this.updateHeler();
        }
        return this;
    }
    protected connect() {
        this.source?.connect(this.panner);
    }
    public start() {
    }
    public stop(): this {
        return super.stop();
    }
    public onUpdate() {
        if (!this.playing) {
            return;
        }
        const panner = this.panner;
        const _position = this.object3D.transform.worldPosition;
        const _orientation = this.object3D.transform.forward;
        if (isNaN(_orientation.x)) {
            return;
        }
        if (panner.positionX && this.context) {
            const endTime = this.context.currentTime;
            panner.positionX.linearRampToValueAtTime(_position.x, endTime);
            panner.positionY.linearRampToValueAtTime(_position.y, endTime);
            panner.positionZ.linearRampToValueAtTime(_position.z, endTime);
            panner.orientationX.linearRampToValueAtTime(_orientation.x, endTime);
            panner.orientationY.linearRampToValueAtTime(_orientation.y, endTime);
            panner.orientationZ.linearRampToValueAtTime(_orientation.z, endTime);
        } else {
            panner.setPosition(_position.x, _position.y, _position.z);
            panner.setOrientation(_orientation.x, _orientation.y, _orientation.z);
        }
    }
    public destroy() {
        this.panner.disconnect();
        this.hideHelper();
        super.destroy();
    }
}
