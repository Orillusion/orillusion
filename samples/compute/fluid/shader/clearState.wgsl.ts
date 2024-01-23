import { common } from './common.wgsl';

export class clearState {
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
    @group(0) @binding(1) var<storage, read_write> mark: array<f32>;
    @group(0) @binding(2) var<storage, read_write> atomicweight: array<atomic<i32>>;
    @group(0) @binding(3) var<storage, read_write> atomicvelocity: array<atomic<i32>>;
    @group(1) @binding(0) var<storage, read_write> weight: array<vec4<f32>>;
    @group(1) @binding(1) var<storage, read_write> divergence: array<f32>;
    @group(1) @binding(2) var<storage, read_write> pressure: array<f32>;
    @group(1) @binding(3) var<storage, read_write> temppressure: array<f32>;
    
    // fn _mod (x: f32, y: f32) -> f32{
    //     return x - floor((x + 0.0) / y) * y;
    // }
    
    // fn gridtocell (index: u32, resolution: vec3<f32>) -> vec3<f32>{
    //     var indexfloat = f32(index) + f32(0.05);
    //     var cellindex = vec3<f32>(_mod(indexfloat, resolution.x), _mod(floor(indexfloat / resolution.x), resolution.y), 
    //                     floor(indexfloat / resolution.x / resolution.y)); 
    //     return cellindex;
    // }
    
    // fn celltogrid (index: vec3<f32>, resolution: vec3<f32>) -> u32{
    //     var clampindex = clamp(index, vec3<f32>(0.0), resolution - vec3<f32>(1.0));
    //     var gridindex = u32(clampindex.x + clampindex.y * resolution.x + clampindex.z * resolution.x * resolution.y);
    //     return gridindex;//clamp(gridindex, u32(0), u32(resolution.x * resolution.y * resolution.z - 1.0));
    // }
    
    const size = u32(128);
    @compute @workgroup_size(size)
    fn CsMain(
        @builtin(global_invocation_id) GlobalInvocationID : vec3<u32>,
        @builtin(num_workgroups) GroupSize: vec3<u32>
    ) {
        var index = GlobalInvocationID.x;
        if(index >= u32(input.GRIDNUM)){
            return;
        }
    
        atomicStore(&atomicweight[index * u32(4) + u32(0)], i32(0));
        atomicStore(&atomicweight[index * u32(4) + u32(1)], i32(0));
        atomicStore(&atomicweight[index * u32(4) + u32(2)], i32(0));
        atomicStore(&atomicweight[index * u32(4) + u32(3)], i32(0));
    
        atomicStore(&atomicvelocity[index * u32(4) + u32(0)], i32(0));
        atomicStore(&atomicvelocity[index * u32(4) + u32(1)], i32(0));
        atomicStore(&atomicvelocity[index * u32(4) + u32(2)], i32(0));
    
        weight[index][0] = 0.0;
        weight[index][1] = 0.0;
        weight[index][2] = 0.0;
        weight[index][3] = 0.0;
    
        var gridResolution = vec3<f32>(input.gridResolutionX, input.gridResolutionY, input.gridResolutionZ);
        var cellIndex = gridtocell(index, gridResolution + 1.0);  
        var cellTotIndex = celltogrid(cellIndex, gridResolution);
    
        mark[cellTotIndex] = 0.0;
        divergence[cellTotIndex] = 0.0;
        pressure[cellTotIndex] = 0.0;
        temppressure[cellTotIndex] = 0.0;
    }
    `;
}
