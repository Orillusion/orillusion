import { test, expect, end, delay } from '../util'
import { Color, Engine3D, Struct, StructStorageGPUBuffer, Vector3, webGPUContext } from '@orillusion/core';

class TestInfo extends Struct {
    public index: number = 0;
    public position: Vector3 = new Vector3();
    public rotation: Vector3 = new Vector3();
    public color: Color = new Color();
    constructor() {
        super();
    }
}

await test('StructGPUBuffer ', async () => {
    let suc = await webGPUContext.init();
    expect(suc).toEqual(true);

    let arr_TestInfos: TestInfo[] = [];
    for (let i = 0; i < 100; i++) {
        const info = new TestInfo();
        info.index = i;
        info.position = new Vector3(Math.random(), Math.random(), Math.random());
        info.rotation = new Vector3(Math.random(), Math.random(), Math.random());
        info.color = new Color(Math.random(), Math.random(), Math.random(), Math.random());
        arr_TestInfos.push(info);
    }

    let structStorageGPUBuffer = new StructStorageGPUBuffer<TestInfo>(TestInfo, 100);
    structStorageGPUBuffer.setStruct<TestInfo>(TestInfo, 0, new TestInfo());
    structStorageGPUBuffer.setStructArray<TestInfo>(TestInfo, arr_TestInfos);
})


setTimeout(end, 500)
