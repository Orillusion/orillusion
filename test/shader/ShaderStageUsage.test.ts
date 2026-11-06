import { test, expect, end } from '../util'
import { ShaderStageUsage } from '@orillusion/core';

// Vertex entry samples a texture two calls deep (like water FFT displacement);
// the fragment entry reads another one through a helper, and one is never used.
const code = /* wgsl */ `
    @group(1) @binding(0) var dispMap: texture_2d<f32>;
    @group(1) @binding(1) var dispMapSampler: sampler;
    @group(1) @binding(2) var baseMap: texture_2d<f32>;
    @group(1) @binding(3) var baseMapSampler: sampler;
    @group(1) @binding(4) var unusedMap: texture_2d<f32>;

    fn displacement(p: vec2<f32>) -> vec3<f32> {
        return textureSampleLevel(dispMap, dispMapSampler, p, 0.0).xyz;
    }
    fn vert(p: vec2<f32>) -> vec3<f32> {
        if (p.x > 0.0) {
            return displacement(p) + displacement(p * 2.0);
        }
        return vec3<f32>(0.0);
    }
    @vertex
    fn VertMain(@location(0) p: vec2<f32>) -> @builtin(position) vec4<f32> {
        return vec4<f32>(vert(p), 1.0);
    }

    fn albedo(uv: vec2<f32>) -> vec4<f32> {
        return textureSample(baseMap, baseMapSampler, uv);
    }
    fn shade(uv: vec2<f32>) -> vec4<f32> { return albedo(uv) * albedo(uv.yx); }
    @fragment
    fn FragMain(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
        return shade(uv);
    }
`;

await test('ShaderStageUsage: bindings used through nested calls are reachable from their entry point', async () => {
    const vs = ShaderStageUsage.reachableIdentifiers(code, 'VertMain');
    const fs = ShaderStageUsage.reachableIdentifiers(code, 'FragMain');

    // vertex: VertMain → vert → displacement → dispMap
    for (const id of ['VertMain', 'vert', 'displacement', 'dispMap', 'dispMapSampler']) expect(vs.has(id)).tobe(true);
    for (const id of ['baseMap', 'baseMapSampler', 'albedo', 'FragMain']) expect(vs.has(id)).tobe(false);

    // fragment: FragMain → shade → albedo → baseMap
    for (const id of ['FragMain', 'shade', 'albedo', 'baseMap', 'baseMapSampler']) expect(fs.has(id)).tobe(true);
    for (const id of ['dispMap', 'dispMapSampler', 'vert']) expect(fs.has(id)).tobe(false);

    // declared but never read
    expect(vs.has('unusedMap') || fs.has('unusedMap')).tobe(false);

    // unknown entry point → nothing reachable
    expect(ShaderStageUsage.reachableIdentifiers(code, 'Missing').size).tobe(0);
})

await test('ShaderStageUsage: functionBodies brace-matches nested blocks and terminates on call cycles', async () => {
    const bodies = ShaderStageUsage.functionBodies(code);
    expect([...bodies.keys()].join()).toEqual('displacement,vert,VertMain,albedo,shade,FragMain');
    // the nested if-block does not end the body early
    expect(bodies.get('vert')!.includes('displacement(p * 2.0)')).tobe(true);
    expect(bodies.get('vert')!.includes('fn VertMain')).tobe(false);

    // a call cycle (not valid WGSL, but the scan must not loop on it)
    const cyc = `fn a() { b(); } fn b() { a(); tex; } fn E() { a(); }`;
    const r = ShaderStageUsage.reachableIdentifiers(cyc, 'E');
    expect(r.has('a') && r.has('b') && r.has('tex')).tobe(true);
})

setTimeout(end, 500)
