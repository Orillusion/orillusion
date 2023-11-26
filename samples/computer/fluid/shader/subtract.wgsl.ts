import { common } from './common.wgsl';

export class subtract {
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
    @group(0) @binding(1) var<storage, read_write> pressure: array<f32>;
    @group(0) @binding(2) var<storage, read_write> gridvelocity: array<vec4<f32>>;
    @group(0) @binding(3) var<storage, read_write> output: array<vec4<f32>>;
    
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
        if(index >= u32(input.GRIDNUM)){
            return;
        }
        
        var gridResolution = vec3<f32>(input.gridResolutionX, input.gridResolutionY, input.gridResolutionZ);
        var cellIndex = gridtocell(index, gridResolution + 1.0);
        var debug = output[index];
        // output[index][0] = f32(cellIndex.x);
        // output[index][1] = f32(cellIndex.y);
        // output[index][2] = f32(cellIndex.z);
        // output[index][3] = f32(index);
    
        var leftXIndex = celltogrid(cellIndex + vec3<f32>(-1.0, 0.0, 0.0), gridResolution);
        var leftX = pressure[leftXIndex];
        var rightXIndex = celltogrid(cellIndex + vec3<f32>(0.0, 0.0, 0.0), gridResolution);
        var rightX = pressure[rightXIndex];  
    
        var bottomYIndex = celltogrid(cellIndex + vec3<f32>(0.0, -1.0, 0.0), gridResolution);
        var bottomY = pressure[bottomYIndex];
        var topYIndex = celltogrid(cellIndex + vec3<f32>(0.0, 0.0, 0.0), gridResolution);
        var topY = pressure[topYIndex];
    
        var backZIndex = celltogrid(cellIndex + vec3<f32>(0.0, 0.0, -1.0), gridResolution);
        var backZ = pressure[backZIndex];
        var frontZIndex = celltogrid(cellIndex + vec3<f32>(0.0, 0.0, 0.0), gridResolution);
        var frontZ = pressure[frontZIndex];    
    
        var gradient = vec3<f32>(rightX - leftX, topY - bottomY, frontZ - backZ) / 1.0;
        var tempvelocity = vec3<f32>(gridvelocity[index][0], gridvelocity[index][1], gridvelocity[index][2]) - gradient;
    
        gridvelocity[index][0] = tempvelocity.x;
        gridvelocity[index][1] = tempvelocity.y;
        gridvelocity[index][2] = tempvelocity.z;
    
        // output[index][0] = f32(gradient.x);
        // output[index][1] = f32(gradient.y);
        // output[index][2] = f32(gradient.z);
        // output[index][3] = f32(index);
    }
    `;
}
