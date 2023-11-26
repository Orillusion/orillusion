import { common } from './common.wgsl';

export class divergence {
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
    @group(0) @binding(1) var<storage, read_write> gridvelocity: array<vec4<f32>>;
    @group(0) @binding(2) var<storage, read_write> divergence: array<f32>;
    @group(0) @binding(3) var<storage, read_write> weight: array<vec4<f32>>;
    @group(1) @binding(0) var<storage, read> mark: array<f32>;
    @group(1) @binding(1) var<storage, read_write> output: array<vec4<f32>>;
    
    // fn celltogrid (index: vec3<f32>, resolution: vec3<f32>) -> u32{
    //     var clampindex = clamp(index, vec3<f32>(0.0), resolution - vec3<f32>(1.0));
    //     var gridindex = u32(clampindex.x + clampindex.y * resolution.x + clampindex.z * resolution.x * resolution.y);
    //     return gridindex;//clamp(gridindex, u32(0), u32(resolution.x * resolution.y * resolution.z - 1.0));
    // }
    
    // fn _mod (x: f32, y: f32) -> f32{
    //     return x - floor((x + 0.0) / y) * y;
    // }
    
    // fn gridtocell (index: u32, resolution: vec3<f32>) -> vec3<f32>{
    //     var indexfloat = f32(index) + f32(0.05);
    //     var cellindex = vec3<f32>(_mod(indexfloat, resolution.x), _mod(floor(indexfloat / resolution.x), resolution.y), 
    //                     floor(indexfloat / resolution.x / resolution.y)); 
    //     return cellindex;
    // }
    
    const size = u32(128);
    @compute @workgroup_size(size)
    fn CsMain(
        @builtin(global_invocation_id) GlobalInvocationID : vec3<u32>,
        @builtin(num_workgroups) GroupSize: vec3<u32>
    ) {
        var index = GlobalInvocationID.x;
        if(index >= u32(input.CELLNUM)){
            return;
        }
    
        var gridResolution = vec3<f32>(input.gridResolutionX, input.gridResolutionY, input.gridResolutionZ);
        var maxDensity = input.maxDensity;
    
        var cellIndex = gridtocell(index, gridResolution);  
        var debug = output[index];    
        // output[index][0] = f32(cellIndex.x);
        // output[index][1] = f32(cellIndex.y);
        // output[index][2] = f32(cellIndex.z);
        // output[index][3] = f32(densityIndex);
    
        if(mark[index] == 0.0){
            return;
        }
    
        var leftXIndex = celltogrid(cellIndex, gridResolution + 1.0);
        var leftX = gridvelocity[leftXIndex][0];
        var rightXIndex = celltogrid(cellIndex + vec3<f32>(1.0, 0.0, 0.0), gridResolution + 1.0);
        var rightX = gridvelocity[rightXIndex][0];
    
        var bottomYIndex = celltogrid(cellIndex, gridResolution + 1.0);
        var bottomY = gridvelocity[bottomYIndex][1];
        var topYIndex = celltogrid(cellIndex + vec3<f32>(0.0, 1.0, 0.0), gridResolution + 1.0);
        var topY = gridvelocity[topYIndex][1];
    
        var backZIndex = celltogrid(cellIndex, gridResolution + 1.0);
        var backZ = gridvelocity[backZIndex][2];
        var frontZIndex = celltogrid(cellIndex + vec3<f32>(0.0, 0.0, 1.0), gridResolution + 1.0);
        var frontZ = gridvelocity[frontZIndex][2];    
    
        divergence[index] = ((rightX - leftX) + (topY - bottomY) + (frontZ - backZ)) / 6.0;
    
        var densityIndex = celltogrid(cellIndex, gridResolution + 1.0);
        var density = weight[densityIndex][3];
    
        divergence[index] -= max((density - maxDensity) * 1.0, 0.0);
        // output[index][0] = f32(cellIndex.x);
        // output[index][1] = f32(cellIndex.y);
        // output[index][2] = f32(cellIndex.z);
        // output[index][3] = f32(index);
    }
    `;
}
