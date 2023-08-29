import { WasmMatrix } from "@orillusion/wasm-matrix/WasmMatrix";
import { Engine3D, Matrix4, Quaternion, Transform, Vector3, append, makeMatrix44 } from "../../src"

class Sample_Matrix {
    matrixList: Transform[];
    constructor() {

    }

    public async run() {
        await WasmMatrix.init(Matrix4.maxCount);

        this.matrixList = [new Transform()];
        let count = 300000;

        for (let i = 1; i < count; i++) {
            const matrix = new Transform();
            matrix.parent = this.matrixList[0];
            this.matrixList.push(matrix);
        }

        let title = document.createElement("h3");
        title.innerHTML = `Update ${count} Matrix`
        title.style.color = '#FFFFFF'
        document.body.appendChild(title);


        this.divA = document.createElement("div");
        this.divA.style.color = '#FFFFFF'
        document.body.appendChild(this.divA);

        this.divB = document.createElement("div");
        this.divB.style.color = '#FFFFFF'
        document.body.appendChild(this.divB);

        document.body.setAttribute('style', 
        `height: 100vh;
        display: flex;
        flex-direction: column;
        justify-content: center;
        text-align: center;`)
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
        this.divA.innerText = "js:  " + count.toFixed(4) + ' ms';

        for (let i = 1; i < 300000; i++) {
            this.matrixList[i].localChange = true;
        }

        let time2 = performance.now();
        WasmMatrix.updateAllContinueTransform(0, Matrix4.useCount, 0);
        let count2 = performance.now() - time2;
        this.divB.innerText = "wasm :" + count2.toFixed(4) + ' ms';
        // console.log("wasm :", count2);

        requestAnimationFrame(() => this.update());
    }
}

new Sample_Matrix().run()