export let InstanceUniform: string = /*wgsl*/ `
    #if USE_INSTANCEDRAW
        struct InstanceUniform {
            matrixIDs : array<i32>
        };
        @group(2) @binding(7)
        var<storage, read> instanceDrawID : InstanceUniform;
    #endif
`