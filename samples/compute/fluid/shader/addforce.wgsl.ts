import { common } from './common.wgsl';

export class addforce {
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
    @group(0) @binding(2) var<storage, read_write> output: array<vec4<f32>>;
    
    fn kernel (position: vec3<f32>, radius: f32, direction: vec3<f32>, origin: vec3<f32>) -> f32{
        var distanceToMouseRay: f32 = length(cross(direction, position - origin));
        var normalizedDistance = max(0.0, distanceToMouseRay / radius);
        return smoothstep(0.9, 1.0, normalizedDistance);
    }
    
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
        var gridSize = vec3<f32>(input.gridSizeX, input.gridSizeY, input.gridSizeZ);
        var timeStep = input.timeStep;
        var mouseVelocity = vec3<f32>(input.mouseVelocityX, input.mouseVelocityY, input.mouseVelocityZ);
        var mouseRayOrigin = vec3<f32>(input.mouseOriginX, input.mouseOriginY, input.mouseOriginZ);
        var mouseRayDirection = vec3<f32>(input.mouseDirectionX, input.mouseDirectionY, input.mouseDirectionZ);
    
        var cellIndex = gridtocell(index, gridResolution + 1.0);  
        var debug = output[index];    
        // output[index][0] = f32(cellIndex.x);
        // output[index][1] = f32(cellIndex.y);
        // output[index][2] = f32(cellIndex.z);
        // output[index][3] = f32(index);
    
        var tempvelocity = vec3<f32>(gridvelocity[index][0], gridvelocity[index][1], gridvelocity[index][2]) 
                         + vec3<f32>(0.0, -40.0 * timeStep, 0.0); //add gravity
    
        var xPosition = vec3<f32>(cellIndex.x, cellIndex.y + 0.5, cellIndex.z + 0.5);
        var yPosition = vec3<f32>(cellIndex.x + 0.5, cellIndex.y, cellIndex.z + 0.5);
        var zPosition = vec3<f32>(cellIndex.x + 0.5, cellIndex.y + 0.5, cellIndex.z);
    
        var mouseRadius: f32 = 5.0;
        var kernelValues = vec3<f32>(kernel(xPosition,mouseRadius,mouseRayDirection,mouseRayOrigin), kernel(yPosition,mouseRadius,mouseRayDirection,mouseRayOrigin), kernel(zPosition,mouseRadius,mouseRayDirection,mouseRayOrigin));
    
        tempvelocity.x += mouseVelocity.x * kernelValues.x * (100.2 * timeStep) ;//* smoothstep(0.0, 1.0 / 200.0, timeStep);
        tempvelocity.y += mouseVelocity.y * kernelValues.y * (100.2 * timeStep) ;//* smoothstep(0.0, 1.0 / 200.0, timeStep);
        tempvelocity.z += mouseVelocity.z * kernelValues.z * (100.2 * timeStep) ;//* smoothstep(0.0, 1.0 / 200.0, timeStep);
    
        gridvelocity[index][0] = tempvelocity.x;
        gridvelocity[index][1] = tempvelocity.y;
        gridvelocity[index][2] = tempvelocity.z;
    
        // output[index][0] = f32(mouseVelocity.x);
        // output[index][1] = f32(mouseVelocity.y);
        // output[index][2] = f32(mouseVelocity.z);
        // output[index][3] = f32(index);
    }
    `;
}
