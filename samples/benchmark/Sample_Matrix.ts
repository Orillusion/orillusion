import { WasmMatrix } from "@orillusion/wasm-matrix/WasmMatrix";
import { Engine3D, Matrix4, Quaternion, Transform, Vector3, append, makeMatrix44 } from "../../src"
import { GUI } from "@orillusion/debug/dat.gui.module";
import { GUIHelp } from "@orillusion/debug/GUIHelp";

class Sample_Matrix {
    matrixList: Transform[];
    constructor() {

    }

    public async run() {

        GUIHelp.init();

        await WasmMatrix.isReady();
        await WasmMatrix.init(Matrix4.maxCount);

        this.matrixList = [new Transform()];
        let count = 300000;

        for (let i = 1; i < count; i++) {
            const matrix = new Transform();
            matrix.parent = this.matrixList[0];
            this.matrixList.push(matrix);
        }

        this.divA = document.createElement("div");
        this.divA.style.position = 'absolute'
        this.divA.style.color = '#FFFFFF'
        document.body.appendChild(this.divA);

        this.divB = document.createElement("div");
        this.divB.style.position = 'absolute'
        this.divB.style.color = '#FFFFFF'
        this.divB.style.top = '50px'
        document.body.appendChild(this.divB);

        this.update();
    }

    private divA: HTMLElement;
    private divB: HTMLElement;

    public update() {

        for (let i = 1; i < 300000; i++) {
            this.matrixList[i].localChange = true;
        }

        let time = performance.now();
        for (let i = 1; i < 300000; i++) {
            let mat = this.matrixList[i];
            makeMatrix44(Vector3.ZERO, Vector3.ZERO, Vector3.ONE, mat._worldMatrix);
            append(mat._worldMatrix, this.matrixList[0]._worldMatrix, mat._worldMatrix);
        }

        let count = performance.now() - time;
        this.divA.innerText = "js:  " + count.toString();

        for (let i = 1; i < 300000; i++) {
            this.matrixList[i].localChange = true;
        }

        let time2 = performance.now();
        WasmMatrix.updateAllContinueTransform(0, Matrix4.useCount, 0);
        let count2 = performance.now() - time2;
        this.divB.innerText = "wasm :" + count2.toString();
        // console.log("wasm :", count2);



        requestAnimationFrame(() => this.update());
    }
}

new Sample_Matrix().run()

export let makeMat = function (mat: Matrix4) {

}
