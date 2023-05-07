import { test, expect, end, delay } from '../util'
import { Engine3D, Matrix4 } from '@orillusion/core';

await test('MatrixDO create test', async () => {
    let mat_0 = new Matrix4();
})

await test('MatrixDO create 5000 test', async () => {
    for (let i = 0; i < 5000; i++) {
        let mat_0 = new Matrix4();
    }
})

await test('MatrixDO create 5000 test', async () => {
    let list: number[] = [];
    for (let i = 0; i < 5000; i++) {
        let mat_0 = new Matrix4();
        list.push(mat_0.index);
    }

    expect(list.length).toEqual(5000);
    // expect(Matrix4.globalMatrixRef.length).toEqual(10010); // about all this runtime init matrix
    expect(Matrix4.matrixBytes.byteLength).toEqual(704000);
})

setTimeout(end, 500)
