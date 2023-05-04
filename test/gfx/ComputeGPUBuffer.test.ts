import { test, expect, end, delay } from '../util'
import { Color, ComputeGPUBuffer, Matrix4, Vector2, Vector3, Vector4, webGPUContext } from '@orillusion/core';

await test('ComputeGPUBuffer ', async () => {
    let suc = await webGPUContext.init();
    expect(suc).toEqual(true);

    let computeGPUBuffer = new ComputeGPUBuffer(2048);
    computeGPUBuffer.setMatrix("setMatrix", new Matrix4().identity());
    computeGPUBuffer.setInt32Array("setInt32Array", new Int32Array(4 * 4));
    computeGPUBuffer.setColor("setColor", new Color(1, 0, 0, 1));
    computeGPUBuffer.setInt8("setInt8", 1);
    computeGPUBuffer.setBoolean("setBoolean", true);
    computeGPUBuffer.setInt16("setInt16", 1);
    computeGPUBuffer.setInt32("setInt32", 1);
    computeGPUBuffer.setInt8("alignment", 0);
    computeGPUBuffer.setFloat32Array("setFloat32Array", new Float32Array(4 * 4));
    computeGPUBuffer.setFloat("setFloat", 0.5);
    computeGPUBuffer.setUint8("setUint8", 128);
    computeGPUBuffer.setUint16("setUint16", 128);
    computeGPUBuffer.setUint32("setUint32", 128);
    computeGPUBuffer.setVector2("setVector2", new Vector2(0.5, 10.0));
    computeGPUBuffer.setVector3("setVector3", new Vector3(1.5, 11.0, 55.0));
    computeGPUBuffer.setVector4("setVector4", new Vector4(2, 5, 8, 9));
    computeGPUBuffer.setArray("setArray", [1, 2, 3, 4, 5, 6]);
    computeGPUBuffer.setColorArray("setColorArray", [
        new Color(1, 0, 0, 1),
        new Color(0, 1, 0, 1),
        new Color(0, 0, 1, 1),
    ]);
})


setTimeout(end, 500)
