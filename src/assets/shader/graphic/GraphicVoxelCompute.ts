export let GraphicVoxelCompute = () => {
    let code = /*wgsl*/ `

    struct VertexInfo {
        position:vec3f,
        nx:f32,
        ny:f32,
        nz:f32,
        r:f32,
        g:f32,
        b:f32,
        a:f32,
        uv_x:f32,
        uv_y:f32
    }

    struct VoxelInfo {
        sizeX:f32,
        sizeY:f32,
        sizeZ:f32,
        count:f32,
    }

    struct DrawInfo{
        skipFace:atomic<u32>,
        skipFace2:atomic<u32>,
        skipFace3:atomic<u32>,
        skipFace4:atomic<u32>,
    }

    struct ColorInfo {
        r:f32,
        g:f32,
        b:f32,
        a:f32
    }

    @group(0) @binding(1) var<storage, read_write> vertexBuffer : array<VertexInfo>;
    @group(0) @binding(2) var<storage, read> voxelBuffer : array<u32>;
    @group(0) @binding(3) var<storage, read> palatteBuffer : array<ColorInfo>;
    @group(0) @binding(4) var<storage, read> voxelInfo : VoxelInfo;
    @group(0) @binding(5) var<storage, read_write> drawBuffer : DrawInfo;

    @compute @workgroup_size(256, 1, 1)
    fn CsMain(@builtin(global_invocation_id) globalInvocation_id: vec3<u32>) {
        var voxIndex = globalInvocation_id.y * 256u + globalInvocation_id.x;
        if (voxIndex < u32(voxelInfo.count)) {
            let vox = voxelBuffer[voxIndex];
            if (vox == 0) {
                return;
            }
            let x:u32 = voxIndex % u32(voxelInfo.sizeX);
            let y:u32 = voxIndex / u32(voxelInfo.sizeX) % u32(voxelInfo.sizeY);
            let z:u32 = voxIndex / (u32(voxelInfo.sizeX) * u32(voxelInfo.sizeY));
            var pos: vec3f = vec3f(f32(x) * 0.1 - voxelInfo.sizeX * 0.05, f32(y) * 0.1 - voxelInfo.sizeY * 0.05, f32(z) * 0.1);
            let colorInfo: ColorInfo = palatteBuffer[vox];
            var color: vec4f = vec4f(colorInfo.r, colorInfo.g, colorInfo.b, colorInfo.a);
            drawBox(pos, vec3f(0.1, 0.1, 0.1), color);
        }
    }

    fn drawFace(v1:vec3f, v2:vec3f, v3:vec3f, c1:vec4f, c2:vec4f, c3:vec4f, u1:vec2f, u2:vec2f, u3:vec2f) {
        let n = getNormal(v1,v2,v3);
        var fID = atomicAdd(&drawBuffer.skipFace, 1u); 
        writeVertexBuffer(fID * 3u + 0u, v1, n, c1, u1);
        writeVertexBuffer(fID * 3u + 1u, v2, n, c2, u2);
        writeVertexBuffer(fID * 3u + 2u, v3, n, c3, u3);
    }

    fn drawBox(pos:vec3f, size:vec3f, color:vec4f) {
        let halfX:f32 = size.x / 2.0;
        let halfY:f32 = size.y / 2.0;
        let halfZ:f32 = size.z / 2.0;

        // up
        var v1:vec3f = vec3f(pos.x - halfX, pos.y + halfY, pos.z + halfZ);
        var v2:vec3f = vec3f(pos.x + halfX, pos.y + halfY, pos.z + halfZ);
        var v3:vec3f = vec3f(pos.x + halfX, pos.y + halfY, pos.z - halfZ);
        drawFace(v1, v2, v3, color, color, color, vec2f(1.0, 1.0), vec2f(0.0, 1.0), vec2f(0.0, 0.0));
        v1 = vec3f(pos.x - halfX, pos.y + halfY, pos.z - halfZ);
        v2 = vec3f(pos.x - halfX, pos.y + halfY, pos.z + halfZ);
        v3 = vec3f(pos.x + halfX, pos.y + halfY, pos.z - halfZ);
        drawFace(v1, v2, v3, color, color, color, vec2f(1.0, 0.0), vec2f(1.0, 1.0), vec2f(0.0, 0.0));

        // buttom
        v1 = vec3f(pos.x + halfX, pos.y - halfY, pos.z + halfZ);
        v2 = vec3f(pos.x - halfX, pos.y - halfY, pos.z + halfZ);
        v3 = vec3f(pos.x - halfX, pos.y - halfY, pos.z - halfZ);
        drawFace(v1, v2, v3, color, color, color, vec2f(1.0, 1.0), vec2f(0.0, 1.0), vec2f(0.0, 0.0));
        v1 = vec3f(pos.x + halfX, pos.y - halfY, pos.z - halfZ);
        v2 = vec3f(pos.x + halfX, pos.y - halfY, pos.z + halfZ);
        v3 = vec3f(pos.x - halfX, pos.y - halfY, pos.z - halfZ);
        drawFace(v1, v2, v3, color, color, color, vec2f(1.0, 0.0), vec2f(1.0, 1.0), vec2f(0.0, 0.0));

        // left
        v1 = vec3f(pos.x - halfX, pos.y - halfY, pos.z + halfZ);
        v2 = vec3f(pos.x - halfX, pos.y + halfY, pos.z + halfZ);
        v3 = vec3f(pos.x - halfX, pos.y + halfY, pos.z - halfZ);
        drawFace(v1, v2, v3, color, color, color, vec2f(1.0, 1.0), vec2f(0.0, 1.0), vec2f(0.0, 0.0));
        v1 = vec3f(pos.x - halfX, pos.y - halfY, pos.z - halfZ);
        v2 = vec3f(pos.x - halfX, pos.y - halfY, pos.z + halfZ);
        v3 = vec3f(pos.x - halfX, pos.y + halfY, pos.z - halfZ);
        drawFace(v1, v2, v3, color, color, color, vec2f(1.0, 0.0), vec2f(1.0, 1.0), vec2f(0.0, 0.0));

        // right
        v1 = vec3f(pos.x + halfX, pos.y + halfY, pos.z + halfZ);
        v2 = vec3f(pos.x + halfX, pos.y - halfY, pos.z + halfZ);
        v3 = vec3f(pos.x + halfX, pos.y - halfY, pos.z - halfZ);
        drawFace(v1, v2, v3, color, color, color, vec2f(1.0, 1.0), vec2f(0.0, 1.0), vec2f(0.0, 0.0));
        v1 = vec3f(pos.x + halfX, pos.y + halfY, pos.z - halfZ);
        v2 = vec3f(pos.x + halfX, pos.y + halfY, pos.z + halfZ);
        v3 = vec3f(pos.x + halfX, pos.y - halfY, pos.z - halfZ);
        drawFace(v1, v2, v3, color, color, color, vec2f(1.0, 0.0), vec2f(1.0, 1.0), vec2f(0.0, 0.0));

        // front
        v1 = vec3f(pos.x + halfX, pos.y + halfY, pos.z + halfZ);
        v2 = vec3f(pos.x - halfX, pos.y + halfY, pos.z + halfZ);
        v3 = vec3f(pos.x - halfX, pos.y - halfY, pos.z + halfZ);
        drawFace(v1, v2, v3, color, color, color, vec2f(1.0, 1.0), vec2f(0.0, 1.0), vec2f(0.0, 0.0));
        v1 = vec3f(pos.x - halfX, pos.y - halfY, pos.z + halfZ);
        v2 = vec3f(pos.x + halfX, pos.y - halfY, pos.z + halfZ);
        v3 = vec3f(pos.x + halfX, pos.y + halfY, pos.z + halfZ);
        drawFace(v1, v2, v3, color, color, color, vec2f(0.0, 0.0), vec2f(1.0, 0.0), vec2f(1.0, 1.0));

        // back
        v1 = vec3f(pos.x + halfX, pos.y - halfY, pos.z - halfZ);
        v2 = vec3f(pos.x - halfX, pos.y - halfY, pos.z - halfZ);
        v3 = vec3f(pos.x - halfX, pos.y + halfY, pos.z - halfZ);
        drawFace(v1, v2, v3, color, color, color, vec2f(1.0, 1.0), vec2f(0.0, 1.0), vec2f(0.0, 0.0));

        v1 = vec3f(pos.x + halfX, pos.y + halfY, pos.z - halfZ);
        v2 = vec3f(pos.x + halfX, pos.y - halfY, pos.z - halfZ);
        v3 = vec3f(pos.x - halfX, pos.y + halfY, pos.z - halfZ);
        drawFace(v1, v2, v3, color, color, color, vec2f(1.0, 0.0), vec2f(1.0, 1.0), vec2f(0.0, 0.0));
    }

    fn getNormal(v1:vec3f , v2:vec3f , v3:vec3f) -> vec3f{
        let p0 = v2 - v1;
        let p1 = v3 - v2;
        let n = cross(p0, p1);
        return normalize(n);
    }

    fn writeVertexBuffer(vID:u32, pos:vec3f, normal:vec3f, color:vec4f, uv:vec2f) {
        vertexBuffer[vID].position = pos;
        vertexBuffer[vID].nx = normal.x;
        vertexBuffer[vID].ny = normal.y;
        vertexBuffer[vID].nz = normal.z;
        vertexBuffer[vID].r = color.r;
        vertexBuffer[vID].g = color.g;
        vertexBuffer[vID].b = color.b;
        vertexBuffer[vID].a = color.a;
        vertexBuffer[vID].uv_x = uv.x;
        vertexBuffer[vID].uv_y = uv.y;
    }

    `
    return code;
}
