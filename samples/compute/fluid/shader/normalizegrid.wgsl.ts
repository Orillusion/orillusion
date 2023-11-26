import { common } from './common.wgsl';

export class normalizegrid {
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
    @group(0) @binding(1) var<storage, read_write> weight: array<vec4<f32>>;
    @group(0) @binding(2) var<storage, read_write> gridvelocity: array<vec4<f32>>;
    @group(0) @binding(3) var<storage, read_write> orivelocity: array<vec4<f32>>;
    @group(1) @binding(0) var<storage, read_write> atomicweight: array<atomic<i32>>;
    @group(1) @binding(1) var<storage, read_write> atomicvelocity: array<atomic<i32>>;
    @group(1) @binding(2) var<storage, read_write> output: array<vec4<f32>>;
    
    // fn _mod (x: f32, y: f32) -> f32{
    //     return x - floor((x + 0.0) / y) * y;
    // }
    
    // fn gridtocell (index: u32, resolution: vec3<f32>) -> vec3<f32>{
    //     var indexfloat = f32(index);// + f32(0.05);
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
    
        weight[index][0] = f32(atomicLoad(&atomicweight[index * u32(4) + u32(0)])) / 1000.0;
        weight[index][1] = f32(atomicLoad(&atomicweight[index * u32(4) + u32(1)])) / 1000.0;
        weight[index][2] = f32(atomicLoad(&atomicweight[index * u32(4) + u32(2)])) / 1000.0;
        weight[index][3] = f32(atomicLoad(&atomicweight[index * u32(4) + u32(3)])) / 1000.0;
    
        gridvelocity[index][0] = 0.0;
        if(weight[index][0] > 0.0){
            gridvelocity[index][0] = f32(atomicLoad(&atomicvelocity[index * u32(4) + u32(0)])) / 1000.0 / weight[index][0];
        }
        gridvelocity[index][1] = 0.0;
        if(weight[index][1] > 0.0){
            gridvelocity[index][1] = f32(atomicLoad(&atomicvelocity[index * u32(4) + u32(1)])) / 1000.0 / weight[index][1];
        }
        gridvelocity[index][2] = 0.0;
        if(weight[index][2] > 0.0){
            gridvelocity[index][2] = f32(atomicLoad(&atomicvelocity[index * u32(4) + u32(2)])) / 1000.0 / weight[index][2];
        }
    
        var gridResolution = vec3<f32>(input.gridResolutionX, input.gridResolutionY, input.gridResolutionZ);
        var cellIndex = gridtocell(index, gridResolution + 1.0); 
        // var a = output[0];
        // output[index][0] = f32(index);
        // output[index][1] = (gridResolution + 1.0).x;
        // output[index][2] = floor((f32(index)+f32(0.00001)) / (gridResolution + 1.0).x);
        // // output[index][3] = floor(f32(index) / (gridResolution + 1.0).x) * (gridResolution + 1.0).x;
        // output[index][3] = f32(index) - floor(f32(index) / (gridResolution + 1.0).x) * (gridResolution + 1.0).x;
        var debug = output[index];
        // output[index][0] = f32(cellIndex.x);
        // output[index][1] = f32(cellIndex.y);
        // output[index][2] = f32(cellIndex.z);
        // output[index][3] = f32(index);
    
        if(cellIndex.x > gridResolution.x - 0.5){
            gridvelocity[index][1] = 0.0;
            gridvelocity[index][2] = 0.0;
            weight[index][1] = 0.0;
            weight[index][2] = 0.0;
            weight[index][3] = 0.0;
        }
        if(cellIndex.y > gridResolution.y - 0.5){
            gridvelocity[index][0] = 0.0;
            gridvelocity[index][2] = 0.0;
            weight[index][0] = 0.0;
            weight[index][2] = 0.0;
            weight[index][3] = 0.0;
        }
        if(cellIndex.z > gridResolution.z - 0.5){
            gridvelocity[index][0] = 0.0;
            gridvelocity[index][1] = 0.0;
            weight[index][0] = 0.0;
            weight[index][1] = 0.0;
            weight[index][3] = 0.0;
        }
    
        orivelocity[index][0] = gridvelocity[index][0];
        orivelocity[index][1] = gridvelocity[index][1];
        orivelocity[index][2] = gridvelocity[index][2];
    }
    `;
}
