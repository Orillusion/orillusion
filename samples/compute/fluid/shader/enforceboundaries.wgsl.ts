import { common } from './common.wgsl';

export class enforceboundaries {
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

    @group(0) @binding(0) var<storage, read_write> input: InputArgs;
    @group(0) @binding(1) var<storage, read_write> gridvelocity: array<vec4<f32>>;
    @group(0) @binding(2) var<storage, read_write> output: array<vec4<f32>>;
    
    // fn _mod (x: f32, y: f32) -> f32{
    //     return x - floor((x + 0.05) / y) * y;
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
    
        if(cellIndex.x < 0.5){
            gridvelocity[index][0] = 0.0;
        }
        if(cellIndex.x > gridResolution.x - 0.5){
            gridvelocity[index][0] = 0.0;
        }    
        if(cellIndex.y < 0.5){
            gridvelocity[index][1] = 0.0;
        }
        if(cellIndex.y > gridResolution.y - 0.5){
            gridvelocity[index][1] = min(gridvelocity[index][1], 0.0);
        }
        if(cellIndex.z < 0.5){
            gridvelocity[index][2] = 0.0;
        }
        if(cellIndex.z > gridResolution.z - 0.5){
            gridvelocity[index][2] = 0.0;
        }
    }
    `;
}
