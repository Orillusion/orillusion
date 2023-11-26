import { common } from './common.wgsl';

export class advect {
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
    @group(0) @binding(3) var<storage, read_write> gridvelocity: array<vec4<f32>>;
    @group(1) @binding(0) var<storage, read_write> output: array<vec4<f32>>;
    
    // fn celltogrid (index: vec3<f32>, resolution: vec3<f32>) -> u32{
    //     var clampindex = clamp(index, vec3<f32>(0.0), resolution - vec3<f32>(1.0));
    //     var gridindex = u32(clampindex.x + clampindex.y * resolution.x + clampindex.z * resolution.x * resolution.y);
    //     return gridindex;//clamp(gridindex, u32(0), u32(resolution.x * resolution.y * resolution.z - 1.0));
    // }
    
    // fn interpvel (index: vec3<f32>, velocity1: vec3<f32>, velocity2: vec3<f32>, position: vec3<f32>) -> vec3<f32>{
    //     var newvelocityx: f32 = (index.x + 1.0 - position.x) * velocity1.x + (position.x - index.x) * velocity2.x;
    //     var newvelocityy: f32 = (index.y + 1.0 - position.y) * velocity1.y + (position.y - index.y) * velocity2.y;
    //     var newvelocityz: f32 = (index.z + 1.0 - position.z) * velocity1.z + (position.z - index.z) * velocity2.z;
    
    //     return vec3<f32>(newvelocityx, newvelocityy, newvelocityz);
    // }
    
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
        var timeStep = input.timeStep;
        var v = velocity[index];
    
        var particlePosition = vec3<f32>(position[index][0], position[index][1], position[index][2]) / gridSize * gridResolution;
        var cellIndex = vec3<f32>(floor(particlePosition));
        var debug = output[index];
        // output[index][0] = f32(cellIndex.x);
        // output[index][1] = f32(cellIndex.y);
        // output[index][2] = f32(cellIndex.z);
        // output[index][3] = f32(index);
    
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
    
        var velocity1 = vec3<f32>(leftX, bottomY, backZ);
        var velocity2 = vec3<f32>(rightX, topY, frontZ);
    
        // var k1 = vec3<f32>(velocity[index][0], velocity[index][1], velocity[index][2]);
        var k1 = interpvel(cellIndex, velocity1, velocity2, particlePosition);
        var k2 = interpvel(cellIndex, velocity1, velocity2, particlePosition + 0.5 * k1 * timeStep);
        var k3 = interpvel(cellIndex, velocity1, velocity2, particlePosition + 0.75 * k2 * timeStep);
        k1 = 2.0 / 9.0 * k1 * timeStep;
        k2 = 3.0 / 9.0 * k2 * timeStep;
        k3 = 4.0 / 9.0 * k3 * timeStep;
        var newPosition = particlePosition + k1 + k2 + k3; 
    
        // var k1 = interpvel(cellIndex, velocity1, velocity2, particlePosition);
        // var k2 = interpvel(cellIndex, velocity1, velocity2, particlePosition + 0.5 * k1 * timeStep);
        // var newPosition = particlePosition + 0.05 * k1 * timeStep + k2 * timeStep; 
    
        newPosition = clamp(newPosition * gridSize / gridResolution, vec3<f32>(0.01), vec3<f32>(gridSize - 0.01));
        position[index][0] = newPosition.x;
        position[index][1] = newPosition.y;
        position[index][2] = newPosition.z;
    } 
    `;
}
