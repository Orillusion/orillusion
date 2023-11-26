import { common } from './common.wgsl';

export class transferToGrid {
    public static cs: string = /* wgsl */ `
    ${common.cs}

    struct InputArgs {
        NUM: f32,
        GRIDNUM: f32,
        CELLNUM: f32,
        gridResolutionX: f32,
        gridResolutionY: f32,
        gridResolutionZ: f32,
        gridSizeX: f32,
        gridSizeY: f32,
        gridSizeZ: f32,
        timeStep: f32,
        flipness: f32,
        maxDensity: f32,
        mouseVelocityX: f32,
        mouseVelocityY: f32,
        mouseVelocityZ: f32,
        mouseOriginX: f32,
        mouseOriginY: f32,
        mouseOriginZ: f32,
        mouseDirectionX: f32,
        mouseDirectionY: f32,
        mouseDirectionZ: f32,
        rsv0: f32,
        rsv1: f32,
        rsv2: f32,
    };

    @group(0) @binding(0) var<storage, read> input: InputArgs;
    @group(0) @binding(1) var<storage, read_write> position: array<vec4<f32>>;
    @group(0) @binding(2) var<storage, read_write> velocity: array<vec4<f32>>;
    @group(0) @binding(3) var<storage, read_write> mark: array<f32>;
    @group(1) @binding(0) var<storage, read_write> atomicweight: array<atomic<i32>>;
    @group(1) @binding(1) var<storage, read_write> atomicvelocity: array<atomic<i32>>;
    @group(1) @binding(2) var<storage, read_write> output: array<vec4<f32>>;
    
    // fn celltogrid (index: vec3<f32>, resolution: vec3<f32>) -> u32{
    //     var clampindex = clamp(index, vec3<f32>(0.0), resolution - vec3<f32>(1.0));
    //     var gridindex = u32(clampindex.x + clampindex.y * resolution.x + clampindex.z * resolution.x * resolution.y);
    //     return gridindex;//clamp(gridindex, u32(0), u32(resolution.x * resolution.y * resolution.z - 1.0));
    // }
    
    fn h (r: f32)  -> f32 {
        if (r >= 0.0 && r <= 1.0) {
            return 1.0 - r;
        } else if (r >= -1.0 && r <= 0.0) {
            return 1.0 + r;
        } else {
            return 0.0;
        }
    }
    
    fn k (v: vec3<f32>) -> f32 {
        return h(v.x) * h(v.y) * h(v.z);
    }
    
    const size = u32(128);
    @compute @workgroup_size(size)
    fn CsMain(
        @builtin(global_invocation_id) GlobalInvocationID : vec3<u32>,
        @builtin(num_workgroups) GroupSize: vec3<u32>
    ) {
        var index = GlobalInvocationID.x;
        if(index >= u32(input.NUM)){
            return;
        }
    
        var gridResolution = vec3<f32>(input.gridResolutionX, input.gridResolutionY, input.gridResolutionZ);
        var gridSize = vec3<f32>(input.gridSizeX, input.gridSizeY, input.gridSizeZ);
    
        var particlePosition = vec3<f32>(position[index][0], position[index][1], position[index][2]) / gridSize * gridResolution;
        var cellIndex = vec3<f32>(floor(particlePosition));
    
        var cellTotIndex = celltogrid(cellIndex, gridResolution);
        mark[cellTotIndex] = 1.0;
    
        cellTotIndex = celltogrid(cellIndex, gridResolution + 1.0);
    
        var debug = output[index];
        // output[index][0] = f32(cellIndex.x);
        // output[index][1] = f32(cellIndex.y);
        // output[index][2] = f32(cellIndex.z);
        // output[index][3] = f32(cellTotIndex);
        
        var xPosition = vec3<f32>(cellIndex.x, cellIndex.y + 0.5, cellIndex.z + 0.5);
        var wx = k(particlePosition - xPosition);
        atomicAdd(&atomicweight[cellTotIndex * u32(4) + u32(0)], i32(wx * 1000.0));
    
        var yPosition = vec3<f32>(cellIndex.x + 0.5, cellIndex.y, cellIndex.z + 0.5);
        var wy = k(particlePosition - yPosition);
        atomicAdd(&atomicweight[cellTotIndex * u32(4) + u32(1)], i32(wy * 1000.0));
        
        var zPosition = vec3<f32>(cellIndex.x + 0.5, cellIndex.y + 0.5, cellIndex.z);
        var wz = k(particlePosition - zPosition);
        atomicAdd(&atomicweight[cellTotIndex * u32(4) + u32(2)], i32(wz * 1000.0));
    
        var scalarPosition = vec3<f32>(cellIndex.x + 0.5, cellIndex.y + 0.5, cellIndex.z + 0.5);
        var wscalar = k(particlePosition - scalarPosition);
        atomicAdd(&atomicweight[cellTotIndex * u32(4) + u32(3)], i32(wscalar * 1000.0));
    
        atomicAdd(&atomicvelocity[cellTotIndex * u32(4) + u32(0)], i32(wx * velocity[index][0] * 1000.0));
        atomicAdd(&atomicvelocity[cellTotIndex * u32(4) + u32(1)], i32(wy * velocity[index][1] * 1000.0));
        atomicAdd(&atomicvelocity[cellTotIndex * u32(4) + u32(2)], i32(wz * velocity[index][2] * 1000.0));
    }
    `;
}
