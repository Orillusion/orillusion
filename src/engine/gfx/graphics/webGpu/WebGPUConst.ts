/**
 * @internal
 */
export let GPUAddressMode = {
    clamp_to_edge: 'clamp-to-edge' as GPUAddressMode,
    repeat: 'repeat' as GPUAddressMode,
    mirror_repeat: 'mirror-repeat' as GPUAddressMode,
};
/**
 * @internal
 */
export let GPUBlendFactor = {
    zero: 'zero' as GPUBlendFactor,
    one: 'one' as GPUBlendFactor,
    src: 'src' as GPUBlendFactor,
    one_minus_src: 'one-minus-src' as GPUBlendFactor,
    src_alpha: 'src-alpha' as GPUBlendFactor,
    one_minus_src_alpha: 'one-minus-src-alpha' as GPUBlendFactor,
    dst: 'dst' as GPUBlendFactor,
    one_minus_dst: 'one-minus-dst' as GPUBlendFactor,
    dst_alpha: 'dst-alpha' as GPUBlendFactor,
    one_minus_dst_alpha: 'one-minus-dst-alpha' as GPUBlendFactor,
    src_alpha_saturated: 'src-alpha-saturated' as GPUBlendFactor,
    constant: 'constant' as GPUBlendFactor,
    one_minus_constant: 'one-minus-constant' as GPUBlendFactor,
};
/**
 * @internal
 */
export const blendComponent = {
    srcFactor: 'one',
    dstFactor: 'zero',
    operation: 'add',
};
/**
 * @internal
 */
export const stencilStateFace = {
    compare: 'always',
    failOp: 'keep',
    depthFailOp: 'keep',
    passOp: 'keep',
};
/**
 * @internal
 */
type GPUBlendOperation = 'add' | 'subtract' | 'reverse-subtract' | 'min' | 'max';
/**
 * @internal
 */
type GPUBufferBindingType = 'uniform' | 'storage' | 'read-only-storage';
/**
 * @internal
 */
type GPUCanvasCompositingAlphaMode = 'opaque' | 'premultiplied';
/**
 * @internal
 */
export let GPUCompareFunction = {
    never: 'never' as GPUCompareFunction,
    less: 'less' as GPUCompareFunction,
    equal: 'equal' as GPUCompareFunction,
    less_equal: 'less-equal' as GPUCompareFunction,
    greater: 'greater' as GPUCompareFunction,
    not_equal: 'not-equal' as GPUCompareFunction,
    greater_equal: 'greater-equal' as GPUCompareFunction,
    always: 'always' as GPUCompareFunction,
};
/**
 * @internal
 */
type GPUCompilationMessageType = 'error' | 'warning' | 'info';
/**
 * @internal
 */
export let GPUCullMode = {
    none: 'none' as GPUCullMode,
    front: 'front' as GPUCullMode,
    back: 'back' as GPUCullMode,
};
/**
 * @internal
 */
type GPUDeviceLostReason = 'destroyed';
/**
 * @internal
 */
type GPUErrorFilter = 'out-of-memory' | 'validation';
/**
 * @internal
 */
 export type GPUFeatureName = 'depth-clamping' | 'depth24unorm-stencil8' | 'depth32float-stencil8' | 'pipeline-statistics-query' | 'texture-compression-bc' | 'timestamp-query';
/**
 * @internal
 */
export let GPUFilterMode = {
    nearest : "nearest" as GPUFilterMode,
    linear : "linear" as GPUFilterMode,
}
/**
 * @internal
 */
 export type GPUFrontFace = 'ccw' | 'cw';
/**
 * @internal
 */
type GPUIndexFormat = 'uint16' | 'uint32';
/**
 * @internal
 */
type GPULoadOp = 'load' | `clear`;
type GPUPipelineStatisticName = 'vertex-shader-invocations' | 'clipper-invocations' | 'clipper-primitives-out' | 'fragment-shader-invocations' | 'compute-shader-invocations';
/**
 * @internal
 */
type GPUPowerPreference = 'low-power' | 'high-performance';
/**
 * @internal
 */
type GPUPredefinedColorSpace = 'srgb';
/**
 * @internal
 */
export let GPUPrimitiveTopology = {
    point_list: 'point-list' as GPUPrimitiveTopology,
    line_list: 'line-list' as GPUPrimitiveTopology,
    line_strip: 'line-strip' as GPUPrimitiveTopology,
    triangle_list: 'triangle-list' as GPUPrimitiveTopology,
    triangle_strip: 'triangle-strip' as GPUPrimitiveTopology,
};
/**
 * @internal
 */
type GPUQueryType = 'occlusion' | 'pipeline-statistics' | 'timestamp';
/**
 * @internal
 */
type GPUSamplerBindingType = 'filtering' | 'non-filtering' | 'comparison';
/**
 * @internal
 */
type GPUStencilOperation = 'keep' | 'zero' | 'replace' | 'invert' | 'increment-clamp' | 'decrement-clamp' | 'increment-wrap' | 'decrement-wrap';
/**
 * @internal
 */
type GPUStorageTextureAccess = GPUStorageTextureAccessNew | GPUStorageTextureAccessOld;
/**
 * @internal
 */
type GPUStorageTextureAccessNew = 'write-only';
/**
 * @internal
 */
/** @deprecated */
type GPUStorageTextureAccessOld = 'read-only' | 'write-only';
/**
 * @internal
 */
type GPUStoreOp = 'store' | 'discard';
/**
 * @internal
 */
type GPUTextureAspect = 'all' | 'stencil-only' | 'depth-only';
/**
 * @internal
 */
type GPUTextureDimension = '1d' | '2d' | '3d';
/**
 * @internal
 */
export let GPUTextureFormat = {
    r8unorm: 'r8unorm' as GPUTextureFormat,
    r8snorm: 'r8snorm' as GPUTextureFormat,
    r8uint: 'r8uint' as GPUTextureFormat,
    r8sint: 'r8sint' as GPUTextureFormat,
    r16uint: 'r16uint' as GPUTextureFormat,
    r16sint: 'r16sint' as GPUTextureFormat,
    r16float: 'r16float' as GPUTextureFormat,
    rg8unorm: 'rg8unorm' as GPUTextureFormat,
    rg8snorm: 'rg8snorm' as GPUTextureFormat,
    rg8uint: 'rg8uint' as GPUTextureFormat,
    rg8sint: 'rg8sint' as GPUTextureFormat,
    r32uint: 'r32uint' as GPUTextureFormat,
    r32sint: 'r32sint' as GPUTextureFormat,
    r32float: 'r32float' as GPUTextureFormat,
    rg16uint: 'rg16uint' as GPUTextureFormat,
    rg16sint: 'rg16sint' as GPUTextureFormat,
    rg16float: 'rg16float' as GPUTextureFormat,
    rgba8unorm: 'rgba8unorm' as GPUTextureFormat,
    rgba8unorm_srgb: 'rgba8unorm-srgb' as GPUTextureFormat,
    rgba8snorm: 'rgba8snorm' as GPUTextureFormat,
    rgba8uint: 'rgba8uint' as GPUTextureFormat,
    rgba8sint: 'rgba8sint' as GPUTextureFormat,
    bgra8unorm: 'bgra8unorm' as GPUTextureFormat,
    bgra8unorm_srgb: 'bgra8unorm-srgb' as GPUTextureFormat,
    rgb9e5ufloat: 'rgb9e5ufloat' as GPUTextureFormat,
    rgb10a2unorm: 'rgb10a2unorm' as GPUTextureFormat,
    rg11b10ufloat: 'rg11b10ufloat' as GPUTextureFormat,
    rg32uint: 'rg32uint' as GPUTextureFormat,
    rg32sint: 'rg32sint' as GPUTextureFormat,
    rg32float: 'rg32float' as GPUTextureFormat,
    rgba16uint: 'rgba16uint' as GPUTextureFormat,
    rgba16sint: 'rgba16sint' as GPUTextureFormat,
    rgba16float: 'rgba16float' as GPUTextureFormat,
    rgba32uint: 'rgba32uint' as GPUTextureFormat,
    rgba32sint: 'rgba32sint' as GPUTextureFormat,
    rgba32float: 'rgba32float' as GPUTextureFormat,
    stencil8: 'stencil8' as GPUTextureFormat,
    depth16unorm: 'depth16unorm' as GPUTextureFormat,
    depth24plus: 'depth24plus' as GPUTextureFormat,
    depth24plus_stencil8: 'depth24plus-stencil8' as GPUTextureFormat,
    depth32float: 'depth32float' as GPUTextureFormat,
    bc1_rgba_unorm: 'bc1-rgba-unorm' as GPUTextureFormat,
    bc1_rgba_unorm_srgb: 'bc1-rgba-unorm-srgb' as GPUTextureFormat,
    bc2_rgba_unorm: 'bc2-rgba-unorm' as GPUTextureFormat,
    bc2_rgba_unorm_srgb: 'bc2-rgba-unorm-srgb' as GPUTextureFormat,
    bc3_rgba_unorm: 'bc3-rgba-unorm' as GPUTextureFormat,
    bc3_rgba_unorm_srgb: 'bc3-rgba-unorm-srgb' as GPUTextureFormat,
    bc4_r_unorm: 'bc4-r-unorm' as GPUTextureFormat,
    bc4_r_snorm: 'bc4-r-snorm' as GPUTextureFormat,
    bc5_rg_unorm: 'bc5-rg-unorm' as GPUTextureFormat,
    bc5_rg_snorm: 'bc5-rg-snorm' as GPUTextureFormat,
    bc6h_rgb_ufloat: 'bc6h-rgb-ufloat' as GPUTextureFormat,
    bc6h_rgb_float: 'bc6h-rgb-float' as GPUTextureFormat,
    bc7_rgba_unorm: 'bc7-rgba-unorm' as GPUTextureFormat,
    bc7_rgba_unorm_srgb: 'bc7-rgba-unorm-srgb' as GPUTextureFormat,
    depth24unorm_stencil8: 'depth24unorm-stencil8' as GPUTextureFormat,
    depth32float_stencil8: 'depth32float-stencil8' as GPUTextureFormat,
};
/**
 * @internal
 */
type GPUTextureSampleType = 'float' | 'unfilterable-float' | 'depth' | 'sint' | 'uint';
/**
 * @internal
 */
type GPUTextureViewDimension = '1d' | '2d' | '2d-array' | 'cube' | 'cube-array' | '3d';
/**
 * @internal
 */
export let GPUVertexFormat = {
    uint8x2: 'uint8x2' as GPUVertexFormat,
    uint8x4: 'uint8x4' as GPUVertexFormat,
    sint8x2: 'sint8x2' as GPUVertexFormat,
    sint8x4: 'sint8x4' as GPUVertexFormat,
    unorm8x2: 'unorm8x2' as GPUVertexFormat,
    unorm8x4: 'unorm8x4' as GPUVertexFormat,
    snorm8x2: 'snorm8x2' as GPUVertexFormat,
    snorm8x4: 'snorm8x4' as GPUVertexFormat,
    uint16x2: 'uint16x2' as GPUVertexFormat,
    uint16x4: 'uint16x4' as GPUVertexFormat,
    sint16x2: 'sint16x2' as GPUVertexFormat,
    sint16x4: 'sint16x4' as GPUVertexFormat,
    unorm16x2: 'unorm16x2' as GPUVertexFormat,
    unorm16x4: 'unorm16x4' as GPUVertexFormat,
    snorm16x2: 'snorm16x2' as GPUVertexFormat,
    snorm16x4: 'snorm16x4' as GPUVertexFormat,
    float16x2: 'float16x2' as GPUVertexFormat,
    float16x4: 'float16x4' as GPUVertexFormat,
    float32: 'float32' as GPUVertexFormat,
    float32x2: 'float32x2' as GPUVertexFormat,
    float32x3: 'float32x3' as GPUVertexFormat,
    float32x4: 'float32x4' as GPUVertexFormat,
    uint32: 'uint32' as GPUVertexFormat,
    uint32x2: 'uint32x2' as GPUVertexFormat,
    uint32x3: 'uint32x3' as GPUVertexFormat,
    uint32x4: 'uint32x4' as GPUVertexFormat,
    sint32: 'sint32' as GPUVertexFormat,
    sint32x2: 'sint32x2' as GPUVertexFormat,
    sint32x3: 'sint32x3' as GPUVertexFormat,
    sint32x4: 'sint32x4' as GPUVertexFormat,
};
/**
 * @internal
 */
export let GPUVertexStepMode = {
    vertex: 'vertex' as GPUVertexStepMode,
    instance: 'instance' as GPUVertexStepMode,
};
